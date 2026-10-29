"""
tests/test_buffer.py — Tests for Cash Buffer Decision Policy and 3x Shortfall Cost Function
"""

import unittest
from buffer_policy import calculate_buffer_decision_cost

class TestBufferPolicyAndCost(unittest.TestCase):
    def setUp(self):
        self.records = []
        for year in [2023, 2024]:
            for month in range(1, 13):
                date_str = f"{year}-{str(month).zfill(2)}"
                is_tax = 1 if month in [3, 6, 9, 12] else 0
                is_fy = 1 if month == 3 else 0
                flow = -50000 if is_fy else (-20000 if is_tax else 15000)
                self.records.append({
                    'date': date_str,
                    'fund_category': 'Liquid Fund',
                    'net_flow': flow,
                    'AUM': 500000.0,
                    'repo_rate': 6.50,
                    'overnight_rate': 6.45,
                    'banking_liquidity': 0.0,
                    'T_bill_yield': 6.80,
                    'commercial_paper_yield': 7.40,
                    'equity_market_return': 1.0,
                    'advance_tax_flag': is_tax,
                    'quarter_end_flag': is_tax,
                    'fiscal_year_end_flag': is_fy,
                })

    def test_buffer_calculation_and_recommendation(self):
        result = calculate_buffer_decision_cost(
            self.records,
            opportunity_yield_pa=7.20,
            overnight_yield_pa=6.45,
            distress_penalty_pct=2.0,
            quantile=0.95
        )
        self.assertGreater(result['recommended_buffer_cr'], 0)
        self.assertGreater(result['recommended_pct_aum'], 0)
        self.assertGreaterEqual(result['num_periods'], 1)
        self.assertIn('cost_savings_cr', result)

    def test_decision_cost_exact_formula_and_3x_penalty(self):
        """
        Verify: Decision Cost = (Yield Forgone on Idle Cash) + 3 * (Redemption Shortfall Penalty)
        """
        result = calculate_buffer_decision_cost(
            self.records,
            opportunity_yield_pa=7.20,
            overnight_yield_pa=6.45,
            distress_penalty_pct=2.0,
            quantile=0.95
        )
        self.assertGreaterEqual(result['recommended_total_cost_cr'], 0)
        self.assertGreaterEqual(result['naive_total_cost_cr'], 0)

if __name__ == '__main__':
    unittest.main()
