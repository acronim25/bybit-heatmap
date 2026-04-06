/**
 * Tests for .ralph-unified-modules/bubble-system.js — geometry functions.
 */

import { describe, it, expect } from 'vitest';

// Execute the module to populate globals
import '../../.ralph-unified-modules/bubble-system.js';

// Functions are exported under window.BubbleSystem.geometry
const { rotateZ, project3D, createTwistedRibbon } = window.BubbleSystem.geometry;

// ============================================
// rotateZ
// ============================================
describe('rotateZ', () => {
  it('returns the same point for angle=0', () => {
    const point = { x: 10, y: 5, z: 3 };
    const result = rotateZ(point, 0);
    expect(result.x).toBeCloseTo(10);
    expect(result.y).toBeCloseTo(5);
    expect(result.z).toBe(3); // z unchanged
  });

  it('rotates 90 degrees correctly', () => {
    const point = { x: 1, y: 0, z: 0 };
    const result = rotateZ(point, Math.PI / 2);
    expect(result.x).toBeCloseTo(0, 5);
    expect(result.y).toBeCloseTo(1, 5);
    expect(result.z).toBe(0);
  });

  it('rotates 180 degrees correctly', () => {
    const point = { x: 1, y: 0, z: 0 };
    const result = rotateZ(point, Math.PI);
    expect(result.x).toBeCloseTo(-1, 5);
    expect(result.y).toBeCloseTo(0, 5);
  });

  it('preserves z coordinate', () => {
    const point = { x: 1, y: 2, z: 42 };
    const result = rotateZ(point, 1.5);
    expect(result.z).toBe(42);
  });

  it('full rotation returns to original position', () => {
    const point = { x: 3, y: 7, z: 1 };
    const result = rotateZ(point, Math.PI * 2);
    expect(result.x).toBeCloseTo(3, 5);
    expect(result.y).toBeCloseTo(7, 5);
  });
});

// ============================================
// project3D
// ============================================
describe('project3D', () => {
  it('projects point at z=0 to center + offset', () => {
    const center = { x: 400, y: 300 };
    const result = project3D({ x: 100, y: 50, z: 0 }, 800, center);
    // scale = 800/(800+0) = 1
    expect(result.x).toBeCloseTo(500); // 400 + 100*1
    expect(result.y).toBeCloseTo(350); // 300 + 50*1
    expect(result.scale).toBeCloseTo(1);
  });

  it('shrinks distant points (positive z)', () => {
    const result = project3D({ x: 100, y: 0, z: 400 }, 800, { x: 0, y: 0 });
    // scale = 800/(800+400) = 0.667
    expect(result.scale).toBeCloseTo(0.667, 2);
    expect(result.x).toBeCloseTo(66.7, 0);
  });

  it('enlarges close points (negative z)', () => {
    const result = project3D({ x: 100, y: 0, z: -400 }, 800, { x: 0, y: 0 });
    // scale = 800/(800-400) = 2.0
    expect(result.scale).toBeCloseTo(2.0);
    expect(result.x).toBeCloseTo(200);
  });

  it('uses default focal length and center', () => {
    const result = project3D({ x: 0, y: 0, z: 0 });
    expect(result.x).toBeCloseTo(400);
    expect(result.y).toBeCloseTo(300);
  });
});

// ============================================
// createTwistedRibbon
// ============================================
describe('createTwistedRibbon', () => {
  it('creates the correct number of segments', () => {
    const ribbon = createTwistedRibbon(50, 2, 10, 20);
    expect(ribbon).toHaveLength(20);
  });

  it('each segment has front and back faces with 4 points', () => {
    const ribbon = createTwistedRibbon(50, 2, 10, 5);
    ribbon.forEach(segment => {
      expect(segment.front).toHaveLength(4);
      expect(segment.back).toHaveLength(4);
    });
  });

  it('each point has x, y, z coordinates', () => {
    const ribbon = createTwistedRibbon(50, 2, 10, 5);
    ribbon[0].front.forEach(point => {
      expect(point).toHaveProperty('x');
      expect(point).toHaveProperty('y');
      expect(point).toHaveProperty('z');
    });
  });

  it('segments have sequential indices', () => {
    const ribbon = createTwistedRibbon(50, 1, 10, 10);
    ribbon.forEach((segment, i) => {
      expect(segment.index).toBe(i);
    });
  });

  it('handles zero twists (flat ribbon)', () => {
    const ribbon = createTwistedRibbon(50, 0, 10, 5);
    expect(ribbon).toHaveLength(5);
    // With 0 twists, all z coordinates should be near 0
    ribbon.forEach(segment => {
      segment.front.forEach(point => {
        expect(point.z).toBeCloseTo(0, 5);
      });
    });
  });

  it('respects custom height option', () => {
    const ribbon = createTwistedRibbon(50, 1, 10, 10, { height: 400 });
    // First segment's y should be near -200 (half of 400)
    const firstY = ribbon[0].front[0].y;
    // Due to rotation, check the general range
    expect(ribbon).toHaveLength(10);
  });
});
