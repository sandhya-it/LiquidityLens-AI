"""
visualizations.py — Interactive Financial Charting
LiquidityLens AI — Financial Forecasting & Cash Buffer Intelligence (Zeckathon PS03)
"""

from typing import List, Dict, Any

def get_forecast_plotly_figure_dict(historical: List[Dict[str, Any]], forecasts: List[Dict[str, Any]], category: str) -> Dict[str, Any]:
    """Generates standard Plotly chart specification dictionary for forecast fan chart."""
    hist_x = [r['date'] for r in historical[-12:]]
    hist_y = [r['net_flow'] for r in historical[-12:]]

    fc_x = [f['forecast_month'] for f in forecasts]
    fc_point = [f['point_forecast'] for f in forecasts]
    fc_u95 = [f['upper95'] for f in forecasts]
    fc_l95 = [f['lower95'] for f in forecasts]

    return {
        'title': f'{category} 3-Month Net Flow Projections & Prediction Intervals',
        'history': {'x': hist_x, 'y': hist_y},
        'forecast': {'x': fc_x, 'point': fc_point, 'upper95': fc_u95, 'lower95': fc_l95},
    }
