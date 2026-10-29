export type FundCategory = 'Liquid Fund' | 'Overnight Fund';

export interface DataRecord {
  date: string; // YYYY-MM
  fund_category: FundCategory;
  net_flow: number; // in ₹ Crores (positive = net inflow, negative = net redemption)
  AUM: number; // in ₹ Crores
  repo_rate: number; // in % (e.g., 6.50)
  overnight_rate: number; // in % (TREPS / Call money, e.g., 6.45)
  banking_liquidity: number; // in ₹ Crores (+ = surplus, - = deficit)
  T_bill_yield: number; // 91-day T-bill yield in %
  commercial_paper_yield: number; // 3-month CP yield in %
  equity_market_return: number; // Monthly Nifty 50 return in %
  advance_tax_flag: number; // 1 for Mar, Jun, Sep, Dec, 0 otherwise
  quarter_end_flag: number; // 1 for Mar, Jun, Sep, Dec, 0 otherwise
  fiscal_year_end_flag: number; // 1 for March, 0 otherwise
  is_demo?: boolean;
}

export interface StandardSchemaField {
  key: keyof DataRecord;
  label: string;
  type: 'string' | 'number';
  required: boolean;
  unit: string;
  description: string;
  aliases: string[];
}

export interface DataQualityReport {
  totalRecords: number;
  uniqueMonths: number;
  startDate: string;
  endDate: string;
  liquidCount: number;
  overnightCount: number;
  missingValues: Record<string, number>;
  duplicateRows: number;
  dateGaps: string[];
  unitCheck: 'Valid (₹ Crores)' | 'Suspected Mismatch' | 'Unknown';
  status: 'Ready' | 'Incomplete History' | 'Critical Errors';
  isDemo: boolean;
  provenance: {
    source: string;
    retrievalDate: string;
    description: string;
  };
}

export interface ForecastPoint {
  horizon: number; // 1, 2, 3
  forecastMonth: string; // YYYY-MM
  pointForecast: number; // ₹ Cr
  lower80: number; // ₹ Cr
  upper80: number; // ₹ Cr
  lower95: number; // ₹ Cr
  upper95: number; // ₹ Cr
  modelUsed: 'Classical ETS/SARIMAX' | 'Machine Learning Regressor' | 'Seasonal Naive Baseline';
  uncertaintyWarning?: string;
}

export interface CategoryForecast {
  category: FundCategory;
  lastActualMonth: string;
  lastActualAUM: number;
  forecasts: ForecastPoint[];
  selectedModel: string;
  selectionReason: string;
  dataLimitations: string[];
}

export interface DriverInsight {
  name: string;
  key: string;
  category: 'Tax & Calendar' | 'Monetary Policy' | 'Market & Yields';
  correlation: number; // Pearson r
  spearmanCorr: number;
  importanceScore: number; // 0 - 100
  direction: 'Outflow Driver (Negative Net Flow)' | 'Inflow Driver (Positive Net Flow)' | 'Neutral / Regime Dependent';
  validationMethod: string;
  outOfSampleDelta: string;
  limitations: string;
}

export interface BacktestOriginResult {
  originIndex: number;
  originDate: string;
  targetMonth: string;
  actualFlow: number;
  predictedFlow: number;
  error: number;
  lower80: number;
  upper80: number;
  lower95: number;
  upper95: number;
  covered80: boolean;
  covered95: boolean;
}

export interface ModelBenchmarkScore {
  modelName: string;
  mape: number; // %
  wape: number; // %
  mae: number; // ₹ Cr
  pinball10: number;
  pinball20: number;
  pinball50: number;
  pinball80: number;
  pinball90: number;
  pinball95: number;
  coverage80: number; // %
  coverage95: number; // %
  numOrigins: number;
  selected: boolean;
  selectionReason: string;
}

export interface BufferPolicyParams {
  category: FundCategory;
  forecastHorizon: number; // 1, 2, 3
  conservativeQuantile: number; // e.g. 0.95
  opportunityYield: number; // % per annum, e.g. 7.20%
  overnightYield: number; // % per annum, e.g. 6.45%
  distressPenaltyRate: number; // % penalty on shortfall, e.g. 2.0%
  shortfallMultiplier: number; // problem statement specifies 3x
}

export interface BufferSimulationMetrics {
  policyName: string;
  recommendedBufferCr: number; // ₹ Cr
  bufferPctOfAUM: number; // %
  simulatedShortfallCount: number;
  totalShortfallCr: number; // ₹ Cr
  avgShortfallCr: number;
  idleCashReturnDragCr: number; // ₹ Cr
  shortfallPenaltyCr: number; // ₹ Cr
  totalDecisionCostCr: number; // ₹ Cr
  numBacktestPeriods: number;
}

export interface BufferComparisonResult {
  recommended: BufferSimulationMetrics;
  naiveBaseline: BufferSimulationMetrics;
  costSavingsCr: number;
  costSavingsPct: number;
  isRecommendedBetter: boolean;
  sensitivityCurve: { bufferPct: number; totalCostCr: number; idleCostCr: number; penaltyCostCr: number }[];
  methodologyNotes: string[];
}
