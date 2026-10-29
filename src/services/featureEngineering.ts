import { DataRecord } from '../types';

export interface EngineeredFeatures {
  date: string;
  fund_category: string;
  target_net_flow: number;
  lag_1: number;
  lag_2: number;
  lag_3: number;
  lag_12: number;
  rolling_mean_3: number;
  rolling_mean_12: number;
  month_num: number;
  advance_tax_flag: number;
  quarter_end_flag: number;
  fiscal_year_end_flag: number;
  repo_rate: number;
  overnight_rate: number;
  banking_liquidity: number;
  cp_spread: number;
  tbill_spread: number;
  equity_return: number;
  aum: number;
}

/**
 * Build lag and calendar features strictly backwards in time.
 * Never uses future information at any point t.
 */
export function buildEngineeredFeatures(records: DataRecord[]): EngineeredFeatures[] {
  // Sort chronologically
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const features: EngineeredFeatures[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i];
    const monthNum = parseInt(cur.date.split('-')[1], 10);

    // Lags - require strictly past values
    const lag1 = i >= 1 ? sorted[i - 1].net_flow : cur.net_flow;
    const lag2 = i >= 2 ? sorted[i - 2].net_flow : lag1;
    const lag3 = i >= 3 ? sorted[i - 3].net_flow : lag2;
    const lag12 = i >= 12 ? sorted[i - 12].net_flow : lag1;

    // Rolling statistics on historical observations up to i - 1
    const pastWindow3 = sorted.slice(Math.max(0, i - 3), i).map(r => r.net_flow);
    const rollingMean3 = pastWindow3.length > 0 
      ? pastWindow3.reduce((a, b) => a + b, 0) / pastWindow3.length 
      : cur.net_flow;

    const pastWindow12 = sorted.slice(Math.max(0, i - 12), i).map(r => r.net_flow);
    const rollingMean12 = pastWindow12.length > 0 
      ? pastWindow12.reduce((a, b) => a + b, 0) / pastWindow12.length 
      : cur.net_flow;

    const cpSpread = cur.commercial_paper_yield - cur.repo_rate;
    const tbillSpread = cur.T_bill_yield - cur.repo_rate;

    features.push({
      date: cur.date,
      fund_category: cur.fund_category,
      target_net_flow: cur.net_flow,
      lag_1: lag1,
      lag_2: lag2,
      lag_3: lag3,
      lag_12: lag12,
      rolling_mean_3: rollingMean3,
      rolling_mean_12: rollingMean12,
      month_num: monthNum,
      advance_tax_flag: cur.advance_tax_flag,
      quarter_end_flag: cur.quarter_end_flag,
      fiscal_year_end_flag: cur.fiscal_year_end_flag,
      repo_rate: cur.repo_rate,
      overnight_rate: cur.overnight_rate,
      banking_liquidity: cur.banking_liquidity,
      cp_spread: cpSpread,
      tbill_spread: tbillSpread,
      equity_return: cur.equity_market_return,
      aum: cur.AUM,
    });
  }

  return features;
}

/**
 * Chronological split preserving temporal order
 */
export function chronologicalTrainTestSplit<T extends { date: string }>(
  items: T[],
  testSizeMonths: number
): { train: T[]; test: T[] } {
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
  const splitIdx = Math.max(1, sorted.length - testSizeMonths);
  return {
    train: sorted.slice(0, splitIdx),
    test: sorted.slice(splitIdx),
  };
}
