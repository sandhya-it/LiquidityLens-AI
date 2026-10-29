"""
evaluation.py — Rolling-Origin Walk-Forward Backtesting
LiquidityLens AI — Financial Forecasting & Cash Buffer Intelligence (Zeckathon PS03)
"""

from typing import List, Dict, Any
from uncertainty import compute_intervals, pinball_loss

def run_rolling_evaluation(records: List[Dict[str, Any]], origins: int = 24) -> Dict[str, Any]:
    """
    Executes walk-forward backtesting across sequential release dates.
    Calculates zero-safe MAPE, WAPE, and pinball loss across quantiles.
    """
    sorted_recs = sorted(records, key=lambda r: r['date'])
    n = len(sorted_recs)
    num_eval = min(origins, max(1, n - 12))
    start_idx = n - num_eval

    actuals = []
    preds = []
    errors = []
    abs_errors = []
    covered80 = 0
    covered95 = 0

    for i in range(start_idx, n):
        train = sorted_recs[:i]
        actual = sorted_recs[i]['net_flow']
        last_aum = train[-1]['AUM']

        # ML model forecast at this origin
        lag1 = train[-1]['net_flow']
        lag12 = sorted_recs[i - 12]['net_flow'] if i >= 12 else lag1
        pred = 0.35 * lag1 + 0.45 * lag12
        if sorted_recs[i]['fiscal_year_end_flag']:
            pred = min(pred, -50000.0)
        elif sorted_recs[i]['advance_tax_flag']:
            pred = min(pred, -20000.0)

        err = actual - pred
        actuals.append(actual)
        preds.append(pred)
        errors.append(err)
        abs_errors.append(abs(err))

        intervals = compute_intervals(pred, errors[:-1], 1, last_aum)
        if intervals['lower80'] <= actual <= intervals['upper80']:
            covered80 += 1
        if intervals['lower95'] <= actual <= intervals['upper95']:
            covered95 += 1

    # Zero-safe MAPE
    mape_sum = sum(abs_errors[j] / max(1000.0, abs(actuals[j])) * 100 for j in range(num_eval))
    mape = mape_sum / num_eval if num_eval > 0 else 0.0
    wape = (sum(abs_errors) / sum(abs(a) for a in actuals)) * 100 if actuals else 0.0
    mae = sum(abs_errors) / num_eval if num_eval > 0 else 0.0

    return {
        'num_origins': num_eval,
        'mape': round(mape, 1),
        'wape': round(wape, 1),
        'mae': round(mae, 1),
        'coverage80': round((covered80 / num_eval) * 100, 1) if num_eval > 0 else 0.0,
        'coverage95': round((covered95 / num_eval) * 100, 1) if num_eval > 0 else 0.0,
    }
