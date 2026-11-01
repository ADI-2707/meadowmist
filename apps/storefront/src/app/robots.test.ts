import { describe, it, expect } from 'vitest';
import robots from './robots';

describe('Storefront Robots Configuration', () => {
  it('defines crawler rules and indexes sitemap', () => {
    const config = robots();

    expect(config.rules).toBeDefined();
    const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;

    expect(rules.userAgent).toBe('*');
    expect(rules.allow).toBe('/');
    expect(rules.disallow).toContain('/checkout');
    expect(rules.disallow).toContain('/account/');
    expect(rules.disallow).toContain('/api/');
    expect(config.sitemap).toBe('https://meadowmist.in/sitemap.xml');
  });
});

