/**
 * Central state management store
 * Simple reactive store with event-based updates
 */

const listeners = new Map();

const state = {
  // Data
  coins: [],
  filteredCoins: [],
  watchlist: loadWatchlist(),

  // UI
  currentTheme: loadTheme(),
  currentModalIndex: -1,
  isLoading: true,
  alertsEnabled: false,

  // Filters
  filters: {
    category: 'all',
    sortBy: 'volume',
    sortDesc: true,
    search: '',
    minVolume: 0,
    fundingRate: 'all',     // 'all' | 'positive' | 'negative'
    oiChange: 'all',        // 'all' | 'increasing' | 'decreasing'
  },

  // Volume spike tracking
  volumeHistory: {},

  // Animation
  rafId: null,
  timers: {},

  // WebSocket
  wsConnected: false,
};

function loadWatchlist() {
  try {
    return new Set(JSON.parse(localStorage.getItem('bybit-watchlist') || '[]'));
  } catch {
    return new Set();
  }
}

function loadTheme() {
  try {
    return localStorage.getItem('bybit-heatmap-theme') || 'dark';
  } catch {
    return 'dark';
  }
}

export function getState() {
  return state;
}

export function setState(updates) {
  const changed = [];
  for (const [key, value] of Object.entries(updates)) {
    if (state[key] !== value) {
      state[key] = value;
      changed.push(key);
    }
  }
  if (changed.length > 0) {
    emit('stateChange', { changed, state });
    changed.forEach(key => emit(`change:${key}`, state[key]));
  }
}

export function updateFilters(filterUpdates) {
  state.filters = { ...state.filters, ...filterUpdates };
  emit('filtersChange', state.filters);
}

// Watchlist
export function toggleWatchlist(symbol) {
  if (state.watchlist.has(symbol)) {
    state.watchlist.delete(symbol);
  } else {
    state.watchlist.add(symbol);
  }
  saveWatchlist();
  emit('watchlistChange', state.watchlist);
  return state.watchlist.has(symbol);
}

export function isInWatchlist(symbol) {
  return state.watchlist.has(symbol);
}

function saveWatchlist() {
  try {
    localStorage.setItem('bybit-watchlist', JSON.stringify([...state.watchlist]));
  } catch { /* silent */ }
}

// Theme
export function toggleTheme() {
  const newTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
  state.currentTheme = newTheme;
  document.body.setAttribute('data-theme', newTheme);
  try { localStorage.setItem('bybit-heatmap-theme', newTheme); } catch { /* */ }
  emit('themeChange', newTheme);
  return newTheme;
}

// Events
export function on(event, callback) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(callback);
  return () => listeners.get(event)?.delete(callback);
}

export function emit(event, data) {
  listeners.get(event)?.forEach(cb => {
    try { cb(data); } catch (e) { console.error(`[Store] Event handler error (${event}):`, e); }
  });
}

export function clearTimers() {
  Object.values(state.timers).forEach(t => clearTimeout(t));
  state.timers = {};
}
