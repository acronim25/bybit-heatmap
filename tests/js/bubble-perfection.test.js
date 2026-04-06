/**
 * Tests for bubble-perfection.js — pure functions only.
 * DOM-dependent functions (createRipple, hover effects) are not tested here.
 */

import { describe, it, expect } from 'vitest';

// Since bubble-perfection.js uses global `window`, `document`, and
// `performance`, we import the functions by executing the file in jsdom
// and pulling from the global BubblePerfection export.
import '../../bubble-perfection.js';

const {
  calculateOptimalGrid,
  resolveCollisions,
  elasticEase,
  smoothStep,
} = window.BubblePerfection;

// ============================================
// calculateOptimalGrid
// ============================================
describe('calculateOptimalGrid', () => {
  const defaultViewport = { width: 1200, height: 800 };

  it('returns required grid properties', () => {
    const grid = calculateOptimalGrid(10, defaultViewport);
    expect(grid).toHaveProperty('cols');
    expect(grid).toHaveProperty('rows');
    expect(grid).toHaveProperty('spacing');
    expect(grid).toHaveProperty('bubbleRadius');
    expect(grid).toHaveProperty('rowHeight');
    expect(grid).toHaveProperty('padding');
    expect(grid).toHaveProperty('totalWidth');
    expect(grid).toHaveProperty('totalHeight');
  });

  it('has at least 1 column', () => {
    const grid = calculateOptimalGrid(1, defaultViewport);
    expect(grid.cols).toBeGreaterThanOrEqual(1);
  });

  it('has enough cells for all bubbles', () => {
    const count = 50;
    const grid = calculateOptimalGrid(count, defaultViewport);
    expect(grid.cols * grid.rows).toBeGreaterThanOrEqual(count);
  });

  it('respects minimum spacing of 120px', () => {
    const grid = calculateOptimalGrid(100, defaultViewport);
    expect(grid.spacing).toBeGreaterThanOrEqual(120);
  });

  it('caps bubble radius at 55px', () => {
    const grid = calculateOptimalGrid(5, { width: 2000, height: 2000 });
    expect(grid.bubbleRadius).toBeLessThanOrEqual(55);
  });

  it('handles single bubble', () => {
    const grid = calculateOptimalGrid(1, defaultViewport);
    expect(grid.cols).toBeGreaterThanOrEqual(1);
    expect(grid.rows).toBe(1);
  });

  it('handles small viewport', () => {
    const grid = calculateOptimalGrid(10, { width: 300, height: 300 });
    expect(grid.cols).toBeGreaterThanOrEqual(1);
    expect(grid.spacing).toBeGreaterThanOrEqual(120);
  });
});

// ============================================
// resolveCollisions
// ============================================
describe('resolveCollisions', () => {
  it('does not change non-overlapping bubbles', () => {
    const bubbles = [
      { x: 0, y: 0, radius: 10 },
      { x: 100, y: 100, radius: 10 },
    ];
    const result = resolveCollisions(bubbles, 5);
    // Positions should be unchanged (distance is ~141, min separation is 25)
    expect(result[0].x).toBeCloseTo(0, 0);
    expect(result[0].y).toBeCloseTo(0, 0);
  });

  it('pushes apart overlapping bubbles', () => {
    const bubbles = [
      { x: 0, y: 0, radius: 20 },
      { x: 10, y: 0, radius: 20 },  // overlapping (distance 10 < 20+20+10=50)
    ];
    const result = resolveCollisions(bubbles, 10);
    const dx = result[1].x - result[0].x;
    const dy = result[1].y - result[0].y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    expect(distance).toBeGreaterThanOrEqual(49); // ~50 min separation
  });

  it('handles identical positions', () => {
    const bubbles = [
      { x: 50, y: 50, radius: 10 },
      { x: 50, y: 50, radius: 10 },  // exact same position
    ];
    // Should not crash (distance = 0 is guarded)
    const result = resolveCollisions(bubbles, 5);
    expect(result).toHaveLength(2);
  });

  it('handles empty array', () => {
    const result = resolveCollisions([], 10);
    expect(result).toEqual([]);
  });

  it('handles single bubble', () => {
    const bubbles = [{ x: 50, y: 50, radius: 20 }];
    const result = resolveCollisions(bubbles, 10);
    expect(result[0].x).toBe(50);
    expect(result[0].y).toBe(50);
  });
});

// ============================================
// elasticEase
// ============================================
describe('elasticEase', () => {
  it('starts at 0 when t=0', () => {
    expect(elasticEase(0)).toBeCloseTo(0, 5);
  });

  it('ends at 1 when t=1', () => {
    expect(elasticEase(1)).toBeCloseTo(1, 5);
  });

  it('overshoots past 1 (elastic effect) for mid values', () => {
    // The cubic-bezier(0.34, 1.56, 0.64, 1) should overshoot
    let maxVal = 0;
    for (let t = 0; t <= 1; t += 0.01) {
      maxVal = Math.max(maxVal, elasticEase(t));
    }
    expect(maxVal).toBeGreaterThan(1);
  });

  it('is monotonically approaching 1 near the end', () => {
    const v09 = elasticEase(0.9);
    const v1 = elasticEase(1.0);
    // Both should be close to 1
    expect(v09).toBeGreaterThan(0.8);
    expect(v1).toBeCloseTo(1, 5);
  });
});

// ============================================
// smoothStep
// ============================================
describe('smoothStep', () => {
  it('starts at 0 when t=0', () => {
    expect(smoothStep(0)).toBe(0);
  });

  it('ends at 1 when t=1', () => {
    expect(smoothStep(1)).toBe(1);
  });

  it('is 0.5 at t=0.5', () => {
    expect(smoothStep(0.5)).toBeCloseTo(0.5, 5);
  });

  it('is monotonically increasing', () => {
    let prev = -1;
    for (let t = 0; t <= 1; t += 0.05) {
      const val = smoothStep(t);
      expect(val).toBeGreaterThanOrEqual(prev);
      prev = val;
    }
  });

  it('never exceeds [0, 1] range for inputs in [0, 1]', () => {
    for (let t = 0; t <= 1; t += 0.01) {
      const val = smoothStep(t);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });
});
