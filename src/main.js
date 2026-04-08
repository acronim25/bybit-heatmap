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
const fb = (s, p, c, v) => ({ symbol: s, fullSymbol: s+'USDT', price: p, change24h: c, volume24h: v, turnover24h: v*0.7, high24h: p*1.02, low24h: p*0.98, openInterest: 0, fundingRate: c > 0 ? 0.005 : -0.003, oiChange: 0 });
const FALLBACK_DATA = [
  fb('BTC',67543,2.34,285e9), fb('ETH',3542,1.87,152e9), fb('SOL',178,-5.23,42e9),
  fb('XRP',0.62,-1.25,21e9), fb('BNB',612,-0.52,89e8), fb('DOGE',0.165,8.2,68e8),
  fb('ADA',0.58,0.89,58e8), fb('AVAX',42,3.45,49e8), fb('DOT',8.9,-2.1,42e8),
  fb('LINK',18.4,4.56,40e8), fb('MATIC',0.78,1.2,38e8), fb('UNI',12.5,-1.8,35e8),
  fb('SHIB',0.000025,6.7,32e8), fb('LTC',92,-0.9,30e8), fb('ATOM',11.2,2.1,28e8),
  fb('NEAR',7.8,3.3,25e8), fb('APT',13.5,-4.1,22e8), fb('ARB',1.45,1.9,20e8),
  fb('OP',3.2,2.8,18e8), fb('FIL',8.1,-3.5,16e8), fb('SUI',1.8,7.2,15e8),
  fb('INJ',38,-2.7,14e8), fb('SEI',0.85,5.1,13e8), fb('TIA',14.2,-1.3,12e8),
  fb('PEPE',0.0000018,12.5,11e8), fb('FET',2.3,4.8,10e8), fb('RUNE',6.5,-3.2,9e8),
  fb('IMX',2.9,1.1,8e8), fb('STX',2.1,3.7,7e8), fb('BONK',0.000032,9.4,6e8),
];

async function init() {
  try {
  const state = getState();

  // Apply saved theme
  document.body.setAttribute('data-theme', state.currentTheme);
  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) themeIcon.textContent = state.currentTheme === 'dark' ? '🌙' : '☀️';

  // Init UI immediately (no waiting)
  setupEventListeners();
  setupFilterListeners();
  setupModalListeners();
  initWatchlist();

  // STEP 1: Show fallback data INSTANTLY — no waiting for API
  setState({ coins: FALLBACK_DATA, filteredCoins: FALLBACK_DATA });
  hideLoading();
  renderBubbles(FALLBACK_DATA);
  updateStats(FALLBACK_DATA);
  applyFilters();

  // STEP 2: Fetch real data in background and swap in
  fetchMarketData().then(coins => {
    if (coins && coins.length > 0) {
      setState({ coins, filteredCoins: coins });
      const filtered = applyFilters();
      renderBubbles(filtered);
      updateStats(coins);
      checkVolumeSpikes(coins);

      // Start real-time updates
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
  }).catch(() => {
    // Fallback already showing — just notify
    showAlert('Live data unavailable — showing cached prices', 'info');
  });

  registerServiceWorker();
  } catch (err) {
    console.error('[Init] Fatal error:', err);
    hideLoading();
  }
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    // Remove from DOM after transition
    setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 600);
  }
  setState({ isLoading: false });
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
