<<<<<<< HEAD
# Weather app — full stack technical assessment

**Completed:** Tech Assessment **#1** (frontend) **and** **#2** (backend).

## What this project does

- **Search weather** by city, postal code, landmark, or `latitude,longitude`.
- **Use my location** (browser geolocation) for current conditions.
- **Current weather** plus **5-day forecast** with simple emoji icons (WMO weather codes).
- **Error handling** for unknown places, failed APIs, and geolocation denial/timeout.
- **Responsive layout** using flexible CSS (`flex`, `grid`, `minmax`, readable typography).
- **SQLite persistence** with full **CRUD** on saved “location + date range + daily temperatures” records.
- **Validations:** ISO dates, range order, max span; location resolved via Open-Meteo geocoding (fuzzy alternatives available from `/api/weather/geocode`).
- **Extra APIs:** **Google Maps** embed when `VITE_GOOGLE_MAPS_API_KEY` is set; otherwise **OpenStreetMap + Leaflet**; links to Google Maps / OSM; optional **YouTube Data API** (see below).
- **Export** all saved rows as **JSON, CSV, XML, Markdown, or PDF** (`/api/export?format=…`).

Weather data: [Open-Meteo](https://open-meteo.com/) (no API key). Historical ranges use their archive API where needed.

## API keys — what you need from your side

| Key | Required? | Where to put it | What it enables |
|-----|-----------|-----------------|-----------------|
| *(none)* | — | — | Weather + geocoding (Open-Meteo) work with **no key**. |
| **Google Maps (Maps JavaScript API)** | Optional (recommended for full marks on map integration) | `client/.env` as `VITE_GOOGLE_MAPS_API_KEY=...` | Embedded **Google Map** in the UI. **Rebuild** the client after adding it (`npm run build` or restart `npm run dev`). |
| **YouTube Data API v3** | Optional | `server/.env` as `YOUTUBE_API_KEY=...` | Video list for the current place; without it, the app shows a YouTube search link. |

### Google Cloud setup (quick)

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2. **APIs & Services → Library** → enable **Maps JavaScript API**.
3. **Credentials → Create credentials → API key**.
4. **Restrict the key** (important): Application restriction → **HTTP referrers**, add:
   - `http://localhost:5173/*` (Vite dev)
   - `http://localhost:3001/*` (production build served by Express)
   - Your production site URLs when you deploy.
5. Copy the key into `client/.env`:

```env
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

Billing: Google may ask you to enable billing for Maps; they provide a monthly free tier — check current [Google Maps pricing](https://mapsplatform.google.com/pricing/).

### YouTube (optional)

1. Google Cloud → enable **YouTube Data API v3**.
2. Create an API key (you can restrict it to that API only).
3. `server/.env`: `YOUTUBE_API_KEY=...`

**Do not commit** real keys. Copy from `.env.example` files, keep secrets in local `.env` only (they are listed in `.gitignore`).

## Linking this folder to a GitHub repository

1. **Create an empty repo on GitHub** (no README/license if you already have files locally):  
   GitHub → **New repository** → name it (e.g. `weather-app-assessment`) → create.

2. In your project root (`PMaccelerator`):

```bash
git init
git add .
git commit -m "Initial commit: full-stack weather assessment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

3. **Public repo** (required by the brief unless you invite their accounts): on GitHub → **Settings** → set visibility to **Public**, or keep private and add collaborators `community@pmaccelerator.io` and `hr@pmaccelerator.io`.

4. If GitHub shows “repository already exists” with files, use `git pull origin main --allow-unrelated-histories` once, resolve conflicts, then push.

Use **SSH** instead of HTTPS if you prefer: `git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git`.

## Requirements / packages

| Part | File |
|------|------|
| Server | `server/package.json` |
| Client | `client/package.json` |

Install with:

```bash
cd server && npm install
cd ../client && npm install
```

## How to run

**Development (two terminals):**

```bash
# Terminal 1 — API + serves built client after you build once
cd server
npm run dev
```

```bash
# Terminal 2 — Vite dev server (proxies /api to port 3001)
cd client
npm run dev
```

Open **http://localhost:5173**. The UI calls `/api` through the Vite proxy.

**Production-style (single server):**

```bash
cd client && npm run build
cd ../server && npm start
```

Open **http://localhost:3001** (default API port).

See **API keys** above for YouTube and Google Maps `.env` setup.

## Demo video (submission)

Record a **1–2 minute** screen share walking through the UI, CRUD, exports, and briefly the `server/src` and `client/src` structure. Upload to Drive / YouTube / Vimeo and paste the URL in the form.

## Author / company note

The app footer includes the submitter name and a short pointer to **PM Accelerator** on LinkedIn, per the brief.
=======
# PMAccelerator-Full-Stack-Engineer-Technical-Assignment
>>>>>>> 7c498097e772574d42612fc187830bd79fa3c800
