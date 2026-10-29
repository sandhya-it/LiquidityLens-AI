"""
buffer_policy.py — Cash Buffer Intelligence and Cost Function Solver
LiquidityLens AI — Financial Forecasting & Cash Buffer Intelligence (Zeckathon PS03)
"""

from typing import List, Dict, Any

def calculate_buffer_decision_cost(
    records: List[Dict[str, Any]],
    opportunity_yield_pa: float = 7.20,
    overnight_yield_pa: float = 6.45,
    distress_penalty_pct: float = 2.0,
    quantile: float = 0.95
) -> Dict[str, Any]:
    """
    Implements the exact Zeckathon PS03 Cost Function:
    Decision Cost = (Yield Forgone on Idle Cash) + 3 * (Redemption Shortfall Penalty)
    Units: All monetary terms in ₹ Crores. Yields in % p.a. converted to monthly via (30/365).
    """
    sorted_recs = sorted(records, key=lambda r: r['date'])
    n = len(sorted_recs)
    latest_aum = sorted_recs[-1]['AUM']

    monthly_drag_rate = max(0.0, (opportunity_yield_pa - overnight_yield_pa) / 100.0) * (30.0 / 365.0)
    penalty_rate = distress_penalty_pct / 100.0
    multiplier = 3.0 # Mandated 3x penalty

    # Outflows
    outflows = [abs(r['net_flow']) for r in sorted_recs if r['net_flow'] < 0]
    outflows.sort()
    q_idx = int(len(outflows) * quantile)
    recommended_buffer = max(outflows[min(q_idx, len(outflows) - 1)] if outflows else latest_aum * 0.08, latest_aum * 0.05)

    # Naive baseline: same month outflow last year
    naive_buffer = latest_aum * 0.06
    if n >= 13 and sorted_recs[-13]['net_flow'] < 0:
        naive_buffer = abs(sorted_recs[-13]['net_flow'])

    eval_n = min(24, max(1, n - 12))
    start_idx = n - eval_n

    rec_idle_cost = 0.0
    rec_shortfall = 0.0
    rec_shortfall_count = 0

    naive_idle_cost = 0.0
    naive_shortfall = 0.0
    naive_shortfall_count = 0

    for i in range(start_idx, n):
        cur = sorted_recs[i]
        actual_outflow = abs(cur['net_flow']) if cur['net_flow'] < 0 else 0.0

        # Recommended
        r_sh = max(0.0, actual_outflow - recommended_buffer)
        r_id = max(0.0, recommended_buffer - actual_outflow)
        if r_sh > 0:
            rec_shortfall_count += 1
            rec_shortfall += r_sh
        rec_idle_cost += r_id * monthly_drag_rate

        # Naive
        past_outflow = abs(sorted_recs[i - 12]['net_flow']) if (i >= 12 and sorted_recs[i - 12]['net_flow'] < 0) else cur['AUM'] * 0.02
        n_sh = max(0.0, actual_outflow - past_outflow)
        n_id = max(0.0, past_outflow - actual_outflow)
        if n_sh > 0:
            naive_shortfall_count += 1
            naive_shortfall += n_sh
        naive_idle_cost += n_id * monthly_drag_rate

    rec_penalty = rec_shortfall * penalty_rate
    rec_total_cost = rec_idle_cost + multiplier * rec_penalty

    naive_penalty = naive_shortfall * penalty_rate
    naive_total_cost = naive_idle_cost + multiplier * naive_penalty

    savings = naive_total_cost - rec_total_cost

    return {
        'recommended_buffer_cr': round(recommended_buffer, 1),
        'recommended_pct_aum': round((recommended_buffer / latest_aum) * 100, 1),
        'recommended_shortfall_count': rec_shortfall_count,
        'recommended_total_cost_cr': round(rec_total_cost, 1),
        'naive_buffer_cr': round(naive_buffer, 1),
        'naive_pct_aum': round((naive_buffer / latest_aum) * 100, 1),
        'naive_shortfall_count': naive_shortfall_count,
        'naive_total_cost_cr': round(naive_total_cost, 1),
        'cost_savings_cr': round(savings, 1),
        'cost_savings_pct': round((savings / naive_total_cost) * 100, 1) if naive_total_cost > 0 else 0.0,
        'num_periods': eval_n,
    }
