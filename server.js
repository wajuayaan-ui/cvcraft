// CVCraft — Backend Proxy Server
// Forwards requests to Anthropic API with your key, handles CORS.
// Run: node server.js
// Requires: npm install express cors node-fetch dotenv

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',   // Lock down in production
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '4mb' }));

// ── Serve frontend ──
app.use(express.static(join(__dirname, 'public')));

// ── Health check ──
app.get('/health', (_, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ── Claude proxy endpoint ──
app.post('/api/claude', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: { message: 'ANTHROPIC_API_KEY is not set on the server.' }
    });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':         'application/json',
        'x-api-key':            apiKey,
        'anthropic-version':    '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');

    if (req.body.stream) {
      // node-fetch v3 body is a Node Readable in this runtime — pipe directly
      upstream.body.on('error', (e) => { console.error('[stream error]', e.message); res.end(); });
      upstream.body.pipe(res);
    } else {
      const data = await upstream.json();
      res.json(data);
    }

  } catch (err) {
    console.error('[proxy error]', err.message);
    res.status(502).json({ error: { message: 'Upstream request failed: ' + err.message } });
  }
});

app.listen(PORT, () => {
  console.log(`\n  CVCraft proxy running at http://localhost:${PORT}`);
  console.log(`  API key: ${process.env.ANTHROPIC_API_KEY ? '✓ loaded from .env' : '✗ MISSING — set ANTHROPIC_API_KEY'}\n`);
});
