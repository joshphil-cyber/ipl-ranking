"""
IPL 2025 Player Ranker — FastAPI Backend
==========================================
Exposes ML-powered ranking and prediction endpoints for the React frontend.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from pathlib import Path

from models.ranking import BattingRankingModel, BowlingRankingModel
from models.prediction import BattingPredictionModel, BowlingPredictionModel

app = FastAPI(title="IPL 2025 Player Ranker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load data & initialise models once on startup ──────────────────────────
DATA_DIR = Path(__file__).parent / "data"

_batting_raw  = pd.read_csv(DATA_DIR / "batting.csv")
_bowling_raw  = pd.read_csv(DATA_DIR / "bowling.csv")

batting_ranker   = BattingRankingModel()
bowling_ranker   = BowlingRankingModel()
batting_predictor = BattingPredictionModel()
bowling_predictor = BowlingPredictionModel()

_batting_ranked = batting_ranker.fit_rank(_batting_raw.copy())
_bowling_ranked = bowling_ranker.fit_rank(_bowling_raw.copy())


# ── Helpers ─────────────────────────────────────────────────────────────────
def df_to_records(df: pd.DataFrame) -> list[dict]:
    return df.where(pd.notnull(df), None).to_dict(orient="records")


# ── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "IPL 2025 Player Ranker API is running 🏏"}


# ── Batsmen ──────────────────────────────────────────────────────────────────

@app.get("/api/batsmen")
def get_batsmen():
    """Return all batsmen sorted by composite ML score."""
    return {"data": df_to_records(_batting_ranked)}


@app.get("/api/batsmen/{player_name}")
def get_batsman(player_name: str):
    """Return a single batsman's full stats + ML scores."""
    row = _batting_ranked[
        _batting_ranked["player"].str.lower() == player_name.lower()
    ]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Player '{player_name}' not found")
    return {"data": df_to_records(row)[0]}


@app.get("/api/batsmen/{player_name}/predict")
def predict_batsman(player_name: str):
    """Run GBR model and return predicted impact score for a batsman."""
    row = _batting_raw[
        _batting_raw["player"].str.lower() == player_name.lower()
    ]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Player '{player_name}' not found")
    result = batting_predictor.predict(row.iloc[0].to_dict())
    result["player"] = row.iloc[0]["player"]
    result["team"]   = row.iloc[0]["team"]
    return result


# ── Bowlers ──────────────────────────────────────────────────────────────────

@app.get("/api/bowlers")
def get_bowlers():
    """Return all bowlers sorted by composite ML score."""
    return {"data": df_to_records(_bowling_ranked)}


@app.get("/api/bowlers/{player_name}")
def get_bowler(player_name: str):
    row = _bowling_ranked[
        _bowling_ranked["player"].str.lower() == player_name.lower()
    ]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Player '{player_name}' not found")
    return {"data": df_to_records(row)[0]}


@app.get("/api/bowlers/{player_name}/predict")
def predict_bowler(player_name: str):
    """Run GBR model and return predicted impact score for a bowler."""
    row = _bowling_raw[
        _bowling_raw["player"].str.lower() == player_name.lower()
    ]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Player '{player_name}' not found")
    result = bowling_predictor.predict(row.iloc[0].to_dict())
    result["player"] = row.iloc[0]["player"]
    result["team"]   = row.iloc[0]["team"]
    return result


# ── Model metadata ───────────────────────────────────────────────────────────

@app.get("/api/model-info/batting")
def batting_model_info():
    return {
        "model": "Weighted MinMax Composite (Ranking) + GradientBoostingRegressor (Prediction)",
        "features": list(batting_ranker.feature_weights.keys()),
        "weights": batting_ranker.feature_weights,
        "prediction_r2": round(batting_predictor.cv_score, 3),
    }


@app.get("/api/model-info/bowling")
def bowling_model_info():
    return {
        "model": "Weighted MinMax Composite (Ranking) + GradientBoostingRegressor (Prediction)",
        "features": list(bowling_ranker.feature_weights.keys()),
        "weights": bowling_ranker.feature_weights,
        "prediction_r2": round(bowling_predictor.cv_score, 3),
    }


# ── AI Insights (Anthropic Claude) ───────────────────────────────────────────

import os, httpx

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

@app.get("/api/insights/{player_type}/{player_name}")
async def get_player_insights(player_type: str, player_name: str):
    """
    Uses Claude claude-sonnet-4-20250514 to generate a natural-language scouting report
    for a player based on their real 2025 stats + ML composite score.

    This endpoint is the 'prompting skills' showcase — the system prompt is
    carefully engineered to get structured, cricket-domain-aware analysis.
    """
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY not set")

    if player_type == "batsman":
        df = _batting_ranked
        row = df[df["player"].str.lower() == player_name.lower()]
        if row.empty:
            raise HTTPException(status_code=404, detail="Player not found")
        p = row.iloc[0].to_dict()
        stats_block = f"""
Player: {p['player']} ({p['team']})
Season Runs: {p['runs']} in {p['matches']} matches
Batting Average: {p['avg']}  |  Strike Rate: {p['sr']}
Hundreds: {p['hundreds']}  |  Fifties: {p['fifties']}
Fours: {p['fours']}  |  Sixes: {p['sixes']}
ML Composite Score: {p['composite_score']}/100  |  ML Rank: #{p['rank']}
"""
        domain = "IPL T20 batsman"
    else:
        df = _bowling_ranked
        row = df[df["player"].str.lower() == player_name.lower()]
        if row.empty:
            raise HTTPException(status_code=404, detail="Player not found")
        p = row.iloc[0].to_dict()
        stats_block = f"""
Player: {p['player']} ({p['team']})
Season Wickets: {p['wickets']} in {p['matches']} matches
Economy: {p['economy']}  |  Bowling Average: {p['bowling_avg']}
Bowling SR: {p['bowling_sr']}  |  Best Figures: {p['best_figures']}
3-Wicket Hauls: {p['three_fors']}  |  5-Wicket Hauls: {p['five_fors']}
ML Composite Score: {p['composite_score']}/100  |  ML Rank: #{p['rank']}
"""
        domain = "IPL T20 bowler"

    system_prompt = """You are an expert IPL cricket analyst with deep knowledge of T20 cricket strategy, 
player roles, and franchise cricket dynamics. You receive a player's season stats and ML impact score 
and produce a concise, insightful scouting report.

Your report MUST follow this exact structure:
1. **Overview** (2 sentences): What kind of player are they and what defines their IPL 2025 season?
2. **Strengths** (2-3 bullet points): Specific statistical strengths backed by the numbers given.
3. **Areas to Watch** (1-2 bullet points): Genuine areas where improvement or consistency is needed.
4. **ML Score Analysis** (1-2 sentences): Explain what the composite ML score reflects about this player's season.
5. **Verdict** (1 sentence): A punchy one-line take on their 2025 campaign.

Keep the tone professional but engaging. Be specific — reference the actual numbers. Max 200 words."""

    user_prompt = f"Generate a scouting report for this {domain}:\n{stats_block}"

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 500,
                "system": system_prompt,
                "messages": [{"role": "user", "content": user_prompt}],
            },
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="AI service error")

    data = response.json()
    insight_text = data["content"][0]["text"]

    return {
        "player": p["player"],
        "team": p["team"],
        "insight": insight_text,
        "model_used": "claude-sonnet-4-20250514",
    }
