<div align="center">

#  IPL 2025 Player Ranker

**A full-stack web app that ranks IPL 2025 batsmen and bowlers using a custom ML pipeline, predicts season impact scores with a GradientBoosting model, and generates AI-powered scouting reports via the Claude API.**

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.5-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

</div>

---

##  Preview

| Rankings Page | Player Detail |
|---|---|
| ML-scored grid with player photos & team logos | Radar chart · GBR feature importance · AI scouting report |

---

##  Features

- **ML Composite Ranking** — `MinMaxScaler` normalises 5 domain-engineered features per player type, then applies research-backed weights to produce a 0–100 score that goes beyond raw runs or wickets
- **Impact Score Prediction** — A `GradientBoostingRegressor` trained on 200 synthetic IPL-distribution samples predicts each player's season impact (5-fold CV R² ≈ 0.92)
- **AI Scouting Reports** — A prompt-engineered Claude claude-sonnet-4-20250514 call generates structured, stat-grounded scouting analyses with strengths, weaknesses, and a one-line verdict
- **Interactive Frontend** — Filter by team, sort by any stat, radar charts for feature breakdowns, horizontal bar chart for GBR feature importances
- **Player Photos + Team Logos** — ESPNcricinfo headshots and official IPL CDN team logos with graceful fallback avatars
- **No All-rounders** — Intentionally excluded due to the IPL Impact Player rule distorting multi-role statistics

---

##  ML Architecture

The backend runs a **two-stage pipeline** — ranking and prediction are separate models answering different questions.

### Stage 1 — Composite Ranking (`MinMaxScaler`)

All features are normalised to `[0, 1]` so no single stat dominates by virtue of its scale (e.g. raw runs vs strike rate). A weighted sum then produces the final composite score.

**Batting weights:**

| Feature | Weight | Rationale |
|---|---|---|
| Runs | 30% | Primary volume contribution |
| Average | 25% | Consistency and wicket preservation |
| Strike Rate | 20% | T20 tempo and scoring speed |
| Consistency (50s+100s per match) | 15% | Match-winning ability |
| Boundary Rate (4s + 1.5×6s / balls) | 10% | Attacking intent |

**Bowling weights:**

| Feature | Weight | Rationale |
|---|---|---|
| Wickets | 35% | Primary job — take wickets |
| Bowling Average (inverted) | 25% | Cost of each wicket |
| Economy Rate (inverted) | 20% | Run prevention |
| Bowling SR (inverted) | 15% | How quickly wickets are taken |
| Match Impact (3W + 2×5W hauls) | 5% | Big-match performances |

> Economy, average, and bowling SR are **inverted** before scaling so that a lower real value maps to a higher model score.

### Stage 2 — Impact Prediction (`GradientBoostingRegressor`)

A `GradientBoostingRegressor` (200 estimators, depth 3, LR 0.05) is trained on synthetic multi-season IPL distribution data, then predicts an absolute 0–100 impact score for each 2025 player. Feature importances are visualised per player on the detail page.

```
n_estimators = 200    # sequential trees
max_depth    = 3      # shallow — prevents overfitting
learning_rate = 0.05  # conservative — each tree contributes 5%
subsample    = 0.8    # stochastic — each tree sees 80% of data
cv R²        ≈ 0.92   # batting  |  ≈ 0.89 bowling
```

### Stage 3 — AI Scouting Reports (Claude API)

Each player detail page can generate a Claude-powered scouting report. The system prompt is carefully structured to produce a **5-section analysis** grounded in the player's real stats and ML score:

```
1. Overview      — 2 sentences on the player's season identity
2. Strengths     — 2–3 stat-backed bullet points
3. Areas to Watch — 1–2 genuine weaknesses or inconsistencies
4. ML Score Analysis — what the composite score reflects
5. Verdict       — one punchy line
```

---

##  Project Structure

```
ipl-2025-ranker/
│
├── backend/
│   ├── main.py                  # FastAPI app — all API endpoints
│   ├── models/
│   │   ├── ranking.py           # MinMaxScaler composite ranking model
│   │   └── prediction.py        # GradientBoostingRegressor impact model
│   ├── data/
│   │   ├── batting.csv          # IPL 2025 final batting stats (Top 20)
│   │   └── bowling.csv          # IPL 2025 final bowling stats (Top 20)
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Home.jsx          # Landing — hero, methodology, Top 3 snapshot
        │   ├── Batsmen.jsx       # Filterable/sortable batsmen rankings grid
        │   ├── Bowlers.jsx       # Filterable/sortable bowlers rankings grid
        │   └── PlayerDetail.jsx  # Full player page — radar, GBR chart, AI report
        ├── components/
        │   ├── PlayerCard.jsx    # Card with photo, team logo, score bar
        │   ├── PlayerRadar.jsx   # Recharts radar for feature scores
        │   ├── StatTable.jsx     # Season stats breakdown
        │   └── AIInsight.jsx     # Claude AI scouting panel
        └── assets/
            ├── playerImages.js   # ESPNcricinfo headshot URL mapping (40 players)
            └── teamLogos.js      # Official IPL CDN team logo URLs (10 teams)
```

---

##  API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/batsmen` | All batsmen sorted by ML composite score |
| `GET` | `/api/batsmen/{name}` | Single batsman — full stats + per-feature ML scores |
| `GET` | `/api/batsmen/{name}/predict` | GBR impact prediction + feature importances |
| `GET` | `/api/bowlers` | All bowlers sorted by ML composite score |
| `GET` | `/api/bowlers/{name}` | Single bowler — full stats + per-feature ML scores |
| `GET` | `/api/bowlers/{name}/predict` | GBR impact prediction + feature importances |
| `GET` | `/api/insights/{type}/{name}` | Claude AI scouting report |
| `GET` | `/api/model-info/batting` | Model weights, features, and CV R² |
| `GET` | `/api/model-info/bowling` | Model weights, features, and CV R² |

---

##  Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com) (only needed for AI scouting reports)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/ipl-2025-ranker.git
cd ipl-2025-ranker
```

### 2. Start the backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Add your API key (optional — only for AI reports)
export ANTHROPIC_API_KEY=your_key_here   # Windows: set ANTHROPIC_API_KEY=...

# Run the server
uvicorn main:app --reload
```

Backend is now running at **http://localhost:8000**
Swagger docs available at **http://localhost:8000/docs**

### 3. Start the frontend

Open a **second terminal:**

```bash
cd frontend
npm install
npm run dev
```

Frontend is now running at **http://localhost:5173**

> The Vite dev server proxies all `/api` requests to `localhost:8000` automatically — no CORS configuration needed.

---

##  Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Recharts |
| Backend | FastAPI, Uvicorn, Python 3.11 |
| ML — Ranking | scikit-learn `MinMaxScaler`, engineered feature weighting |
| ML — Prediction | scikit-learn `GradientBoostingRegressor`, 5-fold CV |
| Data | Pandas, NumPy |
| AI | Anthropic Claude claude-sonnet-4-20250514 (prompt-engineered system prompt) |
| Images | ESPNcricinfo headshot CDN + official IPL team logo CDN |

---

##  Data

IPL 2025 final season stats (Top 20 batsmen and Top 20 bowlers) sourced from ESPNCricinfo, SportsTak, and official BCCI records as of June 2025.

All-rounders are **intentionally excluded** — the IPL Impact Player rule means all-rounders are frequently deployed in non-standard roles, which skews both their batting and bowling metrics and makes fair cross-player comparison unreliable.

---

##  License

MIT
