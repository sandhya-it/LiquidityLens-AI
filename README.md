#  LiquidityLens AI
### Financial Forecasting & Cash Buffer Intelligence

**LiquidityLens AI** is a financial forecasting platform that predicts monthly cash flows for Indian liquid and overnight mutual funds. It analyses financial and calendar-related factors, compares forecasting models, estimates prediction uncertainty, and recommends cash buffers to help fund managers balance redemption risk against lost returns.

## 🚀 Key Features

- **Three-Month Forecasting:** Predict monthly net flows for liquid and overnight mutual fund categories.
- **AI/ML Model Comparison:** Compare classical time-series models with machine-learning models.
- **Prediction Intervals:** Display 80% and 95% forecast ranges to communicate uncertainty.
- **Financial Driver Analysis:** Examine advance-tax dates, quarter-end effects, interest rates, banking liquidity, and equity-market movements.
- **Model Evaluation:** Assess forecasting performance using rolling-origin backtesting, MAPE, pinball loss, and interval coverage.
- **Cash Buffer Recommendation:** Estimate a suitable liquidity buffer and compare it with a historical baseline.
- **Cost Simulation:** Evaluate idle-cash return drag and redemption shortfall penalties.
- **Interactive Dashboard:** Present forecasts, model performance, key drivers, and liquidity recommendations in one place.
- **Data Validation:** Inspect missing values, duplicate records, date coverage, and dataset quality.

## 🎯 Problem Statement

Mutual fund managers must maintain enough liquidity to meet investor redemptions without keeping excessive funds idle. Inaccurate cash-flow forecasts can increase liquidity risk or reduce returns.

LiquidityLens AI aims to provide data-driven forecasts, transparent uncertainty estimates, and historical cash-buffer policy comparisons to support better liquidity planning.

## 💡 Proposed Solution

The platform combines financial data processing, time-series forecasting, machine learning, uncertainty estimation, and cash-buffer simulation. Users can upload historical data, compare model predictions, examine relevant drivers, and review the estimated costs of different liquidity policies.


## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Programming Language | Python |
| Dashboard | Streamlit |
| Data Processing | Pandas, NumPy |
| Forecasting | Statsmodels |
| Machine Learning | Scikit-learn |
| Visualisation | Plotly |
| Data Storage | CSV / Parquet / SQLite |
| Testing | Pytest |
| Deployment | Streamlit Community Cloud or compatible hosting |

## ⚙️ Application Workflow

1. Collect historical mutual fund flow and relevant financial data.
2. Validate, clean, and align the datasets.
3. Generate lagged, seasonal, and calendar-based features.
4. Train classical and machine-learning forecasting models.
5. Generate three-month forecasts and prediction intervals.
6. Evaluate models using chronological backtesting.
7. Analyse financial drivers and estimate cash-buffer requirements.
8. Display forecasts, performance metrics, and policy comparisons in the dashboard.

## 📁 Project Structure

```text
LiquidityLens-AI/
├── app.py
├── data_loader.py
├── feature_engineering.py
├── forecasting.py
├── uncertainty.py
├── driver_analysis.py
├── evaluation.py
├── buffer_policy.py
├── visualizations.py
├── requirements.txt
├── README.md
├── tests/
│   └── test_app.py
└── data/
    └── README.md


## 💻 Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/sandhya-it/LiquidityLens-AI.git
cd LiquidityLens-AI
```


### 2. Create a virtual environment

```bash
python -m venv .venv
```

Activate it on Windows:

```bash
.venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the application

```bash
streamlit run app.py
```

Open the local URL displayed in your terminal.

## 📈 Model Evaluation

The proposed evaluation framework includes:

- **MAPE:** Measures percentage forecast error, with care required when actual values are zero or close to zero.
- **Pinball Loss:** Evaluates quantile forecasts.
- **Interval Coverage:** Measures how often actual observations fall within the 80% and 95% prediction intervals.
- **Rolling-Origin Backtesting:** Evaluates forecasts using historical time-ordered data.
- **Cash Buffer Cost:** Compares estimated idle-cash return drag and redemption shortfall penalties against a baseline policy.


## 🔮 Future Enhancements

- Automated ingestion of official financial datasets.
- Forecast monitoring and model-drift detection.
- Additional mutual fund category support.
- Scenario analysis for unusual redemption events.
- Improved prediction-interval calibration.
- More detailed liquidity-risk reporting.

## ⚠️ Limitations

- Forecast quality depends on historical data availability and consistency.
- Financial relationships can change over time.
- Prediction intervals may be unreliable when historical observations are limited.
- Cash-buffer recommendations depend on documented assumptions and available yield data.
- Historical backtesting does not guarantee future performance.
