/**
 * Enhanced modal with TradingView Lightweight Charts
 */

import { getState, setState, isInWatchlist, toggleWatchlist } from '../store/index.js';
import { formatPrice, formatNumber, formatCurrency } from '../utils/format.js';
import { getCoinName } from '../utils/colors.js';
import { showToast } from './toast.js';

let chartWidget = null;

export function openModal(coin) {
  const state = getState();
  state.currentModalIndex = state.coins.findIndex(c => c.symbol === coin.symbol);
  updateModalContent(coin);
  document.getElementById('enhanced-modal')?.classList.add('active');
  document.body.style.overflow = 'hidden';
  loadTradingViewChart(coin);
}

export function closeModal() {
  document.getElementById('enhanced-modal')?.classList.remove('active');
  document.body.style.overflow = '';
  if (chartWidget) {
    chartWidget = null;
  }
}

export function navigateModal(direction) {
  const state = getState();
  const newIdx = state.currentModalIndex + direction;
  if (newIdx < 0 || newIdx >= state.coins.length) return;
  state.currentModalIndex = newIdx;
  const coin = state.coins[newIdx];
  updateModalContent(coin);
  loadTradingViewChart(coin);
}

function updateModalContent(coin) {
  const state = getState();
  const positive = coin.change24h >= 0;

  // Header
  const symbolEl = document.getElementById('modal-symbol');
  const nameEl = document.getElementById('modal-name');
  if (symbolEl) symbolEl.textContent = coin.symbol;
  if (nameEl) nameEl.textContent = getCoinName(coin.symbol);

  // Price
  const priceEl = document.getElementById('modal-price');
  if (priceEl) priceEl.textContent = '$' + formatPrice(coin.price);

  // Change badge
  const changeEl = document.getElementById('modal-change');
  if (changeEl) {
    changeEl.textContent = `${positive ? '+' : ''}${coin.change24h.toFixed(2)}%`;
    changeEl.className = 'price-badge ' + (positive ? 'positive' : 'negative');
  }

  // Stats
  setText('modal-volume', '$' + formatNumber(coin.volume24h));
  setText('modal-turnover', '$' + formatNumber(coin.turnover24h));
  setText('modal-high', '$' + formatPrice(coin.high24h));
  setText('modal-low', '$' + formatPrice(coin.low24h));

  // Open Interest
  const oiEl = document.getElementById('modal-oi');
  if (oiEl) {
    oiEl.textContent = '$' + formatNumber(coin.openInterest || 0);
    const oiChange = coin.oiChange || 0;
    const oiChangeEl = document.getElementById('modal-oi-change');
    if (oiChangeEl) {
      oiChangeEl.textContent = `${oiChange >= 0 ? '+' : ''}${oiChange.toFixed(2)}%`;
      oiChangeEl.style.color = oiChange >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
    }
  }

  // Funding rate
  const fundingEl = document.getElementById('modal-funding');
  if (fundingEl) {
    const fr = coin.fundingRate || 0;
    fundingEl.textContent = `${fr >= 0 ? '+' : ''}${fr.toFixed(4)}%`;
    fundingEl.style.color = fr >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
  }

  // Price range bar
  const range = coin.high24h - coin.low24h;
  const pct = range > 0 ? ((coin.price - coin.low24h) / range) * 100 : 50;
  const progressEl = document.getElementById('modal-hl-progress');
  if (progressEl) progressEl.style.width = Math.max(5, Math.min(95, pct)) + '%';
  setText('modal-hl-low', '$' + formatNumber(coin.low24h));
  setText('modal-hl-high', '$' + formatNumber(coin.high24h));
  setText('modal-hl-current', formatNumber(coin.price));

  // Volume bars decoration
  generateVolumeBars();

  // Watchlist button state
  const watchBtn = document.getElementById('modal-watchlist-btn');
  if (watchBtn) {
    const inList = isInWatchlist(coin.symbol);
    watchBtn.innerHTML = `<span class="action-icon">${inList ? '⭐' : '☆'}</span><span class="action-label">${inList ? 'Saved' : 'Watch'}</span>`;
    watchBtn.classList.toggle('active', inList);
  }

  // Nav buttons
  const prevBtn = document.getElementById('modal-prev');
  const nextBtn = document.getElementById('modal-next');
  if (prevBtn) prevBtn.disabled = state.currentModalIndex <= 0;
  if (nextBtn) nextBtn.disabled = state.currentModalIndex >= state.coins.length - 1;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function generateVolumeBars() {
  const el = document.getElementById('modal-volume-bars');
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const bar = document.createElement('div');
    bar.className = 'volume-bar-mini';
    bar.style.height = (20 + Math.random() * 80) + '%';
    bar.style.opacity = 0.4 + i * 0.05;
    el.appendChild(bar);
  }
}

