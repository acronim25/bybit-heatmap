/**
 * Background particles and geometric shapes
 */

import { getState } from '../store/index.js';

export function initParticles() {
  const container = document.getElementById('bg-particles');
  if (!container) return;

  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  const count = isMobile ? 6 : 15;
  container.innerHTML = '';

  const colors = [
    'rgba(0,212,255,.4)', 'rgba(0,255,0,.3)',
    'rgba(255,51,102,.3)', 'rgba(184,41,221,.3)'
  ];

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'bg-particle';
    const left = Math.random() * 100;
    const delay = -Math.random() * 15 + 's';
    const duration = (10 + Math.random() * 10) + 's';
    const color = colors[Math.floor(Math.random() * colors.length)];
    p.style.cssText = `left:${left}%;animation:floatUp ${duration} ${delay} linear infinite`;
    p.style.background = color;
    p.style.boxShadow = `0 0 8px ${color}`;
    container.appendChild(p);
  }
}

const SHAPE_COUNT = 75;
const SHAPE_TYPES = ['square', 'circle', 'triangle', 'diamond', 'hexagon'];
const ANIMATIONS = ['float', 'pulse', 'rotate'];

const SHAPE_MESSAGES = {
  square: '🟩 Stability in the depths',
  circle: '🔴 The cycle of the market',
  triangle: '🔺 Momentum direction',
  diamond: '💎 Hidden treasures',
  hexagon: '⬡ Structure of the sea',
};

export function initGeometricShapes() {
  const container = document.getElementById('geometric-shapes-container');
  if (!container) return;

  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  const count = isMobile ? 20 : SHAPE_COUNT;
  container.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const type = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];
    const shape = document.createElement('div');
    shape.className = `geo-shape geo-${type} ${ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)]}`;

    let left, top;
    let attempts = 0;
    do {
      left = Math.random() * 100;
      top = Math.random() * 100;
    } while (top < 30 && left > 30 && left < 70 && ++attempts < 10);

    const size = 20 + Math.random() * 40;
    shape.style.cssText = `left:${left}%;top:${top}%;width:${size}px;${type !== 'triangle' ? `height:${size}px;` : ''}animation-delay:${-Math.random() * 5}s;animation-duration:${5 + Math.random() * 5}s;opacity:${0.3 + Math.random() * 0.4}`;

    if (type === 'triangle') {
      shape.classList.add(Math.random() > 0.5 ? 'up' : 'down');
    }

    shape.addEventListener('click', () => {
      import('./toast.js').then(m => m.showToast(SHAPE_MESSAGES[type]));
    });

    container.appendChild(shape);
  }
}
