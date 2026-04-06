/**
 * Browser Notification API + in-app volume spike alerts
 */

import { getState, on } from '../store/index.js';
import { formatNumber } from '../utils/format.js';

let permission = Notification.permission;

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (permission === 'granted') return true;
  if (permission === 'denied') return false;

  permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function checkVolumeSpikes(coins) {
  const state = getState();
  if (!state.alertsEnabled) return [];

  const now = Date.now();
  const spikes = [];

  for (const coin of coins) {
    const key = coin.symbol;
    const vol = coin.volume24h;

    if (!state.volumeHistory[key]) {
      state.volumeHistory[key] = { volumes: [vol], lastAlert: 0 };
      continue;
    }

    const history = state.volumeHistory[key];
    const avg = history.volumes.reduce((a, b) => a + b, 0) / history.volumes.length;

    if (avg > 0) {
      const ratio = vol / avg;
      if (ratio >= 2 && now - history.lastAlert > 10000) {
        spikes.push({ symbol: key, ratio, volume: vol });
        history.lastAlert = now;
      }
    }

    history.volumes.push(vol);
    if (history.volumes.length > 5) history.volumes.shift();
  }

  spikes.forEach((spike, i) => {
    setTimeout(() => showVolumeAlert(spike), i * 500);
    sendBrowserNotification(spike);
  });

  return spikes;
}

function showVolumeAlert(spike) {
  const banner = document.getElementById('alert-banner');
  const title = document.getElementById('alert-title');
  const text = document.getElementById('alert-text');
  if (!banner || !title || !text) return;

  title.textContent = '🚨 VOLUME SPIKE DETECTED';
  text.textContent = `${spike.symbol}: ${spike.ratio.toFixed(1)}x avg volume ($${formatNumber(spike.volume)})`;
  banner.classList.add('volume-spike', 'show');

  setTimeout(() => banner.classList.remove('show'), 5000);
}

function sendBrowserNotification(spike) {
  if (permission !== 'granted') return;

  try {
    new Notification(`🚨 ${spike.symbol} Volume Spike`, {
      body: `${spike.ratio.toFixed(1)}x average volume ($${formatNumber(spike.volume)})`,
      icon: '/favicon.ico',
      tag: `spike-${spike.symbol}`,
      requireInteraction: false,
    });
  } catch { /* notifications may fail in some contexts */ }
}

export function showAlert(message, type = 'info') {
  const banner = document.getElementById('alert-banner');
  const title = document.getElementById('alert-title');
  const text = document.getElementById('alert-text');
  if (!banner || !title || !text) return;

  title.textContent = type === 'error' ? '⚠️ Error' : type === 'success' ? '🔥 Success' : 'ℹ️ Info';
  text.textContent = message;
  banner.classList.remove('volume-spike');
  banner.classList.add('show');

  setTimeout(() => banner.classList.remove('show'), 4000);
}
