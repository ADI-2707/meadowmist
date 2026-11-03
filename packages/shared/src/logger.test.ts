import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger, logEvent } from './logger';

describe('Structured JSON Audit Logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('outputs structured JSON with timestamp, level, context and message', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    logEvent('info', 'TEST_CONTEXT', 'Test message', { orderId: 'ord_123' });

    expect(consoleSpy).toHaveBeenCalledOnce();
    const rawArg = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(rawArg);

    expect(parsed.level).toBe('info');
    expect(parsed.context).toBe('TEST_CONTEXT');
    expect(parsed.message).toBe('Test message');
    expect(parsed.metadata).toEqual({ orderId: 'ord_123' });
    expect(parsed.timestamp).toBeDefined();
  });

  it('routes error level to console.error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.error('PAYMENT_ERROR', 'Card authorization failed', { code: 'E_DECLINED' });

    expect(errorSpy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(errorSpy.mock.calls[0][0]);
    expect(parsed.level).toBe('error');
    expect(parsed.context).toBe('PAYMENT_ERROR');
  });

  it('routes warn level to console.warn', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logger.warn('INVENTORY', 'Low stock warning', { stock: 2 });

    expect(warnSpy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(warnSpy.mock.calls[0][0]);
    expect(parsed.level).toBe('warn');
  });

  it('routes audit level to console.log', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    logger.audit('ADMIN_ACTION', 'Product archived by admin', { productId: 'prod_99' });

    expect(logSpy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(logSpy.mock.calls[0][0]);
    expect(parsed.level).toBe('audit');
    expect(parsed.metadata).toEqual({ productId: 'prod_99' });
  });
});

