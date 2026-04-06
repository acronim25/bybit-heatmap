/**
 * Bybit Futures Heatmap — Main Entry Point
 */

// Styles
import './styles/variables.css';
import './styles/layout.css';
import './styles/filters.css';
import './styles/bubbles.css';
import './styles/modal.css';
import './styles/responsive.css';

// Modules
import { getState, setState, toggleTheme, on } from './store/index.js';
import { fetchMarketData, connectWebSocket, startPolling, updateWsSubscriptions } from './api/bybit.js';
import { renderBubbles, handleResize } from './components/bubbles.js';
import { setupModalListeners, closeModal, navigateModal } from './components/modal.js';
import { setupFilterListeners, applyFilters } from './components/filters.js';
import { initWatchlist } from './components/watchlist.js';
import { checkVolumeSpikes, showAlert, requestNotificationPermission } from './components/notifications.js';

// Error boundary
window.addEventListener('error', (e) => {
  console.error('[Error]', e.error);
  showAlert('Something went wrong. Try refreshing.', 'error');
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[Error] Unhandled promise:', e.reason);
});

// Fallback data
const FALLBACK_DATA = [
  { symbol: 'BTC', fullSymbol: 'BTCUSDT', price: 67543.21, change24h: 2.34, volume24h: 285e9, turnover24h: 192e9, high24h: 68200, low24h: 65800, openInterest: 0, fundingRate: 0.01, oiChange: 0 },
  { symbol: 'ETH', fullSymbol: 'ETHUSDT', price: 3542.18, change24h: 1.87, volume24h: 152e9, turnover24h: 538e9, high24h: 3580.5, low24h: 3450.2, openInterest: 0, fundingRate: 0.005, oiChange: 0 },
  { symbol: 'SOL', fullSymbol: 'SOLUSDT', price: 178.92, change24h: 5.23, volume24h: 42e9, turnover24h: 752e8, high24h: 182.4, low24h: 168.7, openInterest: 0, fundingRate: 0.008, oiChange: 0 },
  { symbol: 'XRP', fullSymbol: 'XRPUSDT', price: 0.6234, change24h: -1.25, volume24h: 21e9, turnover24h: 131e8, high24h: 0.6345, low24h: 0.6123, openInterest: 0, fundingRate: -0.002, oiChange: 0 },
  { symbol: 'BNB', fullSymbol: 'BNBUSDT', price: 612.45, change24h: -0.52, volume24h: 89e8, turnover24h: 545e7, high24h: 618.9, low24h: 605.1, openInterest: 0, fundingRate: 0.003, oiChange: 0 },
  { symbol: 'ADA', fullSymbol: 'ADAUSDT', price: 0.5845, change24h: 0.89, volume24h: 68e8, turnover24h: 397e7, high24h: 0.5923, low24h: 0.5767, openInterest: 0, fundingRate: 0.001, oiChange: 0 },
  { symbol: 'AVAX', fullSymbol: 'AVAXUSDT', price: 42.18, change24h: 3.45, volume24h: 89e8, turnover24h: 375e7, high24h: 43.25, low24h: 40.65, openInterest: 0, fundingRate: 0.004, oiChange: 0 },
  { symbol: 'DOT', fullSymbol: 'DOTUSDT', price: 8.92, change24h: -2.14, volume24h: 42e8, turnover24h: 374e7, high24h: 9.15, low24h: 8.71, openInterest: 0, fundingRate: -0.001, oiChange: 0 },
  { symbol: 'LINK', fullSymbol: 'LINKUSDT', price: 18.45, change24h: 4.56, volume24h: 62e8, turnover24h: 114e8, high24h: 18.92, low24h: 17.58, openInterest: 0, fundingRate: 0.006, oiChange: 0 },
  { symbol: 'DOGE', fullSymbol: 'DOGEUSDT', price: 0.165, change24h: -3.2, volume24h: 38e8, turnover24h: 298e7, high24h: 0.172, low24h: 0.158, openInterest: 0, fundingRate: -0.003, oiChange: 0 },
];

