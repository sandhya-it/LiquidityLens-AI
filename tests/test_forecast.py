"""
tests/test_forecast.py — Tests for Forecasting Engines, Prediction Intervals, and Metrics
"""

import unittest
from forecasting import forecast_seasonal_naive, forecast_classical_ets, forecast_ml_regressor
from uncertainty import compute_intervals, pinball_loss
from evaluation import run_rolling_evaluation

class TestForecastingEngine(unittest.TestCase):
    def setUp(self):
        # 24 synthetic monthly observations
        self.records = []
        for year in [2023, 2024]:
            for month in range(1, 13):
                date_str = f"{year}-{str(month).zfill(2)}"
                is_tax = 1 if month in [3, 6, 9, 12] else 0
                is_fy = 1 if month == 3 else 0
                flow = -40000 if is_fy else (-15000 if is_tax else 20000)
                self.records.append({
                    'date': date_str,
                    'fund_category': 'Liquid Fund',
                    'net_flow': flow,
                    'AUM': 500000.0,
                    'repo_rate': 6.50,
                    'overnight_rate': 6.45,
                    'banking_liquidity': -50000 if is_tax else 20000,
                    'T_bill_yield': 6.80,
                    'commercial_paper_yield': 7.40,
                    'equity_market_return': 1.0,
                    'advance_tax_flag': is_tax,
                    'quarter_end_flag': is_tax,
                    'fiscal_year_end_flag': is_fy,
                })

    def test_forecast_dimensions_three_months(self):
        fc_naive = forecast_seasonal_naive(self.records, horizon=3)
        self.assertEqual(len(fc_naive['forecasts']), 3)

        fc_ets = forecast_classical_ets(self.records, horizon=3)
        self.assertEqual(len(fc_ets['forecasts']), 3)

        fc_ml = forecast_ml_regressor(self.records, horizon=3)
        self.assertEqual(len(fc_ml['forecasts']), 3)

    def test_prediction_interval_ordering_invariant(self):
        point = 15000.0
        errors = [-20000, -10000, -5000, 2000, 8000, 12000, 25000]
        intervals = compute_intervals(point, errors, horizon=1, aum=500000.0)

        # Invariant check: lower95 <= lower80 <= upper80 <= upper95
        self.assertLessEqual(intervals['lower95'], intervals['lower80'])
        self.assertLessEqual(intervals['lower80'], intervals['upper80'])
        self.assertLessEqual(intervals['upper80'], intervals['upper95'])

    def test_pinball_loss_symmetry_and_quantiles(self):
        actual = 100.0
        pred = 80.0 # under-forecast by 20
        # for tau = 0.95, under-forecast error is positive: loss = tau * (100 - 80) = 0.95 * 20 = 19.0
        self.assertAlmostEqual(pinball_loss(actual, pred, 0.95), 19.0)

        pred_over = 120.0 # over-forecast by 20
        # for tau = 0.95, error is negative: loss = (tau - 1) * (-20) = -0.05 * (-20) = 1.0
        self.assertAlmostEqual(pinball_loss(actual, pred_over, 0.95), 1.0)
        # Verify under-forecasting is penalized 19x more heavily than over-forecasting at tau = 0.95
        self.assertAlmostEqual(pinball_loss(actual, pred, 0.95) / pinball_loss(actual, pred_over, 0.95), 19.0)

    def test_rolling_origin_evaluation(self):
        eval_res = run_rolling_evaluation(self.records, origins=12)
        self.assertGreater(eval_res['num_origins'], 0)
        self.assertGreaterEqual(eval_res['mape'], 0.0)
        self.assertGreaterEqual(eval_res['coverage80'], 0.0)
        self.assertGreaterEqual(eval_res['coverage95'], 0.0)

if __name__ == '__main__':
    unittest.main()
