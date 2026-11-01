#!/usr/bin/env node

/**
 * Local / Background Keep-Alive Ping
 * Pings the deployed or local health check endpoint every 4 minutes.
 * Zero bloat, zero dependencies, native Node.js.
 */

const https = require('https');
const http = require('http');

const URL = process.env.PING_URL || 'https://meadowmist.vercel.app/api/health';
const INTERVAL_MS = parseInt(process.env.PING_INTERVAL_MS || String(4 * 60 * 1000), 10);

console.log(`[Keep-Alive] Starting heartbeat pinger for: ${URL}`);
console.log(`[Keep-Alive] Ping interval: ${INTERVAL_MS / 1000 / 60} minutes`);
console.log(`[Keep-Alive] Press Ctrl+C to stop anytime.\n`);

let pingCount = 0;

function ping() {
  pingCount++;
  const client = URL.startsWith('https') ? https : http;
  const start = Date.now();

  const req = client.get(URL, { headers: { 'Cache-Control': 'no-store' } }, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      const ms = Date.now() - start;
      const time = new Date().toLocaleTimeString();
      console.log(`[${time}] Ping #${pingCount} -> Status ${res.statusCode} (${ms}ms)`);
      if (res.statusCode !== 200) {
        console.warn(`[Keep-Alive] Non-200 response:`, body);
      }
    });
  });

  req.on('error', (err) => {
    const time = new Date().toLocaleTimeString();
    console.error(`[${time}] Ping #${pingCount} Error:`, err.message);
  });

  req.setTimeout(10000, () => {
    req.destroy(new Error('Request timed out'));
  });
}

// Initial ping
ping();

// Recurring interval
setInterval(ping, INTERVAL_MS);

