/**
 * D3.js bubble heatmap rendering with physics simulation
 * Mobile-optimized: smaller bubbles, tighter grid, reduced glow
 */

import * as d3 from 'd3';
import { getState } from '../store/index.js';
import { getBubbleColor, calculateBubbleSize } from '../utils/colors.js';
import { throttle } from '../utils/debounce.js';

const ANIMATION_FPS = 30;
let lastPhysicsTime = 0;

function isMobile() {
  return window.innerWidth <= 768;
}

function getLayoutConfig(width, coinCount) {
  // Dynamic sizing: more coins = smaller bubbles to fit them all
  if (width <= 400) {
    const scale = coinCount > 100 ? 0.7 : coinCount > 60 ? 0.85 : 1;
    return { cellSize: 55 * scale, maxBubble: 48 * scale, minBubble: 18 * scale, rowHeight: 60 * scale, jitter: 5, glow: 2, gap: 2 };
  } else if (width <= 768) {
    const scale = coinCount > 100 ? 0.75 : coinCount > 60 ? 0.88 : 1;
    return { cellSize: 70 * scale, maxBubble: 60 * scale, minBubble: 22 * scale, rowHeight: 75 * scale, jitter: 8, glow: 3, gap: 3 };
  } else if (width <= 1024) {
    const scale = coinCount > 150 ? 0.65 : coinCount > 100 ? 0.78 : coinCount > 60 ? 0.9 : 1;
    return { cellSize: 85 * scale, maxBubble: 75 * scale, minBubble: 28 * scale, rowHeight: 90 * scale, jitter: 10, glow: 3, gap: 5 };
  }
  // Desktop — scale down for large counts
  const scale = coinCount > 200 ? 0.55 : coinCount > 150 ? 0.65 : coinCount > 100 ? 0.75 : coinCount > 60 ? 0.88 : 1;
  return { cellSize: 100 * scale, maxBubble: 90 * scale, minBubble: 32 * scale, rowHeight: 105 * scale, jitter: 15, glow: 4, gap: 6 };
}

export function initBubbleSimulation(coins) {
  const container = document.getElementById('bubble-container');
  if (!container) return coins;

  const width = container.clientWidth;
  const config = getLayoutConfig(width, coins.length);
  const maxVol = Math.max(...coins.map(c => c.volume24h));
  const cols = Math.max(2, Math.floor(width / config.cellSize));
  const colWidth = width / cols;

  coins.forEach((coin, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const jitterX = (Math.random() - 0.5) * config.jitter;
    const jitterY = (Math.random() - 0.5) * config.jitter;

    coin.x = col * colWidth + colWidth / 2 + jitterX;
    coin.y = row * config.rowHeight + config.rowHeight / 2 + jitterY + 30;
    coin.vx = 0;
    coin.vy = 0;
    coin.size = calculateBubbleSize(coin.volume24h, maxVol, config.minBubble, config.maxBubble);
    coin.mass = coin.size / 10;
    coin.gridX = coin.x;
    coin.gridY = coin.y;
  });

  return coins;
}

