"""
tests/test_data.py — Tests for CSV Parsing, Category Separation & Leakage Prevention
"""

import unittest
import os
from data_loader import parse_date_to_monthly, load_and_validate_csv
from feature_engineering import generate_lagged_features, chronological_split

class TestDataIngestionAndFeatures(unittest.TestCase):
    def test_date_parsing(self):
        self.assertEqual(parse_date_to_monthly('2024-03'), '2024-03')
        self.assertEqual(parse_date_to_monthly('2024-03-15'), '2024-03')
        self.assertEqual(parse_date_to_monthly('15-03-2024'), '2024-03')
        self.assertIsNone(parse_date_to_monthly('invalid'))

    def test_chronological_split_no_leakage(self):
        records = [{'date': f'2024-{str(m).zfill(2)}', 'net_flow': m * 1000} for m in range(1, 13)]
        train, test = chronological_split(records, test_size=3)
        self.assertEqual(len(train), 9)
        self.assertEqual(len(test), 3)
        # Verify temporal invariant: all train dates strictly precede test dates
        max_train_date = max(r['date'] for r in train)
        min_test_date = min(r['date'] for r in test)
        self.assertTrue(max_train_date < min_test_date)

    def test_lag_features_no_future_leakage(self):
        records = [
            {'date': '2023-01', 'net_flow': 100, 'commercial_paper_yield': 7.5, 'repo_rate': 6.5, 'T_bill_yield': 6.8},
            {'date': '2023-02', 'net_flow': 200, 'commercial_paper_yield': 7.5, 'repo_rate': 6.5, 'T_bill_yield': 6.8},
            {'date': '2023-03', 'net_flow': -500, 'commercial_paper_yield': 7.5, 'repo_rate': 6.5, 'T_bill_yield': 6.8},
        ]
        feats = generate_lagged_features(records)
        self.assertEqual(len(feats), 3)
        # At t=1 (Feb), lag1 must be 100 (from Jan)
        self.assertEqual(feats[1]['lag_1'], 100)
        # At t=2 (Mar), lag1 must be 200 (from Feb) and lag2 must be 100 (from Jan)
        self.assertEqual(feats[2]['lag_1'], 200)
        self.assertEqual(feats[2]['lag_2'], 100)

if __name__ == '__main__':
    unittest.main()