async function loadTradingViewChart(coin) {
  const chartContainer = document.getElementById('tradingview-chart');
  if (!chartContainer) return;

  chartContainer.innerHTML = '';

  try {
    // Dynamically import TradingView Lightweight Charts
    const { createChart } = await import('lightweight-charts');

    const isDark = getState().currentTheme === 'dark';
    const chart = createChart(chartContainer, {
      width: chartContainer.clientWidth,
      height: 200,
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
        horzLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
      },
      timeScale: { timeVisible: true, borderColor: 'transparent' },
      rightPriceScale: { borderColor: 'transparent' },
      crosshair: { mode: 0 },
    });

    const positive = coin.change24h >= 0;
    const lineColor = positive ? '#00ff41' : '#ff0040';
    const areaColor = positive ? 'rgba(0,255,65,0.1)' : 'rgba(255,0,64,0.1)';

    const areaSeries = chart.addSeries({ type: 'Area' }, {
      lineColor,
      topColor: areaColor,
      bottomColor: 'transparent',
      lineWidth: 2,
    });

    // Generate synthetic price data based on actual price and change
    const data = generatePriceHistory(coin);
    areaSeries.setData(data);
    chart.timeScale().fitContent();

    chartWidget = chart;

    // Responsive
    const observer = new ResizeObserver(() => {
      chart.applyOptions({ width: chartContainer.clientWidth });
    });
    observer.observe(chartContainer);
  } catch (err) {
    // Fallback: show simple SVG sparkline if TradingView fails
    chartContainer.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">Chart loading...</div>';
    renderFallbackSparkline(chartContainer, coin);
  }
}

function generatePriceHistory(coin) {
  const data = [];
  const now = Math.floor(Date.now() / 1000);
  const hours = 24;
  let price = coin.price / (1 + coin.change24h / 100);

  for (let i = 0; i < hours * 4; i++) {
    const time = now - (hours * 4 - i) * 900; // 15min candles
    const trend = (coin.change24h / 100) / (hours * 4);
    const noise = (Math.random() - 0.5) * coin.price * 0.005;
    price = price * (1 + trend) + noise;
    data.push({ time, value: Math.max(0.00001, price) });
  }

  // Ensure last point matches current price
  data.push({ time: now, value: coin.price });
  return data;
}

function renderFallbackSparkline(container, coin) {
  const points = 50;
  const data = [];
  let val = coin.price;
  const trend = coin.change24h / 100;

  for (let i = 0; i < points; i++) {
    data.unshift(val);
    val *= 1 + (Math.random() - 0.5) * 0.04 * 0.5 - trend / points;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const coords = data.map((v, i) => [i / (points - 1) * 300, 55 - ((v - min) / range) * 50]);
  const pathD = coords.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ');
  const positive = coin.change24h >= 0;
  const color = positive ? '#00ff41' : '#ff0040';

  container.innerHTML = `
    <svg viewBox="0 0 300 60" preserveAspectRatio="none" style="width:100%;height:60px;">
      <path d="${pathD} L300,60 L0,60 Z" fill="${color}" fill-opacity="0.1" />
      <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" />
    </svg>
  `;
}

export function setupModalListeners() {
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('enhanced-modal')?.addEventListener('click', e => {
    if (e.target.id === 'enhanced-modal') closeModal();
  });
  document.getElementById('modal-prev')?.addEventListener('click', () => navigateModal(-1));
  document.getElementById('modal-next')?.addEventListener('click', () => navigateModal(1));

  // Trade button
  document.getElementById('btn-trade')?.addEventListener('click', () => {
    const coin = getState().coins[getState().currentModalIndex];
    if (coin) window.open(`https://www.bybit.com/trade/usdt/${coin.symbol}USDT`, '_blank');
  });

  // Copy button
  document.getElementById('btn-copy')?.addEventListener('click', async () => {
    const coin = getState().coins[getState().currentModalIndex];
    if (!coin) return;
    const text = `${coin.symbol}: $${formatPrice(coin.price)} (${coin.change24h >= 0 ? '+' : ''}${coin.change24h.toFixed(2)}%)`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Price copied!');
    } catch { showToast('Copy failed'); }
  });

  // Share button
  document.getElementById('btn-share')?.addEventListener('click', async () => {
    const coin = getState().coins[getState().currentModalIndex];
    if (!coin) return;
    const shareData = {
      title: `${coin.symbol} on Bybit`,
      text: `${coin.symbol}: $${formatPrice(coin.price)} (${coin.change24h >= 0 ? '+' : ''}${coin.change24h.toFixed(2)}%)`,
      url: `https://www.bybit.com/trade/usdt/${coin.symbol}USDT`,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
        showToast('Link copied!');
      }
    } catch (e) {
      if (e.name !== 'AbortError') showToast('Share failed');
    }
  });

  // Watchlist button in modal
  document.getElementById('modal-watchlist-btn')?.addEventListener('click', () => {
    const coin = getState().coins[getState().currentModalIndex];
    if (!coin) return;
    const added = toggleWatchlist(coin.symbol);
    const btn = document.getElementById('modal-watchlist-btn');
    if (btn) {
      btn.innerHTML = `<span class="action-icon">${added ? '⭐' : '☆'}</span><span class="action-label">${added ? 'Saved' : 'Watch'}</span>`;
      btn.classList.toggle('active', added);
    }
    showToast(added ? `${coin.symbol} added to watchlist` : `${coin.symbol} removed`);
  });

  // Swipe to close
  let touchStartY = 0;
  const modalContent = document.querySelector('.enhanced-modal-content');
  if (modalContent) {
    modalContent.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
    modalContent.addEventListener('touchend', e => {
      if (e.changedTouches[0].clientY - touchStartY > 100) closeModal();
    }, { passive: true });
  }
}