async function init() {
  const state = getState();
  setState({ isLoading: true });

  // Apply saved theme
  document.body.setAttribute('data-theme', state.currentTheme);
  document.getElementById('theme-icon').textContent = state.currentTheme === 'dark' ? '🌙' : '☀️';

  // Loading timeout
  const loadingTimeout = setTimeout(() => { if (getState().isLoading) hideLoading(true); }, 8000);

  // Init UI
  setupEventListeners();
  setupFilterListeners();
  setupModalListeners();
  initWatchlist();

  // Fetch data
  let coins = null;
  let isFallback = false;

  try {
    coins = await fetchMarketData();
    if (!coins) { coins = [...FALLBACK_DATA]; isFallback = true; }
  } catch {
    coins = [...FALLBACK_DATA]; isFallback = true;
  }

  clearTimeout(loadingTimeout);

  if (coins.length > 0) {
    setState({ coins, filteredCoins: coins });
    hideLoading(isFallback);
    renderBubbles(coins);
    updateStats(coins);
    applyFilters();

    if (!isFallback) {
      checkVolumeSpikes(coins);
      connectWebSocket((updatedCoins) => {
        setState({ coins: updatedCoins });
        applyFilters();
        updateStats(updatedCoins);
        checkVolumeSpikes(updatedCoins);
      });
      startPolling((newCoins) => {
        setState({ coins: newCoins });
        const filtered = applyFilters();
        renderBubbles(filtered);
        updateStats(newCoins);
        checkVolumeSpikes(newCoins);
        updateWsSubscriptions(newCoins);
      }, 30000);
    }
  } else {
    hideLoading(true);
    showAlert('Failed to load data', 'error');
  }

  registerServiceWorker();
}

function hideLoading(isFallback = false) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) { overlay.style.display = 'none'; overlay.classList.add('hidden'); }
  setState({ isLoading: false });
  if (isFallback) showAlert('Using cached data — live feed unavailable', 'info');
}

function updateStats(coins) {
  const bull = coins.filter(c => c.change24h > 0).length;
  const bear = coins.filter(c => c.change24h < 0).length;
  const bullEl = document.getElementById('stat-bullish');
  const bearEl = document.getElementById('stat-bearish');
  if (bullEl) bullEl.textContent = bull;
  if (bearEl) bearEl.textContent = bear;
}

function setupEventListeners() {
  // Theme
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const t = toggleTheme();
    document.getElementById('theme-icon').textContent = t === 'dark' ? '🌙' : '☀️';
    const state = getState();
    if (state.coins.length > 0) {
      if (state.rafId) cancelAnimationFrame(state.rafId);
      renderBubbles(state.filteredCoins.length > 0 ? state.filteredCoins : state.coins);
    }
  });

  // Alert close
  document.getElementById('alert-close')?.addEventListener('click', () => {
    document.getElementById('alert-banner')?.classList.remove('show');
  });

  // Alert toggle — request notification permission
  document.getElementById('alert-toggle')?.addEventListener('click', () => {
    requestNotificationPermission();
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    else if (e.key === 'ArrowLeft') {
      if (document.getElementById('enhanced-modal')?.classList.contains('active')) navigateModal(-1);
    }
    else if (e.key === 'ArrowRight') {
      if (document.getElementById('enhanced-modal')?.classList.contains('active')) navigateModal(1);
    }
    else if ((e.key === 't' || e.key === 'T') && e.target.tagName !== 'INPUT') {
      toggleTheme();
      document.getElementById('theme-icon').textContent = getState().currentTheme === 'dark' ? '🌙' : '☀️';
    }
    else if ((e.key === 's' || e.key === 'S') && e.target.tagName !== 'INPUT') {
      e.preventDefault();
      document.getElementById('filter-search')?.focus();
    }
  });

  // Resize
  window.addEventListener('resize', handleResize);

  // WS indicator
  on('change:wsConnected', (connected) => {
    document.getElementById('ws-indicator')?.classList.toggle('connected', connected);
  });

  // Filter changes → re-render
  on('filtersChange', () => {
    const filtered = applyFilters();
    const state = getState();
    if (state.rafId) cancelAnimationFrame(state.rafId);
    renderBubbles(filtered);
  });
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try { await navigator.serviceWorker.register('/sw.js'); } catch { /* */ }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
