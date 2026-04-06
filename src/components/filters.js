/**
 * Filter system — categories, search, volume, sort, funding rate, OI change
 */

import { getState, updateFilters, on } from '../store/index.js';
import { formatVolumeLevel } from '../utils/format.js';
import { debounce } from '../utils/debounce.js';
import { MAJOR_COINS } from '../utils/colors.js';
import { filterByWatchlist } from './watchlist.js';

const VOLUME_LEVELS = [0, 1e6, 5e6, 1e7, 5e7, 1e8, 5e8, 1e9, 5e9];

export function setupFilterListeners() {
  // Category buttons
  document.querySelectorAll('.pill[data-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category;
      const current = getState().filters.category;

      if (current === category) {
        updateFilters({ category: 'all' });
      } else {
        updateFilters({ category });
      }

      document.querySelectorAll('.pill[data-category]').forEach(b => b.classList.remove('active'));
      const activeCategory = getState().filters.category;
      document.querySelector(`.category-btn[data-category="${activeCategory}"]`)?.classList.add('active');
    });
  });

  // Sort
  document.getElementById('sort-select')?.addEventListener('change', e => {
    updateFilters({ sortBy: e.target.value });
  });

  document.getElementById('sort-direction')?.addEventListener('click', () => {
    const desc = !getState().filters.sortDesc;
    updateFilters({ sortDesc: desc });
    document.getElementById('sort-direction').textContent = desc ? '↓' : '↑';
  });

  // Search with debounce
  const searchInput = document.getElementById('filter-search');
  if (searchInput) {
    const debouncedSearch = debounce(val => updateFilters({ search: val }), 300);
    searchInput.addEventListener('input', e => debouncedSearch(e.target.value));
  }

  document.getElementById('search-clear')?.addEventListener('click', () => {
    const input = document.getElementById('filter-search');
    if (input) input.value = '';
    updateFilters({ search: '' });
  });

  // Volume slider
  const slider = document.getElementById('volume-slider');
  const volValue = document.getElementById('volume-value');
  if (slider) {
    slider.addEventListener('input', () => {
      const level = VOLUME_LEVELS[parseInt(slider.value)];
      updateFilters({ minVolume: level });
      if (volValue) volValue.textContent = formatVolumeLevel(level);
    });
  }

  // Funding rate filter
  document.getElementById('funding-filter')?.addEventListener('change', e => {
    updateFilters({ fundingRate: e.target.value });
  });

  // OI change filter
  document.getElementById('oi-filter')?.addEventListener('change', e => {
    updateFilters({ oiChange: e.target.value });
  });

  // Alert toggle
  const alertBtn = document.getElementById('alert-toggle');
  if (alertBtn) {
    alertBtn.addEventListener('click', () => {
      const state = getState();
      state.alertsEnabled = !state.alertsEnabled;
      alertBtn.classList.toggle('active', state.alertsEnabled);
    });
  }
}

export function applyFilters() {
  const state = getState();
  let coins = [...state.coins];
  const f = state.filters;

  // Category
  if (f.category === 'gainers') coins = coins.filter(c => c.change24h > 0);
  else if (f.category === 'losers') coins = coins.filter(c => c.change24h < 0);
  else if (f.category === 'majors') coins = coins.filter(c => MAJOR_COINS.has(c.symbol));
  else if (f.category === 'watchlist') coins = filterByWatchlist(coins);

  // Min volume
  if (f.minVolume > 0) coins = coins.filter(c => c.volume24h >= f.minVolume);

  // Search
  if (f.search) {
    const q = f.search.toLowerCase();
    coins = coins.filter(c => c.symbol.toLowerCase().includes(q));
  }

  // Funding rate filter
  if (f.fundingRate === 'positive') coins = coins.filter(c => (c.fundingRate || 0) > 0);
  else if (f.fundingRate === 'negative') coins = coins.filter(c => (c.fundingRate || 0) < 0);

  // OI change filter
  if (f.oiChange === 'increasing') coins = coins.filter(c => (c.oiChange || 0) > 0);
  else if (f.oiChange === 'decreasing') coins = coins.filter(c => (c.oiChange || 0) < 0);

  // Sort
  coins.sort((a, b) => {
    let va, vb;
    switch (f.sortBy) {
      case 'change': va = a.change24h; vb = b.change24h; break;
      case 'price': va = a.price; vb = b.price; break;
      case 'name': va = a.symbol.toLowerCase(); vb = b.symbol.toLowerCase(); break;
      case 'funding': va = a.fundingRate || 0; vb = b.fundingRate || 0; break;
      case 'oi': va = a.openInterest || 0; vb = b.openInterest || 0; break;
      default: va = a.volume24h; vb = b.volume24h;
    }
    return va < vb ? (f.sortDesc ? 1 : -1) : va > vb ? (f.sortDesc ? -1 : 1) : 0;
  });

  state.filteredCoins = coins;
  updateResultsCount(coins.length, state.coins.length);
  updateActiveFiltersDisplay();

  return coins;
}

