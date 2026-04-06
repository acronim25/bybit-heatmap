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

function getLayoutConfig(width) {
  if (width <= 400) {
    // Small phones (iPhone SE, etc.)
    return { cellSize: 75, maxBubble: 60, minBubble: 28, rowHeight: 80, jitter: 8, glow: 3, gap: 4, maxCoins: 40 };
  } else if (width <= 768) {
    // Larger phones / small tablets
    return { cellSize: 90, maxBubble: 70, minBubble: 32, rowHeight: 95, jitter: 12, glow: 3, gap: 6, maxCoins: 50 };
  } else if (width <= 1024) {
    // Tablets
    return { cellSize: 110, maxBubble: 90, minBubble: 38, rowHeight: 120, jitter: 20, glow: 4, gap: 8, maxCoins: 60 };
  }
  // Desktop
  return { cellSize: 130, maxBubble: 110, minBubble: 45, rowHeight: 140, jitter: 30, glow: 4, gap: 10, maxCoins: 60 };
}

export function initBubbleSimulation(coins) {
  const container = document.getElementById('bubble-container');
  if (!container) return coins;

  const width = container.clientWidth;
  const config = getLayoutConfig(width);
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
  const minGap = mobile ? 4 : 10;

  coins.forEach((coin, i) => {
    let fx = 0, fy = 0;

    // Repulsion
    coins.forEach((other, j) => {
      if (i === j) return;
      const dx = coin.x - other.x;
      const dy = coin.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = (coin.size + other.size) / 2 + minGap;
      if (dist < minDist && dist > 0) {
        const force = 2000 * (minDist - dist) / minDist;
        fx += (dx / dist) * force;
        fy += (dy / dist) * force;
      }
    });

    // Grid attraction (stronger on mobile to keep them tidy)
    const gridStrength = mobile ? 0.02 : 0.01;
    fx += (coin.gridX - coin.x) * gridStrength;
    fy += (coin.gridY - coin.y) * gridStrength;

    // Center gravity
    fx += (centerX - coin.x) * 0.0005;
    fy += (centerY - coin.y) * 0.0005;

    coin.vx = (coin.vx + fx / coin.mass) * damping;
    coin.vy = (coin.vy + fy / coin.mass) * damping;
    coin.x += coin.vx;
    coin.y += coin.vy;

    // Bounds
    const margin = coin.size / 2 + 5;
    coin.x = Math.max(margin, Math.min(w - margin, coin.x));
    coin.y = Math.max(margin, Math.min(h - margin, coin.y));
  });
}

export function renderBubbles(coins) {
  const container = document.getElementById('bubble-container');
  if (!container) return;

  const state = getState();
  const width = container.clientWidth;
  const config = getLayoutConfig(width);
  const mobile = isMobile();

  // Limit coins on mobile for cleaner layout
  const displayCoins = coins.slice(0, config.maxCoins);

  const cols = Math.max(2, Math.floor(width / config.cellSize));
  const rows = Math.ceil(displayCoins.length / cols);
  const height = Math.max(rows * config.rowHeight + 100, mobile ? 500 : 800);

  container.innerHTML = '';
  container.style.height = height + 'px';

  const svg = d3.select('#bubble-container')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  // Glow filter (reduced blur on mobile)
  const defs = svg.append('defs');
  const filter = defs.append('filter')
    .attr('id', 'glow')
    .attr('x', '-50%').attr('y', '-50%')
    .attr('width', '200%').attr('height', '200%');
  filter.append('feGaussianBlur')
    .attr('stdDeviation', config.glow)
    .attr('result', 'coloredBlur');
  const merge = filter.append('feMerge');
  merge.append('feMergeNode').attr('in', 'coloredBlur');
  merge.append('feMergeNode').attr('in', 'SourceGraphic');

  initBubbleSimulation(displayCoins);

  const groups = svg.selectAll('.bubble-group')
    .data(displayCoins)
    .enter()
    .append('g')
    .attr('class', 'bubble-group')
    .attr('data-symbol', d => d.symbol)
    .attr('transform', d => `translate(${d.x},${d.y})`)
    .style('opacity', 0);

  groups.each(function (d) {
    const g = d3.select(this);
    const color = getBubbleColor(d.change24h, state.currentTheme);
    const r = d.size / 2;

    // Glow circle (smaller on mobile)
    const glowPad = mobile ? 4 : 8;
    g.append('circle')
      .attr('r', r + glowPad)
      .attr('fill', color.glow)
      .attr('opacity', mobile ? 0.2 : 0.3)
      .attr('filter', 'url(#glow)');

    // Main circle
    g.append('circle')
      .attr('class', 'bubble-spiral')
      .attr('r', r)
      .attr('fill', state.currentTheme === 'dark' ? 'rgba(10,14,20,.92)' : 'rgba(255,255,255,.92)')
      .attr('stroke', color.primary)
      .attr('stroke-width', mobile ? 1.5 : 2)
      .style('color', color.primary);

    // Inner ring (skip on very small bubbles)
    if (r > 18) {
      g.append('circle')
        .attr('r', r - 4)
        .attr('fill', 'none')
        .attr('stroke', color.primary)
        .attr('stroke-width', mobile ? 0.5 : 1)
        .attr('opacity', 0.2);
    }

    // Watchlist star
    if (state.watchlist.has(d.symbol)) {
      g.append('text')
        .attr('class', 'bubble-star')
        .attr('dy', mobile ? '-1.2em' : '-1.8em')
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffcc00')
        .attr('font-size', mobile ? '8px' : '10px')
        .text('⭐');
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
