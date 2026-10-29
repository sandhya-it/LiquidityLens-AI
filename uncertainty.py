"""
uncertainty.py — Prediction Intervals, Quantiles, and Empirical Calibration
LiquidityLens AI — Financial Forecasting & Cash Buffer Intelligence (Zeckathon PS03)
"""

import math
from typing import List, Dict, Tuple, Any

def compute_intervals(point: float, errors: List[float], horizon: int, aum: float) -> Dict[str, float]:
    """
    Computes 80% and 95% empirical prediction intervals.
    Enforces the invariant: lower95 <= lower80 <= upper80 <= upper95.
    """
    horizon_factor = math.sqrt(horizon)
    if not errors or len(errors) < 5:
        std = max(15000.0, aum * 0.05) * horizon_factor
        return {
            'lower80': round(point - 1.282 * std, 1),
            'upper80': round(point + 1.282 * std, 1),
            'lower95': round(point - 1.960 * std, 1),
            'upper95': round(point + 1.960 * std, 1),
        }

    sorted_err = sorted(errors)
    n = len(sorted_err)

    def get_q(q: float) -> float:
        pos = (n - 1) * q
        base = int(pos)
        rest = pos - base
        if base + 1 < n:
            return sorted_err[base] + rest * (sorted_err[base + 1] - sorted_err[base])
        return sorted_err[base]

    q10 = get_q(0.10) * horizon_factor
    q90 = get_q(0.90) * horizon_factor
    q025 = get_q(0.025) * horizon_factor
    q975 = get_q(0.975) * horizon_factor

    lower80 = min(point + q10, point + q90)
    upper80 = max(point + q10, point + q90)
    lower95 = min(point + q025, point + q975)
    upper95 = max(point + q025, point + q975)

    if lower95 > lower80:
        lower95 = lower80 - abs(lower80 * 0.15 + 500)
    if upper95 < upper80:
        upper95 = upper80 + abs(upper80 * 0.15 + 500)

    return {
        'lower80': round(lower80, 1),
        'upper80': round(upper80, 1),
        'lower95': round(lower95, 1),
        'upper95': round(upper95, 1),
    }

def pinball_loss(actual: float, pred: float, tau: float) -> float:
    """Pinball loss for quantile tau."""
    err = actual - pred
    return tau * err if err >= 0 else (tau - 1.0) * err
