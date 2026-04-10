"""
ML Ranking Models for IPL 2025
-------------------------------
Uses scikit-learn's MinMaxScaler to normalize multi-dimensional player stats
and applies a domain-informed weighted composite scoring formula.

This is the core ML component — think of it as a custom "impact score" model
that goes beyond raw runs/wickets and rewards consistency, boundary efficiency,
and bowling control.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler


# ─────────────────────────────────────────────
#  BATTING RANKING MODEL
# ─────────────────────────────────────────────
class BattingRankingModel:
    """
    Composite batting score using 5 engineered features:
      - runs          : raw run contribution
      - avg           : consistency/reliability
      - sr            : scoring speed
      - consistency   : milestone-hitting rate (50s + 100s weighted)
      - boundary_rate : attacking intent (4s + weighted 6s per ball)

    Feature weights are inspired by T20 analytics research where SR & avg
    together explain ~80% of batting value in franchise cricket.
    """

    WEIGHTS = {
        "runs":           0.30,
        "avg":            0.25,
        "sr":             0.20,
        "consistency":    0.15,
        "boundary_rate":  0.10,
    }

    def __init__(self):
        self.scaler = MinMaxScaler()

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df["consistency"] = (df["fifties"] + df["hundreds"] * 2) / df["matches"]
        # 6s weighted 1.5× (harder to hit, more runs)
        df["boundary_rate"] = (df["fours"] + df["sixes"] * 1.5) / df["balls_faced"]
        return df

    def fit_rank(self, df: pd.DataFrame) -> pd.DataFrame:
        df = self._engineer_features(df)
        feature_cols = list(self.WEIGHTS.keys())

        scaled = pd.DataFrame(
            self.scaler.fit_transform(df[feature_cols]),
            columns=feature_cols,
            index=df.index,
        )

        df["composite_score"] = sum(
            scaled[feat] * weight for feat, weight in self.WEIGHTS.items()
        )
        # Scale to 0–100 for readability
        df["composite_score"] = (
            (df["composite_score"] - df["composite_score"].min())
            / (df["composite_score"].max() - df["composite_score"].min())
            * 100
        ).round(2)

        df["rank"] = df["composite_score"].rank(ascending=False).astype(int)
        df = df.sort_values("rank").reset_index(drop=True)

        # Per-feature normalized scores (for radar charts)
        for feat in feature_cols:
            df[f"{feat}_score"] = (scaled[feat] * 100).round(2)

        return df

    @property
    def feature_weights(self):
        return self.WEIGHTS


# ─────────────────────────────────────────────
#  BOWLING RANKING MODEL
# ─────────────────────────────────────────────
class BowlingRankingModel:
    """
    Composite bowling score using 5 engineered features:
      - wickets         : raw wicket-taking ability
      - avg_score       : bowling avg (inverted — lower is better)
      - economy_score   : runs conceded per over (inverted)
      - sr_score        : balls per wicket (inverted)
      - match_impact    : big-match performance (3W/5W hauls)

    Economy and average are inverted before scaling so that
    a lower real value maps to a higher model score.
    """

    WEIGHTS = {
        "wickets":       0.35,
        "avg_score":     0.25,
        "economy_score": 0.20,
        "sr_score":      0.15,
        "match_impact":  0.05,
    }

    def __init__(self):
        self.scaler = MinMaxScaler()

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        # Invert: lower real value → higher score
        df["avg_score"]     = 1 / (df["bowling_avg"] + 1e-6)
        df["economy_score"] = 1 / (df["economy"]     + 1e-6)
        df["sr_score"]      = 1 / (df["bowling_sr"]  + 1e-6)
        df["match_impact"]  = df["three_fors"] + df["five_fors"] * 2
        return df

    def fit_rank(self, df: pd.DataFrame) -> pd.DataFrame:
        df = self._engineer_features(df)
        feature_cols = list(self.WEIGHTS.keys())

        scaled = pd.DataFrame(
            self.scaler.fit_transform(df[feature_cols]),
            columns=feature_cols,
            index=df.index,
        )

        df["composite_score"] = sum(
            scaled[feat] * weight for feat, weight in self.WEIGHTS.items()
        )
        df["composite_score"] = (
            (df["composite_score"] - df["composite_score"].min())
            / (df["composite_score"].max() - df["composite_score"].min())
            * 100
        ).round(2)

        df["rank"] = df["composite_score"].rank(ascending=False).astype(int)
        df = df.sort_values("rank").reset_index(drop=True)

        for feat in feature_cols:
            df[f"{feat}_score"] = (scaled[feat] * 100).round(2)

        return df

    @property
    def feature_weights(self):
        return self.WEIGHTS
