import { describe, it, expect } from 'vitest';
import { parseBBox } from '../components/BidderDetailView';

describe('Evidence Highlighting & Bounding Box Parser', () => {
  it('returns null for null, undefined, or empty bbox', () => {
    expect(parseBBox(null)).toBeNull();
    expect(parseBBox(undefined)).toBeNull();
    expect(parseBBox([])).toBeNull();
    expect(parseBBox({})).toBeNull();
  });

  it('parses 0-to-1 normalized coordinates [x0, y0, x1, y1] correctly', () => {
    const bbox = [0.1, 0.2, 0.5, 0.6];
    const parsed = parseBBox(bbox);
    expect(parsed).not.toBeNull();
    expect(parsed?.left).toBeCloseTo(10);
    expect(parsed?.top).toBeCloseTo(20);
    expect(parsed?.width).toBeCloseTo(40);
    expect(parsed?.height).toBeCloseTo(40);
  });

  it('clamps minimum dimensions so small evidence tags are visible', () => {
    const tinyBbox = [0.1, 0.2, 0.105, 0.205]; // 0.5% width & height
    const parsed = parseBBox(tinyBbox);
    expect(parsed).not.toBeNull();
    // width and height clamped to at least 2%
    expect(parsed?.width).toBeGreaterThanOrEqual(2);
    expect(parsed?.height).toBeGreaterThanOrEqual(2);
  });

  it('parses absolute PDF point coordinates [x0, y0, x1, y1]', () => {
    // 612x792 standard letter points
    const pointsBbox = [61.2, 79.2, 306, 396];
    const parsed = parseBBox(pointsBbox);
    expect(parsed).not.toBeNull();
    expect(parsed?.left).toBeCloseTo(10);
    expect(parsed?.top).toBeCloseTo(10);
    expect(parsed?.width).toBeCloseTo(40);
    expect(parsed?.height).toBeCloseTo(40);
  });

  it('parses object format with { x0, y0, x1, y1 }', () => {
    const objBbox = { x0: 0.15, y0: 0.25, x1: 0.45, y1: 0.55 };
    const parsed = parseBBox(objBbox);
    expect(parsed).not.toBeNull();
    expect(parsed?.left).toBeCloseTo(15);
    expect(parsed?.top).toBeCloseTo(25);
    expect(parsed?.width).toBeCloseTo(30);
    expect(parsed?.height).toBeCloseTo(30);
  });
});
