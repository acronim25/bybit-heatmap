/**
 * Bybit API — REST + WebSocket with automatic fallback
 */

import { validateTickerResponse, validateTicker, ValidationError } from './validation.js';
import { getState, setState, emit } from '../store/index.js';

const API_URL = 'https://api.bybit.com/v5/market/tickers';
const WS_URL = 'wss://stream.bybit.com/v5/public/linear';
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];

let ws = null;
let reconnectAttempt = 0;
let pollingInterval = null;
let oiHistory = {}; // track open interest changes

// ─── REST API ───

export async function fetchMarketData() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${API_URL}?category=linear`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const rawList = validateTickerResponse(data);

    const coins = rawList
      .map(raw => validateTicker(raw))
      .filter(Boolean)
      .sort((a, b) => b.volume24h - a.volume24h);

    // Compute OI change from history
    coins.forEach(coin => {
      const prev = oiHistory[coin.fullSymbol];
      if (prev !== undefined && prev > 0) {
        coin.oiChange = ((coin.openInterest - prev) / prev) * 100;
      } else {
        coin.oiChange = 0;
      }
      oiHistory[coin.fullSymbol] = coin.openInterest;
    });

    return coins;
  } catch (err) {
    if (err instanceof ValidationError) {
      console.error('[API] Validation failed:', err.message);
    } else {
      console.warn('[API] Fetch failed:', err.message);
    }
    return null;
  }
}

// ─── WebSocket ───

export function connectWebSocket(onUpdate) {
  if (ws) return;

  try {
    ws = new WebSocket(WS_URL);
  } catch (err) {
    console.warn('[WS] Connection failed, falling back to polling');
    startPolling(onUpdate);
    return;
  }

  ws.onopen = () => {
    console.log('[WS] Connected');
    reconnectAttempt = 0;
    setState({ wsConnected: true });

    // Subscribe to all USDT perp tickers — batch in groups of 10 (Bybit limit)
    const { coins } = getState();
    const allSymbols = coins.length > 0
      ? coins.map(c => `tickers.${c.fullSymbol}`)
      : ['tickers.BTCUSDT', 'tickers.ETHUSDT', 'tickers.SOLUSDT'];

    for (let i = 0; i < allSymbols.length; i += 10) {
      const batch = allSymbols.slice(i, i + 10);
      ws.send(JSON.stringify({ op: 'subscribe', args: batch }));
    }
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.topic?.startsWith('tickers.') && msg.data) {
        handleTickerUpdate(msg.data, onUpdate);
      }
    } catch { /* ignore parse errors */ }
  };

  ws.onclose = () => {
    ws = null;
    setState({ wsConnected: false });
    console.log('[WS] Disconnected');

    const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt, RECONNECT_DELAYS.length - 1)];
    reconnectAttempt++;
    console.log(`[WS] Reconnecting in ${delay}ms...`);
    setTimeout(() => connectWebSocket(onUpdate), delay);
  };

  ws.onerror = () => {
    ws?.close();
  };
}

function handleTickerUpdate(data, onUpdate) {
  const { coins } = getState();
  const symbol = data.symbol;
  if (!symbol) return;

  const idx = coins.findIndex(c => c.fullSymbol === symbol);
  if (idx === -1) return;

  const coin = coins[idx];
  if (data.lastPrice) coin.price = parseFloat(data.lastPrice);
  if (data.price24hPcnt) coin.change24h = parseFloat(data.price24hPcnt) * 100;
  if (data.volume24h) coin.volume24h = parseFloat(data.volume24h);
  if (data.turnover24h) coin.turnover24h = parseFloat(data.turnover24h);
  if (data.highPrice24h) coin.high24h = parseFloat(data.highPrice24h);
  if (data.lowPrice24h) coin.low24h = parseFloat(data.lowPrice24h);
  if (data.openInterest) {
    const newOI = parseFloat(data.openInterest) * coin.price;
    if (coin.openInterest > 0) {
      coin.oiChange = ((newOI - coin.openInterest) / coin.openInterest) * 100;
    }
    coin.openInterest = newOI;
  }
  if (data.fundingRate) coin.fundingRate = parseFloat(data.fundingRate) * 100;

  onUpdate?.(coins);
}

export function updateWsSubscriptions(coins) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  // Subscribe ALL contracts in batches of 10
  const topics = coins.map(c => `tickers.${c.fullSymbol}`);
  for (let i = 0; i < topics.length; i += 10) {
    ws.send(JSON.stringify({ op: 'subscribe', args: topics.slice(i, i + 10) }));
  }
}

// ─── Polling fallback ───

export function startPolling(onUpdate, intervalMs = 30000) {
  stopPolling();
  pollingInterval = setInterval(async () => {
    const data = await fetchMarketData();
    if (data) onUpdate?.(data);
  }, intervalMs);
}

export function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

export function disconnectWebSocket() {
  if (ws) {
    ws.onclose = null; // prevent reconnect
    ws.close();
    ws = null;
  }
  stopPolling();
}
