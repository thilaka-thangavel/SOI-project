# DrainWatch AI

## AI-Powered Urban Waterlogging Prediction and Early Warning System

DrainWatch AI is an experimental civic technology tool that helps municipal officers monitor, analyse, and respond to urban waterlogging risks.

> **⚠ Important:** All data is **synthetic** (demonstration only). Risk scores are experimental and **not** official flood warnings. Human inspection is required to confirm any actual flooding.

---

## Quick Start — Single URL, One Command

The entire application (frontend + backend + database) runs as **one website on one URL**: `http://localhost:5000`

### Option A — Double-click to Launch (Easiest)

```
Double-click:  drainwatch/START.bat
Then open:     http://localhost:5000
```

### Option B — Manual (Terminal)

```powershell
# 1. Install Python dependencies (only needed once)
cd "drainwatch\backend"
pip install -r requirements.txt

# 2. Start the server (serves EVERYTHING from one URL)
python app.py
```

Then open **http://localhost:5000** in your browser.

That's it. No separate frontend server needed.

---

## How It Works (Single-Server Architecture)

```
http://localhost:5000
       │
       ├── /              → Serves React app (index.html)
       ├── /risk-map      → Serves React app (React Router handles this)
       ├── /analytics     → Serves React app
       ├── /assets/*      → Serves compiled JS, CSS, fonts
       │
       └── /api/*         → Flask REST API (database, risk engine)
```

The React frontend is **pre-built** into `backend/static/` so Flask serves it directly as static files. There is no Node.js server involved at runtime.

---

## If You Want to Modify the Frontend Code

After making changes, rebuild the frontend:

```powershell
cd "drainwatch\frontend"
npm install          # only needed once
npm run build        # compiles into backend/static/
```

Then restart `python app.py`. For live development with hot-reload:

```powershell
# Terminal 1 (backend)
cd drainwatch\backend && python app.py

# Terminal 2 (frontend dev server with hot-reload)
cd drainwatch\frontend && npm run dev
# → Open http://localhost:5173 (proxies API to :5000)
```

---

## Features

| Page | URL | Description |
|------|-----|-------------|
| Overview | `/` | KPIs, rainfall chart, risk distribution, activity feed |
| Risk Map | `/risk-map` | Leaflet/OpenStreetMap — colour-coded risk circles |
| Rainfall | `/rainfall` | Time-series charts, intensity classification, add records |
| Drainage | `/drainage` | Drain condition cards, officer update workflow |
| Citizen Reports | `/reports` | Submit/view waterlogging reports, verification tracking |
| Risk Analysis | `/risk-analysis` | Factor breakdown, confidence, trend, explanation |
| Inspection Center | `/inspections` | Human verification workflow (flooding = officer-only) |
| Analytics | `/analytics` | 6 live charts |
| Data Sources | `/data-sources` | API docs, formula guide, database reset |
| PoC Experiment | `/poc-experiment` | Baseline vs system comparison, CSV export |

---

## Prerequisites

- **Python 3.9+** — [python.org](https://python.org)
- **Node.js 18+** — only needed if you want to modify frontend code

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript (pre-built, served by Flask) |
| Backend | Flask 3 + Python |
| Database | SQLite (auto-created, no setup needed) |
| Charts | Recharts |
| Maps | React-Leaflet + OpenStreetMap (no API key needed) |
| Risk Engine | Transparent weighted scoring formula |

---

## Risk Scoring Formula

```
Risk Score = (Rainfall × 35%) + (Drainage × 25%) + (Historical × 20%) + (Elevation × 10%) + (Reports × 10%)
```

| Score Range | Category |
|-------------|----------|
| 0–24 | Low |
| 25–49 | Moderate |
| 50–74 | High |
| 75–100 | Critical |

Confidence drops 20% per missing data field. Missing data ≠ "safe".

---

## File Structure

```
drainwatch/
├── START.bat                    ← Double-click to launch everything
├── README.md
├── backend/
│   ├── app.py                   ← Flask server (serves API + React frontend)
│   ├── models.py                ← Database models
│   ├── risk_engine.py           ← Weighted risk scoring
│   ├── seed_data.py             ← Synthetic data generator
│   ├── requirements.txt
│   ├── static/                  ← Pre-built React app (served at /)
│   │   ├── index.html
│   │   └── assets/
│   └── routes/                  ← REST API endpoints
└── frontend/                    ← React source (edit then npm run build)
    └── src/
        └── pages/               ← 10 application pages
```

---

## Ethical Safeguards

- All data is labelled **Synthetic Demo** — never real government data
- Risk scores are labelled **Experimental** — not official flood warnings
- Flooding is **never auto-confirmed** — only a human officer can mark flooding
- Missing data is penalised explicitly (confidence score drops)
- No personally identifiable information collected