// Spatial hash for O(n) neighbor lookup instead of O(n²)
function buildSpatialGrid(coins, cellSize) {
  const grid = new Map();
  for (let i = 0; i < coins.length; i++) {
    const key = `${Math.floor(coins[i].x / cellSize)},${Math.floor(coins[i].y / cellSize)}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(i);
  }
  return grid;
}

function runPhysicsStep(coins) {
  const now = performance.now();
  if (now - lastPhysicsTime < 1000 / ANIMATION_FPS) return;
  lastPhysicsTime = now;

  const container = document.getElementById('bubble-container');
  if (!container) return;

  const w = container.clientWidth;
  const h = container.clientHeight;
  const centerX = w / 2;
  const centerY = h / 2;
  const damping = 0.9;
  const mobile = isMobile();
  const minGap = mobile ? 2 : 6;

  // Build spatial grid for fast collision (critical with 300+ bubbles)
  const maxSize = coins.length > 0 ? coins.reduce((m, c) => Math.max(m, c.size), 0) : 60;
  const gridCell = maxSize + minGap + 20;
  const spatialGrid = buildSpatialGrid(coins, gridCell);

  coins.forEach((coin, i) => {
    let fx = 0, fy = 0;

    // Only check neighbors in adjacent spatial cells
    const cx = Math.floor(coin.x / gridCell);
    const cy = Math.floor(coin.y / gridCell);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cell = spatialGrid.get(`${cx + dx},${cy + dy}`);
        if (!cell) continue;
        for (const j of cell) {
          if (i === j) continue;
          const other = coins[j];
          const ddx = coin.x - other.x;
          const ddy = coin.y - other.y;
          const distSq = ddx * ddx + ddy * ddy;
          const minDist = (coin.size + other.size) / 2 + minGap;
          if (distSq < minDist * minDist && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const force = 1500 * (minDist - dist) / minDist;
            fx += (ddx / dist) * force;
            fy += (ddy / dist) * force;
          }
        }
      }
    }

    // Grid attraction
    const gridStrength = mobile ? 0.025 : 0.015;
    fx += (coin.gridX - coin.x) * gridStrength;
    fy += (coin.gridY - coin.y) * gridStrength;

    // Gentle center gravity
    fx += (centerX - coin.x) * 0.0003;
    fy += (centerY - coin.y) * 0.0003;

    coin.vx = (coin.vx + fx / coin.mass) * damping;
    coin.vy = (coin.vy + fy / coin.mass) * damping;
    coin.x += coin.vx;
    coin.y += coin.vy;

    // Bounds
    const margin = coin.size / 2 + 3;
    coin.x = Math.max(margin, Math.min(w - margin, coin.x));
    coin.y = Math.max(margin, Math.min(h - margin, coin.y));
  });
}

export function renderBubbles(coins) {
  const container = document.getElementById('bubble-container');
  if (!container) return;

  const state = getState();
  const width = container.clientWidth;
  const mobile = isMobile();
  const displayCoins = coins; // Show ALL contracts
  const config = getLayoutConfig(width, displayCoins.length);

  const cols = Math.max(2, Math.floor(width / config.cellSize));
  const rows = Math.ceil(displayCoins.length / cols);
  const height = Math.max(rows * config.rowHeight + 100, mobile ? 500 : 800);

  container.innerHTML = '';
  container.style.height = height + 'px';

  const svg = d3.select('#bubble-container')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const defs = svg.append('defs');

  // Glow filter
  const glowFilter = defs.append('filter')
    .attr('id', 'glow')
    .attr('x', '-50%').attr('y', '-50%')
    .attr('width', '200%').attr('height', '200%');
  glowFilter.append('feGaussianBlur').attr('stdDeviation', config.glow).attr('result', 'coloredBlur');
  const merge = glowFilter.append('feMerge');
  merge.append('feMergeNode').attr('in', 'coloredBlur');
  merge.append('feMergeNode').attr('in', 'SourceGraphic');

  // Gradient defs for each coin — created per-bubble for unique IDs
  const maxVol = Math.max(...displayCoins.map(c => c.volume24h));

  initBubbleSimulation(displayCoins);

  const groups = svg.selectAll('.bubble-group')
    .data(displayCoins)
    .enter()
    .append('g')
    .attr('class', 'bubble-group')
    .attr('data-symbol', d => d.symbol)
    .attr('transform', d => `translate(${d.x},${d.y})`)
    .style('opacity', 0);

  groups.each(function (d, idx) {
    const g = d3.select(this);
    const color = getBubbleColor(d.change24h, state.currentTheme);
    const r = d.size / 2;

    // Volume-proportional glow intensity (bigger volume = stronger glow)
    const volRatio = Math.log10(d.volume24h + 1) / Math.log10(maxVol + 1);
    const glowOpacity = mobile ? 0.15 + volRatio * 0.2 : 0.2 + volRatio * 0.35;

    // Create gradient for this bubble
    const gradId = `bubbleGrad-${idx}`;
    const grad = defs.append('radialGradient').attr('id', gradId);
    grad.append('stop').attr('offset', '0%').attr('stop-color', color.gradStart).attr('stop-opacity', 0.15);
    grad.append('stop').attr('offset', '70%').attr('stop-color', color.gradEnd).attr('stop-opacity', 0.05);
    grad.append('stop').attr('offset', '100%').attr('stop-color', color.primary).attr('stop-opacity', 0);

    // Outer glow — intensity scales with volume
    const glowPad = mobile ? 6 : 12;
    g.append('circle')
      .attr('r', r + glowPad)
      .attr('fill', color.glow)
      .attr('opacity', glowOpacity)
      .attr('filter', 'url(#glow)');

    // Main circle with gradient fill
    g.append('circle')
      .attr('class', 'bubble-spiral')
      .attr('r', r)
      .attr('fill', `url(#${gradId})`)
      .attr('stroke', color.primary)
      .attr('stroke-width', mobile ? 1.5 : 2)
      .style('color', color.primary);

    // Inner ring (subtle)
    if (r > 18) {
      g.append('circle')
        .attr('r', r - 5)
        .attr('fill', 'none')
        .attr('stroke', color.primary)
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.15);
    }

    // Watchlist star
    if (state.watchlist.has(d.symbol)) {
      g.append('text')
        .attr('dy', mobile ? '-1.2em' : '-1.6em')
        .attr('text-anchor', 'middle')
        .attr('fill', '#FFD93D')
        .attr('font-size', mobile ? '8px' : '10px')
        .text('★');
    }

    // Label
    g.append('text')
      .attr('class', 'bubble-label')
      .attr('dy', '-0.2em')
      .attr('font-size', mobile ? (r < 20 ? '8px' : '9px') : null)
      .text(d.symbol);

    // Change %
    g.append('text')
      .attr('class', 'bubble-change')
      .attr('dy', '1.2em')
      .attr('font-size', mobile ? (r < 20 ? '7px' : '8px') : null)
      .style('fill', color.text)
      .text(`${d.change24h >= 0 ? '+' : ''}${d.change24h.toFixed(1)}%`);
  });

  // Animate in (faster on mobile)
  groups.transition()
    .duration(mobile ? 400 : 600)
    .delay((d, i) => i * (mobile ? 15 : 30))
    .ease(d3.easeBackOut)
    .style('opacity', 1);

  // Click handler
  groups.on('click', function (event, d) {
    d3.select(this).classed('spinning', true);
    setTimeout(() => d3.select(this).classed('spinning', false), 1000);
    import('./modal.js').then(m => m.openModal(d));
  });

  // Touch handler for mobile (better than click)
  if (mobile) {
    groups.on('touchend', function (event, d) {
      event.preventDefault();
      d3.select(this).classed('spinning', true);
      setTimeout(() => d3.select(this).classed('spinning', false), 1000);
      import('./modal.js').then(m => m.openModal(d));
    });
  }

  // Physics animation loop
  let frame = 0;
  function animate() {
    frame++;
    if (frame % 2 === 0) runPhysicsStep(displayCoins);
    groups.attr('transform', d => `translate(${d.x.toFixed(1)},${d.y.toFixed(1)})`);
    state.rafId = requestAnimationFrame(animate);
  }
  animate();
}

export function rerenderBubbles() {
  const state = getState();
  if (state.rafId) cancelAnimationFrame(state.rafId);
  const coins = state.filteredCoins.length > 0 ? state.filteredCoins : state.coins;
  if (coins.length > 0) renderBubbles(coins);
}

// Throttled resize handler
export const handleResize = throttle(() => rerenderBubbles(), 250);
