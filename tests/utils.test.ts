/**
 * tests/utils.test.ts
 *
 * Unit tests for the pure utility functions exported from lib/utils.ts.
 */

import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  cn,
  calculateTimeDecay,
  checkEmergence,
  formatWeight,
} from '../lib/utils';

afterEach(() => {
  vi.useRealTimers();
});

/* -------------------------------------------------------------------------- */
/*  cn                                                                        */
/* -------------------------------------------------------------------------- */

describe('cn', () => {
  it('merges multiple class names into a single string', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
  });

  it('handles conditional class names via clsx', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('btn', isActive && 'btn-active', isDisabled && 'btn-disabled')).toBe('btn btn-active');
  });

  it('filters out falsy values', () => {
    expect(cn('a', false, null, undefined, '', 0, 'b')).toBe('a b');
  });

  it('deduplicates conflicting tailwind classes via twMerge', () => {
    // twMerge should keep the last conflicting class
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('preserves non-conflicting classes', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4');
  });

  it('returns an empty string when given no inputs', () => {
    expect(cn()).toBe('');
  });

  it('handles arrays of class names', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });
});

/* -------------------------------------------------------------------------- */
/*  calculateTimeDecay                                                        */
/* -------------------------------------------------------------------------- */

describe('calculateTimeDecay', () => {
  it('returns a positive number for a past date', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(); // 1 day ago
    const result = calculateTimeDecay(pastDate);
    expect(result).toBeGreaterThan(0);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('produces a larger decay for older dates', () => {
    const recentDate = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1 hour ago
    const oldDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(); // 30 days ago
    const recentDecay = calculateTimeDecay(recentDate);
    const oldDecay = calculateTimeDecay(oldDate);
    expect(oldDecay).toBeGreaterThan(recentDecay);
  });

  it('uses 1.8 as the default gravity constant', () => {
    // With gravity 1.8, a date ~1 hour ago => hoursSinceCreation ≈ 3 => 3^1.8
    const oneHourAgo = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const result = calculateTimeDecay(oneHourAgo);
    // hoursSinceCreation = 1 + 2 = 3, so 3^1.8 ≈ 7.22
    expect(result).toBeCloseTo(Math.pow(3, 1.8), 1);
  });

  it('respects a custom gravity constant', () => {
    vi.useFakeTimers();
    const now = new Date('2025-01-01T12:00:00.000Z');
    vi.setSystemTime(now);
    const pastDate = new Date(now.getTime() - 1000 * 60 * 60 * 10).toISOString(); // 10 hours ago
    // hoursSinceCreation = 10 + 2 = 12
    const withGravity1 = calculateTimeDecay(pastDate, 1);
    const withGravity2 = calculateTimeDecay(pastDate, 2);
    expect(withGravity1).toBeCloseTo(12, 5);
    expect(withGravity2).toBeCloseTo(144, 5);
  });

  it('always adds a 2-hour offset to the elapsed time', () => {
    // 0 hours ago (now) => hoursSinceCreation = 0 + 2 = 2
    const now = new Date().toISOString();
    const result = calculateTimeDecay(now, 1); // gravity 1 for simplicity
    // Should be close to 2 (allowing for tiny time elapsed during execution)
    expect(result).toBeGreaterThanOrEqual(2);
    expect(result).toBeLessThan(2.1);
  });
});

/* -------------------------------------------------------------------------- */
/*  checkEmergence                                                            */
/* -------------------------------------------------------------------------- */

describe('checkEmergence', () => {
  it('returns true when weight exceeds parentWeight * threshold', () => {
    expect(checkEmergence(130, 100, 1.2)).toBe(true);
  });

  it('returns false when weight equals parentWeight * threshold', () => {
    // 120 === 100 * 1.2, not strictly greater
    expect(checkEmergence(120, 100, 1.2)).toBe(false);
  });

  it('returns false when weight is below parentWeight * threshold', () => {
    expect(checkEmergence(100, 100, 1.2)).toBe(false);
    expect(checkEmergence(119, 100, 1.2)).toBe(false);
  });

  it('uses 1.2 as the default threshold', () => {
    // 121 > 100 * 1.2 = 120
    expect(checkEmergence(121, 100)).toBe(true);
    // 120 is not strictly greater than 120
    expect(checkEmergence(120, 100)).toBe(false);
  });

  it('handles zero parent weight', () => {
    // Any positive weight > 0 * threshold = 0
    expect(checkEmergence(1, 0, 1.2)).toBe(true);
    expect(checkEmergence(0, 0, 1.2)).toBe(false);
  });

  it('handles custom thresholds', () => {
    // 100 * 1.5 = 150; weight must be strictly greater
    expect(checkEmergence(151, 100, 1.5)).toBe(true);
    expect(checkEmergence(150, 100, 1.5)).toBe(false);
  });

  it('handles negative weights', () => {
    // -5 > -10 * 1.2 = -12
    expect(checkEmergence(-5, -10, 1.2)).toBe(true);
    // -15 is not > -12
    expect(checkEmergence(-15, -10, 1.2)).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/*  formatWeight                                                              */
/* -------------------------------------------------------------------------- */

describe('formatWeight', () => {
  it('formats weights above 100 with emerald color class', () => {
    const result = formatWeight(150);
    expect(result.colorClass).toBe('text-emerald-400');
    expect(result.value).toBe('150.0');
  });

  it('formats weight exactly 100 with amber color class', () => {
    // 100 is not > 100, falls to the > 80 branch
    const result = formatWeight(100);
    expect(result.colorClass).toBe('text-amber-400');
    expect(result.value).toBe('100.0');
  });

  it('formats weights between 81 and 99 with amber color class', () => {
    const result = formatWeight(90);
    expect(result.colorClass).toBe('text-amber-400');
    expect(result.value).toBe('90.0');
  });

  it('formats weight exactly 80 with zinc color class', () => {
    // 80 is not > 80, falls to default
    const result = formatWeight(80);
    expect(result.colorClass).toBe('text-zinc-300');
    expect(result.value).toBe('80.0');
  });

  it('formats weights below 80 with zinc color class', () => {
    const result = formatWeight(50);
    expect(result.colorClass).toBe('text-zinc-300');
    expect(result.value).toBe('50.0');
  });

  it('formats zero weight with zinc color class', () => {
    const result = formatWeight(0);
    expect(result.colorClass).toBe('text-zinc-300');
    expect(result.value).toBe('0.0');
  });

  it('formats negative weights with zinc color class', () => {
    const result = formatWeight(-10);
    expect(result.colorClass).toBe('text-zinc-300');
    expect(result.value).toBe('-10.0');
  });

  it('always formats the value to one decimal place', () => {
    expect(formatWeight(123.456).value).toBe('123.5');
    expect(formatWeight(99.99).value).toBe('100.0');
    expect(formatWeight(0.1).value).toBe('0.1');
  });

  it('returns an object with value and colorClass properties', () => {
    const result = formatWeight(50);
    expect(result).toHaveProperty('value');
    expect(result).toHaveProperty('colorClass');
    expect(typeof result.value).toBe('string');
    expect(typeof result.colorClass).toBe('string');
  });
});
