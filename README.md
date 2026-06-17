# CVCraft — local setup

## What this is
A small Express server (`server.js`) that serves the CVCraft frontend
(`public/index.html`) and proxies requests to Google's free Gemini API
so your API key never touches the browser.

## Requirements
- Node.js 18 or newer (check with `node -v`)
- A free Gemini API key (aistudio.google.com/app/apikey — no credit card needed)

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
   GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
   Save the file.

## Run it

```
npm start
```

You should see:
```
CVCraft proxy running at http://localhost:3000
Gemini key: ✓ loaded from .env
```

Open **http://localhost:3000** in your browser. Fill the form, click
"Set my CV in type" — it calls Gemini for real and streams the CV
into the page on the right.

## Common problems

**"Gemini key: ✗ MISSING"**
Your `.env` file wasn't found or the key wasn't set. Make sure `.env`
(not `.env.example`) exists in the same folder as `server.js`, and that
the line reads exactly `GEMINI_API_KEY=AIza...` with no quotes, no
spaces around the `=`.

**"Could not reach the composing service" in the browser**
The server isn't running, or it's running on a different port than the
page expects. Check the terminal for errors. Restart with `npm start`.

**Port 3000 already in use**
Add a line to `.env`:
```
PORT=3001
```
Then open `http://localhost:3001` instead.

**Gemini error in the terminal**
Usually means the API key is invalid, or you've hit the free tier's
per-minute request limit (15 requests/minute on the free tier). Wait a
minute and try again, or check aistudio.google.com for your usage.

## While you're developing

`npm run dev` restarts the server automatically when you edit
`server.js`. The frontend (`public/index.html`) doesn't need a restart —
just refresh the browser tab after editing it.

## Next steps once this works
- Deploy to Render so it's reachable from the internet (set
  `GEMINI_API_KEY` in Render's Environment tab, same as locally)
- Lock down CORS by setting `ALLOWED_ORIGIN` in `.env` to your real domain
- Add a payment step later by flipping `FREE_MODE` to `false` in
  `public/index.html`
