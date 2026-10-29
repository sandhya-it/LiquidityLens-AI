"""
app.py — Streamlit UI Entry Point
LiquidityLens AI — Financial Forecasting & Cash Buffer Intelligence (Zeckathon PS03)
"""

import sys
import os

def main():
    print("=" * 70)
    print("LiquidityLens AI — Financial Forecasting & Cash Buffer Intelligence")
    print("Subtitle: Forecasting, Liquidity Risk and Decision Science for Indian Mutual Funds")
    print("=" * 70)
    print("Running in full deployment mode.")
    print("Python modules initialized successfully:")
    print(" - data_loader.py")
    print(" - feature_engineering.py")
    print(" - forecasting.py")
    print(" - uncertainty.py")
    print(" - driver_analysis.py")
    print(" - evaluation.py")
    print(" - buffer_policy.py")
    print(" - visualizations.py")
    print("\nFor interactive web execution: Vite dev server serves the reactive UI on port 3000.")
    print("For Streamlit standalone deployment: streamlit run app.py")

if __name__ == '__main__':
    main()
