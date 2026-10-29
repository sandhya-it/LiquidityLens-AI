"""
driver_analysis.py — Macroeconomic and Calendar Driver Diagnostics
LiquidityLens AI — Financial Forecasting & Cash Buffer Intelligence (Zeckathon PS03)
"""

import math
from typing import List, Dict, Any

def pearson_corr(x: List[float], y: List[float]) -> float:
    n = len(x)
    if n < 2:
        return 0.0
    mx = sum(x) / n
    my = sum(y) / n
    num = sum((x[i] - mx) * (y[i] - my) for i in range(n))
    den_x = sum((val - mx) ** 2 for val in x)
    den_y = sum((val - my) ** 2 for val in y)
    den = math.sqrt(den_x * den_y)
    return num / den if den != 0 else 0.0

def evaluate_drivers(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    flows = [r['net_flow'] for r in records]
    configs = [
        {
            'name': 'Advance Tax Due Dates (15th Mar/Jun/Sep/Dec)',
            'key': 'advance_tax_flag',
            'values': [float(r['advance_tax_flag']) for r in records],
            'direction': 'Outflow Driver (Negative Net Flow)',
            'importance': 92,
            'limitations': 'Magnitude depends on corporate advance tax collection growth.',
        },
        {
            'name': 'Fiscal Year-End March Liquidity Drain',
            'key': 'fiscal_year_end_flag',
            'values': [float(r['fiscal_year_end_flag']) for r in records],
            'direction': 'Outflow Driver (Negative Net Flow)',
            'importance': 95,
            'limitations': 'Annual occurrence limits sample size to available fiscal years.',
        },
        {
            'name': 'Banking System Liquidity (RBI Net LAF)',
            'key': 'banking_liquidity',
            'values': [float(r['banking_liquidity']) for r in records],
            'direction': 'Inflow Driver (Positive Net Flow)',
            'importance': 78,
            'limitations': 'Subject to RBI FX intervention pace and tax treasury flows.',
        },
        {
            'name': 'Commercial Paper Yield vs Repo Spread',
            'key': 'cp_spread',
            'values': [float(r['commercial_paper_yield'] - r['repo_rate']) for r in records],
            'direction': 'Inflow Driver (Positive Net Flow)',
            'importance': 68,
            'limitations': 'Wide spreads can also reflect institutional credit risk aversion.',
        },
    ]

    results = []
    for cfg in configs:
        r = pearson_corr(cfg['values'], flows)
        results.append({
            'name': cfg['name'],
            'correlation': round(r, 2),
            'importance': cfg['importance'],
            'direction': cfg['direction'],
            'limitations': cfg['limitations'],
        })
    results.sort(key=lambda x: x['importance'], reverse=True)
    return results
