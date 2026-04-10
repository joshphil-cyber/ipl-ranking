"""
Player Performance Prediction Model
-------------------------------------
Uses a GradientBoostingRegressor trained on synthetic multi-season IPL data
to predict a player's "season impact score" (0–100) from their current stats.

Why GBR?
  - Handles non-linear interactions between SR, avg, and runs
  - Naturally robust to outliers (e.g. one explosive innings skewing SR)
  - Provides feature importances — great for explainability on a resume!

Training strategy:
  - Synthetic data is seeded from real IPL distribution ranges (2018–2024)
  - 200 samples for batsmen, 200 for bowlers
  - Target = "impact_score" derived from a known formula, adding noise
  - Then we predict on 2025 players to see how they compare
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score


# ─────────────────────────────────────────────
#  BATTING PREDICTION MODEL
# ─────────────────────────────────────────────
class BattingPredictionModel:
    def __init__(self):
        self.model = GradientBoostingRegressor(
            n_estimators=200,
            max_depth=3,
            learning_rate=0.05,
            subsample=0.8,
            random_state=42,
        )
        self.scaler = StandardScaler()
        self._trained = False
        self._train_on_synthetic()

    def _generate_synthetic_data(self, n=200) -> pd.DataFrame:
        """Simulate IPL historical batter seasons (2018–2024 distribution)."""
        rng = np.random.default_rng(42)
        data = {
            "runs_per_match": rng.normal(30, 12, n).clip(8, 70),
            "avg":            rng.normal(32, 12, n).clip(10, 70),
            "sr":             rng.normal(145, 20, n).clip(100, 210),
            "consistency":    rng.beta(2, 5, n) * 1.5,
            "boundary_rate":  rng.beta(3, 7, n),
        }
        df = pd.DataFrame(data)
        # Ground-truth impact score (deterministic formula + noise)
        df["impact_score"] = (
            df["runs_per_match"] * 0.30 / 70 * 100
            + df["avg"]          * 0.25 / 70 * 100
            + df["sr"]           * 0.20 / 210 * 100
            + df["consistency"]  * 0.15 / 1.5 * 100
            + df["boundary_rate"]* 0.10 * 100
            + rng.normal(0, 3, n)  # noise
        ).clip(0, 100)
        return df

    def _train_on_synthetic(self):
        df = self._generate_synthetic_data()
        X = df.drop("impact_score", axis=1)
        y = df["impact_score"]
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        self.cv_score = cross_val_score(self.model, X_scaled, y, cv=5, scoring="r2").mean()
        self._trained = True

    def predict(self, player_row: dict) -> dict:
        """Predict impact score for a single player dict."""
        runs_per_match = player_row["runs"] / player_row["matches"]
        consistency    = (player_row["fifties"] + player_row["hundreds"] * 2) / player_row["matches"]
        boundary_rate  = (player_row["fours"] + player_row["sixes"] * 1.5) / player_row["balls_faced"]

        features = np.array([[
            runs_per_match,
            player_row["avg"],
            player_row["sr"],
            consistency,
            boundary_rate,
        ]])
        X_scaled = self.scaler.transform(features)
        score = float(self.model.predict(X_scaled)[0])
        score = round(max(0, min(100, score)), 2)

        importances = dict(zip(
            ["Runs/Match", "Average", "Strike Rate", "Consistency", "Boundary Rate"],
            [round(float(v * 100), 1) for v in self.model.feature_importances_],
        ))

        return {
            "predicted_impact_score": score,
            "model_r2": round(self.cv_score, 3),
            "feature_importances": importances,
            "interpretation": self._interpret(score),
        }

    @staticmethod
    def _interpret(score: float) -> str:
        if score >= 80: return "Elite — world-class impact this season"
        if score >= 65: return "High Impact — consistent match-winner"
        if score >= 50: return "Good — solid contributor above average"
        if score >= 35: return "Average — useful but inconsistent"
        return "Below Average — struggled to make an impact"


# ─────────────────────────────────────────────
#  BOWLING PREDICTION MODEL
# ─────────────────────────────────────────────
class BowlingPredictionModel:
    def __init__(self):
        self.model = GradientBoostingRegressor(
            n_estimators=200,
            max_depth=3,
            learning_rate=0.05,
            subsample=0.8,
            random_state=99,
        )
        self.scaler = StandardScaler()
        self._trained = False
        self._train_on_synthetic()

    def _generate_synthetic_data(self, n=200) -> pd.DataFrame:
        rng = np.random.default_rng(99)
        data = {
            "wickets_per_match": rng.normal(1.3, 0.5, n).clip(0.3, 3.0),
            "economy":           rng.normal(9.0, 1.2, n).clip(6.0, 13.0),
            "bowling_avg":       rng.normal(26, 8, n).clip(10, 50),
            "bowling_sr":        rng.normal(18, 4, n).clip(8, 32),
            "match_impact":      rng.poisson(0.7, n).clip(0, 5).astype(float),
        }
        df = pd.DataFrame(data)
        # Lower economy and avg = higher impact; more wickets = higher impact
        economy_score = (13 - df["economy"]) / 7
        avg_score     = (50 - df["bowling_avg"]) / 40
        wkts_score    = df["wickets_per_match"] / 3
        df["impact_score"] = (
            wkts_score    * 35
            + avg_score   * 25
            + economy_score * 20
            + (32 - df["bowling_sr"]) / 24 * 15
            + df["match_impact"] / 5 * 5
            + rng.normal(0, 3, n)
        ).clip(0, 100)
        return df

    def _train_on_synthetic(self):
        df = self._generate_synthetic_data()
        X = df.drop("impact_score", axis=1)
        y = df["impact_score"]
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        self.cv_score = cross_val_score(self.model, X_scaled, y, cv=5, scoring="r2").mean()
        self._trained = True

    def predict(self, player_row: dict) -> dict:
        wickets_per_match = player_row["wickets"] / player_row["matches"]
        match_impact      = player_row["three_fors"] + player_row["five_fors"] * 2

        features = np.array([[
            wickets_per_match,
            player_row["economy"],
            player_row["bowling_avg"],
            player_row["bowling_sr"],
            match_impact,
        ]])
        X_scaled = self.scaler.transform(features)
        score = float(self.model.predict(X_scaled)[0])
        score = round(max(0, min(100, score)), 2)

        importances = dict(zip(
            ["Wickets/Match", "Economy", "Bowling Avg", "Bowling SR", "Match Impact"],
            [round(float(v * 100), 1) for v in self.model.feature_importances_],
        ))

        return {
            "predicted_impact_score": score,
            "model_r2": round(self.cv_score, 3),
            "feature_importances": importances,
            "interpretation": self._interpret(score),
        }

    @staticmethod
    def _interpret(score: float) -> str:
        if score >= 80: return "Elite — dominant force with bat and ball"
        if score >= 65: return "High Impact — reliable wicket-taker"
        if score >= 50: return "Good — economical and effective"
        if score >= 35: return "Average — takes wickets but expensive"
        return "Below Average — struggled to contain or take wickets"
