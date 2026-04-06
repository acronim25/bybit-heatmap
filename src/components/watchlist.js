/**
 * Watchlist / Favorites — persisted in localStorage
 */

import { getState, toggleWatchlist, isInWatchlist, on } from '../store/index.js';

export function initWatchlist() {
  // Add watchlist category button
  const categoryFilters = document.querySelector('.category-filters');
  if (!categoryFilters) return;

  const existing = categoryFilters.querySelector('[data-category="watchlist"]');
  if (existing) return;

  const btn = document.createElement('button');
  btn.className = 'pill watchlist';
  btn.dataset.category = 'watchlist';
  btn.textContent = '⭐ Watch';
  categoryFilters.appendChild(btn);
}

export function createWatchlistButton(symbol) {
  const btn = document.createElement('button');
  btn.className = 'action-btn watchlist-btn';
  btn.dataset.symbol = symbol;
  updateWatchlistButton(btn, symbol);

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const added = toggleWatchlist(symbol);
    updateWatchlistButton(btn, symbol);
    showWatchlistToast(symbol, added);
  });

  return btn;
}

function updateWatchlistButton(btn, symbol) {
  const active = isInWatchlist(symbol);
  btn.innerHTML = `
    <span class="action-icon">${active ? '⭐' : '☆'}</span>
    <span class="action-label">${active ? 'Remove' : 'Watch'}</span>
  `;
  btn.classList.toggle('active', active);
}

function showWatchlistToast(symbol, added) {
  const toast = document.getElementById('modal-toast');
  const msg = document.getElementById('toast-message');
  if (!toast || !msg) return;

  msg.textContent = added ? `${symbol} added to watchlist` : `${symbol} removed from watchlist`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

export function filterByWatchlist(coins) {
  const { watchlist } = getState();
  return coins.filter(c => watchlist.has(c.symbol));
}
