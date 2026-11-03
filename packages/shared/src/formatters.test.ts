import { describe, it, expect } from 'vitest';
import { formatCurrency, formatINR, formatDate, formatRelativeTime } from './formatters';

describe('Shared Formatters', () => {
  it('formats currency in Indian Rupees format', () => {
    expect(formatCurrency(1200)).toBe('₹1,200');
    expect(formatCurrency(0)).toBe('₹0');
    expect(formatCurrency(49999)).toBe('₹49,999');
    expect(formatINR(1200)).toBe('₹1,200');
    expect(formatINR(0)).toBe('₹0');
  });

  it('formats dates consistently', () => {
    const date = new Date('2026-05-15T10:00:00Z');
    const formatted = formatDate(date);
    expect(formatted).toBeDefined();
    expect(typeof formatted).toBe('string');
  });

  it('formats relative time for recent timestamps', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('Just now');

    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    expect(formatRelativeTime(tenMinsAgo)).toBe('10m ago');

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
  });
});
