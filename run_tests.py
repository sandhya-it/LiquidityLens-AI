"""
run_tests.py — Comprehensive Test Runner for LiquidityLens AI
"""

import unittest
import sys

def main():
    loader = unittest.TestLoader()
    suite = loader.discover('tests', pattern='test_*.py')
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if not result.wasSuccessful():
        sys.exit(1)
    print("\nAll automated tests passed successfully!")

if __name__ == '__main__':
    main()
