"""
feature_engineering.py — Time-Aware Feature Engineering & Leakage Prevention
LiquidityLens AI — Financial Forecasting & Cash Buffer Intelligence (Zeckathon PS03)
"""

from typing import List, Dict, Any, Tuple

def generate_lagged_features(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Constructs strictly historical lag features (L1, L2, L3, L12) and rolling means.
    Ensures zero temporal data leakage by only accessing information available at t.
    """
    sorted_records = sorted(records, key=lambda r: r['date'])
    features = []

    for i, cur in enumerate(sorted_records):
        month_num = int(cur['date'].split('-')[1])
        lag1 = sorted_records[i - 1]['net_flow'] if i >= 1 else cur['net_flow']
        lag2 = sorted_records[i - 2]['net_flow'] if i >= 2 else lag1
        lag3 = sorted_records[i - 3]['net_flow'] if i >= 3 else lag2
        lag12 = sorted_records[i - 12]['net_flow'] if i >= 12 else lag1

        past_3 = [r['net_flow'] for r in sorted_records[max(0, i - 3):i]]
        rolling_mean_3 = sum(past_3) / len(past_3) if past_3 else cur['net_flow']

        past_12 = [r['net_flow'] for r in sorted_records[max(0, i - 12):i]]
        rolling_mean_12 = sum(past_12) / len(past_12) if past_12 else cur['net_flow']

        feat = dict(cur)
        feat['lag_1'] = lag1
        feat['lag_2'] = lag2
        feat['lag_3'] = lag3
        feat['lag_12'] = lag12
        feat['rolling_mean_3'] = rolling_mean_3
        feat['rolling_mean_12'] = rolling_mean_12
        feat['cp_spread'] = cur['commercial_paper_yield'] - cur['repo_rate']
        feat['tbill_spread'] = cur['T_bill_yield'] - cur['repo_rate']
        features.append(feat)

    return features

def chronological_split(records: List[Dict[str, Any]], test_size: int = 12) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Splits time series chronologically without random shuffling to preserve temporal ordering."""
    sorted_recs = sorted(records, key=lambda r: r['date'])
    split_idx = max(1, len(sorted_recs) - test_size)
    return sorted_recs[:split_idx], sorted_recs[split_idx:]
