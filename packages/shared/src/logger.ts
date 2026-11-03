export type LogLevel = 'info' | 'warn' | 'error' | 'audit';

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export function logEvent(
  level: LogLevel,
  context: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  const entry: StructuredLog = {
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
    metadata,
  };
  const json = JSON.stringify(entry);
  if (level === 'error') {
    console.error(json);
  } else if (level === 'warn') {
    console.warn(json);
  } else {
    console.log(json);
  }
}

export const logger = {
  info: (context: string, message: string, metadata?: Record<string, unknown>) =>
    logEvent('info', context, message, metadata),
  warn: (context: string, message: string, metadata?: Record<string, unknown>) =>
    logEvent('warn', context, message, metadata),
  error: (context: string, message: string, metadata?: Record<string, unknown>) =>
    logEvent('error', context, message, metadata),
  audit: (context: string, message: string, metadata?: Record<string, unknown>) =>
    logEvent('audit', context, message, metadata),
};

