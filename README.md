# CVCraft — local setup

## What this is
A small Express server (`server.js`) that serves the CVCraft frontend
(`public/index.html`) and proxies requests to the Anthropic API so your
API key never touches the browser.

## Requirements
- Node.js 18 or newer (check with `node -v`)
- An Anthropic API key (console.anthropic.com → API Keys)

## Setup (first time only)

1. Open a terminal in this folder.

2. Install dependencies:
   ```
   npm install
   ```

3. Create your `.env` file:
   ```
   cp .env.example .env
   ```
   Windows (Command Prompt):
   ```
   copy .env.example .env
   ```

4. Open `.env` in a text editor and paste your real key:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxx
   ```
   Save the file.

## Run it

```
npm start
```

You should see:
```
CVCraft proxy running at http://localhost:3000
API key: ✓ loaded from .env
```

Open **http://localhost:3000** in your browser. Fill the form, click
"Set my CV in type" — it will call Claude for real and stream the CV
into the page on the right.

## Common problems

**"API key: ✗ MISSING"**
Your `.env` file wasn't found or the key wasn't set. Make sure `.env`
(not `.env.example`) exists in the same folder as `server.js`, and that
the line reads exactly `ANTHROPIC_API_KEY=sk-ant-...` with no quotes,
no spaces around the `=`.

**"Could not reach the composing service" in the browser**
The server isn't running, or it's running on a different port than the
page expects. Check the terminal for errors. Restart with `npm start`.

**Port 3000 already in use**
Add a line to `.env`:
```
PORT=3001
```
Then open `http://localhost:3001` instead.

**"Upstream request failed" in the terminal**
Usually means the API key is invalid, expired, or has no remaining
credit. Check console.anthropic.com → Billing.

## While you're developing

`npm run dev` restarts the server automatically when you edit
`server.js`. The frontend (`public/index.html`) doesn't need a restart —
just refresh the browser tab after editing it.

## Next steps once this works
- Swap the "Pay & release" simulated button for a real Stripe Checkout session
- Deploy to Vercel, Render, or Railway so it's reachable from the internet
- Lock down CORS by setting `ALLOWED_ORIGIN` in `.env` to your real domain
