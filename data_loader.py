"""
data_loader.py — Data Ingestion and Quality Validation
LiquidityLens AI — Financial Forecasting & Cash Buffer Intelligence (Zeckathon PS03)
"""

import os
import csv
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any

STANDARD_SCHEMA_FIELDS = [
    'date',
    'fund_category',
    'net_flow',
    'AUM',
    'repo_rate',
    'overnight_rate',
    'banking_liquidity',
    'T_bill_yield',
    'commercial_paper_yield',
    'equity_market_return',
    'advance_tax_flag',
    'quarter_end_flag',
    'fiscal_year_end_flag',
]

def parse_date_to_monthly(raw_str: str) -> Optional[str]:
    """Parse various date formats into standardized YYYY-MM."""
    clean = raw_str.strip().replace('/', '-')
    if len(clean) >= 7 and clean[:4].isdigit() and clean[4] == '-' and clean[5:7].isdigit():
        return clean[:7]
    parts = clean.split('-')
    if len(parts) == 3 and len(parts[2]) == 4:
        return f"{parts[2]}-{parts[1].zfill(2)}"
    return None

def load_and_validate_csv(filepath: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Ingests official AMFI / RBI / CCIL CSV files, validates schema, checks for duplicates,
    detects date gaps, and reports missing values. Never silently invents missing data.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset file not found at: {filepath}")

    records = []
    seen_keys = set()
    duplicates_count = 0
    missing_counts = {k: 0 for k in STANDARD_SCHEMA_FIELDS}

    with open(filepath, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_date = row.get('date') or row.get('month') or row.get('period') or ''
            date_str = parse_date_to_monthly(raw_date)
            category = (row.get('fund_category') or row.get('category') or '').strip()

            if not date_str or category not in ['Liquid Fund', 'Overnight Fund']:
                continue

            rec_key = (date_str, category)
            if rec_key in seen_keys:
                duplicates_count += 1
                continue
            seen_keys.add(rec_key)

            month_num = int(date_str.split('-')[1])
            is_tax = 1 if month_num in [3, 6, 9, 12] else 0
            is_fy = 1 if month_num == 3 else 0

            def parse_val(k: str, default_val: float) -> float:
                v = row.get(k)
                if v is None or v.strip() == '':
                    missing_counts[k] += 1
                    return default_val
                try:
                    return float(v.replace(',', '').strip())
                except ValueError:
                    missing_counts[k] += 1
                    return default_val

            record = {
                'date': date_str,
                'fund_category': category,
                'net_flow': parse_val('net_flow', 0.0),
                'AUM': parse_val('AUM', 10000.0),
                'repo_rate': parse_val('repo_rate', 6.50),
                'overnight_rate': parse_val('overnight_rate', 6.45),
                'banking_liquidity': parse_val('banking_liquidity', 0.0),
                'T_bill_yield': parse_val('T_bill_yield', 6.80),
                'commercial_paper_yield': parse_val('commercial_paper_yield', 7.40),
                'equity_market_return': parse_val('equity_market_return', 1.0),
                'advance_tax_flag': int(parse_val('advance_tax_flag', float(is_tax))),
                'quarter_end_flag': int(parse_val('quarter_end_flag', float(is_tax))),
                'fiscal_year_end_flag': int(parse_val('fiscal_year_end_flag', float(is_fy))),
            }
            records.append(record)

    records.sort(key=lambda r: (r['fund_category'], r['date']))

    unique_months = sorted(list(set(r['date'] for r in records)))
    date_gaps = []
    for i in range(len(unique_months) - 1):
        y1, m1 = map(int, unique_months[i].split('-'))
        y2, m2 = map(int, unique_months[i+1].split('-'))
        exp_y = y1 if m1 < 12 else y1 + 1
        exp_m = m1 + 1 if m1 < 12 else 1
        if unique_months[i+1] != f"{exp_y}-{str(exp_m).zfill(2)}":
            date_gaps.append(f"Gap between {unique_months[i]} and {unique_months[i+1]}")

    report = {
        'total_records': len(records),
        'unique_months': len(unique_months),
        'start_date': unique_months[0] if unique_months else None,
        'end_date': unique_months[-1] if unique_months else None,
        'duplicates_detected': duplicates_count,
        'missing_fields': missing_counts,
        'date_gaps': date_gaps,
        'categories_present': list(set(r['fund_category'] for r in records)),
        'validation_status': 'PASS' if len(records) >= 12 else 'INSUFFICIENT_HISTORY',
    }

    return records, report