function updateResultsCount(filtered, total) {
  const el = document.getElementById('results-count');
  if (el) el.textContent = `${filtered} / ${total} futures`;
}

function updateActiveFiltersDisplay() {
  const container = document.getElementById('active-filters');
  if (!container) return;
  container.innerHTML = '';

  const f = getState().filters;
  const chips = [];

  if (f.category !== 'all') {
    const labels = { gainers: 'Gainers ▲', losers: 'Losers ▼', majors: 'Majors', watchlist: '⭐ Watchlist' };
    chips.push({ type: 'category', label: labels[f.category] || f.category });
  }
  if (f.minVolume > 0) chips.push({ type: 'volume', label: `Min Vol: ${formatVolumeLevel(f.minVolume)}` });
  if (f.search) chips.push({ type: 'search', label: `"${f.search}"` });
  if (f.fundingRate !== 'all') chips.push({ type: 'fundingRate', label: `Funding: ${f.fundingRate}` });
  if (f.oiChange !== 'all') chips.push({ type: 'oiChange', label: `OI: ${f.oiChange}` });

  chips.forEach(chip => {
    const el = document.createElement('div');
    el.className = 'filter-chip';
    el.innerHTML = `<span>${chip.label}</span><button class="filter-chip-remove" data-type="${chip.type}">×</button>`;
    container.appendChild(el);
    el.querySelector('.filter-chip-remove').addEventListener('click', () => removeFilter(chip.type));
  });

  if (chips.length > 0) {
    const clearBtn = document.createElement('button');
    clearBtn.className = 'clear-all-btn';
    clearBtn.textContent = 'Clear All';
    clearBtn.addEventListener('click', clearAllFilters);
    container.appendChild(clearBtn);
  }
}

function removeFilter(type) {
  const defaults = { category: 'all', search: '', minVolume: 0, fundingRate: 'all', oiChange: 'all' };
  updateFilters({ [type]: defaults[type] });

  // Reset UI elements
  if (type === 'category') {
    document.querySelectorAll('.pill[data-category]').forEach(b => b.classList.remove('active'));
    document.querySelector('.pill[data-category="all"]')?.classList.add('active');
  }
  if (type === 'search') {
    const input = document.getElementById('filter-search');
    if (input) input.value = '';
  }
  if (type === 'minVolume') {
    const slider = document.getElementById('volume-slider');
    if (slider) slider.value = 0;
    const val = document.getElementById('volume-value');
    if (val) val.textContent = 'All';
  }

  applyFilters();
}

function clearAllFilters() {
  updateFilters({
    category: 'all', sortBy: 'volume', sortDesc: true,
    search: '', minVolume: 0, fundingRate: 'all', oiChange: 'all',
  });

  document.querySelectorAll('.pill[data-category]').forEach(b => b.classList.remove('active'));
  document.querySelector('.pill[data-category="all"]')?.classList.add('active');
  const search = document.getElementById('filter-search');
  if (search) search.value = '';
  const slider = document.getElementById('volume-slider');
  if (slider) slider.value = 0;
  const vol = document.getElementById('volume-value');
  if (vol) vol.textContent = 'All';

  applyFilters();
}
