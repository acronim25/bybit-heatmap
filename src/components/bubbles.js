/**
 * D3.js bubble heatmap rendering with physics simulation
 */

import * as d3 from 'd3';
import { getState } from '../store/index.js';
import { getBubbleColor, calculateBubbleSize } from '../utils/colors.js';
import { throttle } from '../utils/debounce.js';

const ANIMATION_FPS = 30;
let lastPhysicsTime = 0;

export function initBubbleSimulation(coins) {
  const container = document.getElementById('bubble-container');
  if (!container) return coins;

  const width = container.clientWidth;
  const maxVol = Math.max(...coins.map(c => c.volume24h));
  const cols = Math.floor(width / 130);
  const colWidth = width / cols;
  const rowHeight = 140;

  coins.forEach((coin, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const jitterX = (Math.random() - 0.5) * 30;
    const jitterY = (Math.random() - 0.5) * 30;

    coin.x = col * colWidth + colWidth / 2 + jitterX;
    coin.y = row * rowHeight + rowHeight / 2 + jitterY + 50;
    coin.vx = 0;
    coin.vy = 0;
    coin.size = calculateBubbleSize(coin.volume24h, maxVol);
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

  const centerX = container.clientWidth / 2;
  const centerY = container.clientHeight / 2;
  const damping = 0.9;

  coins.forEach((coin, i) => {
    let fx = 0, fy = 0;

    // Repulsion
    coins.forEach((other, j) => {
      if (i === j) return;
      const dx = coin.x - other.x;
      const dy = coin.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = (coin.size + other.size) / 2 + 10;
      if (dist < minDist && dist > 0) {
        const force = 2000 * (minDist - dist) / minDist;
        fx += (dx / dist) * force;
        fy += (dy / dist) * force;
      }
    });

    // Grid attraction
    fx += (coin.gridX - coin.x) * 0.01;
    fy += (coin.gridY - coin.y) * 0.01;

    // Center gravity
    fx += (centerX - coin.x) * 0.005 * 0.1;
    fy += (centerY - coin.y) * 0.005 * 0.1;

    coin.vx = (coin.vx + fx / coin.mass) * damping;
    coin.vy = (coin.vy + fy / coin.mass) * damping;
    coin.x += coin.vx;
    coin.y += coin.vy;

    // Bounds
    const margin = coin.size / 2 + 20;
    coin.x = Math.max(margin, Math.min(centerX * 2 - margin, coin.x));
    coin.y = Math.max(margin, Math.min(centerY * 2 - margin, coin.y));
  });
}

export function renderBubbles(coins) {
  const container = document.getElementById('bubble-container');
  if (!container) return;

  const state = getState();
  const width = container.clientWidth;
  const height = Math.max(15 * coins.length + 200, 800);
  container.innerHTML = '';
  container.style.height = height + 'px';

  const svg = d3.select('#bubble-container')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  // Glow filter
  const defs = svg.append('defs');
  const filter = defs.append('filter')
    .attr('id', 'glow')
    .attr('x', '-50%').attr('y', '-50%')
    .attr('width', '200%').attr('height', '200%');
  filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
  const merge = filter.append('feMerge');
  merge.append('feMergeNode').attr('in', 'coloredBlur');
  merge.append('feMergeNode').attr('in', 'SourceGraphic');

  initBubbleSimulation(coins);

  const groups = svg.selectAll('.bubble-group')
    .data(coins)
    .enter()
    .append('g')
    .attr('class', 'bubble-group')
    .attr('data-symbol', d => d.symbol)
    .attr('transform', d => `translate(${d.x},${d.y})`)
    .style('opacity', 0);

  groups.each(function (d) {
    const g = d3.select(this);
    const color = getBubbleColor(d.change24h, state.currentTheme);

    // Glow circle
    g.append('circle')
      .attr('r', d.size / 2 + 8)
      .attr('fill', color.glow)
      .attr('opacity', 0.3)
      .attr('filter', 'url(#glow)');

    // Main circle
    g.append('circle')
      .attr('class', 'bubble-spiral')
      .attr('r', d.size / 2)
      .attr('fill', state.currentTheme === 'dark' ? 'rgba(10,10,15,.9)' : 'rgba(255,255,255,.9)')
      .attr('stroke', color.primary)
      .attr('stroke-width', 2)
      .style('color', color.primary);

    // Inner ring
    g.append('circle')
      .attr('r', d.size / 2 - 5)
      .attr('fill', 'none')
      .attr('stroke', color.primary)
      .attr('stroke-width', 1)
      .attr('opacity', 0.3);

    // Watchlist star indicator
    if (state.watchlist.has(d.symbol)) {
      g.append('text')
        .attr('class', 'bubble-star')
        .attr('dy', '-1.8em')
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffcc00')
        .attr('font-size', '10px')
        .text('⭐');
    }

    // Label
    g.append('text')
      .attr('class', 'bubble-label')
      .attr('dy', '-0.2em')
      .text(d.symbol);

    // Change %
    g.append('text')
      .attr('class', 'bubble-change')
      .attr('dy', '1.2em')
      .style('fill', color.text)
      .text(`${d.change24h >= 0 ? '+' : ''}${d.change24h.toFixed(1)}%`);
  });

  // Animate in
  groups.transition()
    .duration(600)
    .delay((d, i) => i * 30)
    .ease(d3.easeBackOut)
    .style('opacity', 1);

  // Click handler
  groups.on('click', function (event, d) {
    d3.select(this).classed('spinning', true);
    setTimeout(() => d3.select(this).classed('spinning', false), 1000);
    import('./modal.js').then(m => m.openModal(d));
  });

  // Physics animation loop
  let frame = 0;
  function animate() {
    frame++;
    if (frame % 2 === 0) runPhysicsStep(coins);
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

// Debounced resize handler
export const handleResize = throttle(() => rerenderBubbles(), 250);
