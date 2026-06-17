// CVCraft — Backend Proxy Server
// Forwards requests to Google's free Gemini API, handles CORS.
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

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

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

// ── Gemini proxy endpoint ──
// Keeps the same /api/claude path and the same { messages: [...], stream: true }
// request shape the frontend already sends, so the frontend doesn't need to change.
// This endpoint translates that shape into what Gemini expects, and translates
// Gemini's streamed chunks back into the same simple text-delta shape the
// frontend already knows how to parse.
app.post('/api/claude', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: { message: 'GEMINI_API_KEY is not set on the server.' }
    });
  }

  // The frontend sends Anthropic-style { messages: [{ role, content }] }.
  // Gemini wants { contents: [{ role, parts: [{ text }] }] }.
  const userText = (req.body.messages || [])
    .map(m => (typeof m.content === 'string' ? m.content : ''))
    .join('\n\n');

  const geminiBody = {
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: {
      maxOutputTokens: req.body.max_tokens || 1200,
    },
  };

  const wantsStream = !!req.body.stream;
  const url = wantsStream
    ? `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`
    : `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      let message = 'Gemini API error ' + upstream.status;
      try { message = JSON.parse(errText).error?.message || message; } catch {}
      return res.status(upstream.status).json({ error: { message } });
    }

    if (!wantsStream) {
      const data = await upstream.json();
      const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
      return res.json({ content: [{ type: 'text', text }] });
    }

    // ── Streaming: translate Gemini SSE chunks into the simple shape
    // the frontend expects: data: {"type":"content_block_delta","delta":{"text":"..."}}
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let buffer = '';
    upstream.body.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === '[DONE]') continue;
        try {
          const parsed = JSON.parse(raw);
          const text = parsed.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
          if (text) {
            res.write(`data: ${JSON.stringify({ type: 'content_block_delta', delta: { text } })}\n\n`);
          }
        } catch {
          // Incomplete JSON fragment — wait for more data
        }
      }
    });

    upstream.body.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

    upstream.body.on('error', (e) => {
      console.error('[stream error]', e.message);
      res.end();
    });

  } catch (err) {
    console.error('[proxy error]', err.message);
    res.status(502).json({ error: { message: 'Upstream request failed: ' + err.message } });
  }
});

app.listen(PORT, () => {
  console.log(`\n  CVCraft proxy running at http://localhost:${PORT}`);
  console.log(`  Gemini key: ${process.env.GEMINI_API_KEY ? '✓ loaded from .env' : '✗ MISSING — set GEMINI_API_KEY'}\n`);
});
