/**
 * Prediction intervals and empirical uncertainty calibration
 * Computes 80% and 95% prediction intervals based on historical out-of-sample forecast errors
 * and validates interval ordering invariants.
 */

export interface IntervalBounds {
  lower80: number;
  upper80: number;
  lower95: number;
  upper95: number;
}

export function computePredictionIntervals(
  pointForecast: number,
  historicalErrors: number[], // actual - predicted on held-out data
  horizon: number, // 1, 2, or 3
  aum: number
): IntervalBounds {
  // If insufficient historical errors, use conservative heuristic based on fund volatility and AUM
  if (!historicalErrors || historicalErrors.length < 5) {
    const conservativeStd = Math.max(15000, aum * 0.05) * Math.sqrt(horizon);
    const z80 = 1.282;
    const z95 = 1.960;

    return {
      lower80: pointForecast - z80 * conservativeStd,
      upper80: pointForecast + z80 * conservativeStd,
      lower95: pointForecast - z95 * conservativeStd,
      upper95: pointForecast + z95 * conservativeStd,
    };
  }

  // Horizon scaling factor: uncertainty compounds as horizon increases
  const horizonInflation = Math.sqrt(horizon);

  // Sort errors to find empirical quantiles
  const sortedErrors = [...historicalErrors].sort((a, b) => a - b);
  const n = sortedErrors.length;

  const getQuantile = (q: number): number => {
    const pos = (n - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sortedErrors[base + 1] !== undefined) {
      return sortedErrors[base] + rest * (sortedErrors[base + 1] - sortedErrors[base]);
    }
    return sortedErrors[base];
  };

  // 80% interval: 10th percentile and 90th percentile of errors
  // 95% interval: 2.5th percentile and 97.5th percentile of errors
  const q10 = getQuantile(0.10) * horizonInflation;
  const q90 = getQuantile(0.90) * horizonInflation;
  const q025 = getQuantile(0.025) * horizonInflation;
  const q975 = getQuantile(0.975) * horizonInflation;

  let lower80 = pointForecast + q10;
  let upper80 = pointForecast + q90;
  let lower95 = pointForecast + q025;
  let upper95 = pointForecast + q975;

  // Invariant verification: Ensure lower95 <= lower80 <= upper80 <= upper95
  if (lower80 > upper80) {
    const tmp = lower80;
    lower80 = upper80;
    upper80 = tmp;
  }
  if (lower95 > upper95) {
    const tmp = lower95;
    lower95 = upper95;
    upper95 = tmp;
  }
  if (lower95 > lower80) lower95 = lower80 - Math.abs(lower80 * 0.15 + 500);
  if (upper95 < upper80) upper95 = upper80 + Math.abs(upper80 * 0.15 + 500);

  return {
    lower80,
    upper80,
    lower95,
    upper95,
  };
}

/**
 * Calculate empirical coverage: Percentage of actual values falling inside intervals
 */
export function calculateEmpiricalCoverage(
  records: { actual: number; lower80: number; upper80: number; lower95: number; upper95: number }[]
): { coverage80: number; coverage95: number; valid: boolean } {
  if (records.length === 0) {
    return { coverage80: 0, coverage95: 0, valid: false };
  }

  let inside80 = 0;
  let inside95 = 0;

  records.forEach(r => {
    if (r.actual >= r.lower80 && r.actual <= r.upper80) inside80++;
    if (r.actual >= r.lower95 && r.actual <= r.upper95) inside95++;
  });

  return {
    coverage80: (inside80 / records.length) * 100,
    coverage95: (inside95 / records.length) * 100,
    valid: records.length >= 10,
  };
}

/**
 * Pinball Loss (Quantile Loss) for quantile tau:
 * L_tau(y, y_hat) = max(tau * (y - y_hat), (1 - tau) * (y_hat - y))
 */
export function pinballLoss(actual: number, predictedQuantile: number, tau: number): number {
  const error = actual - predictedQuantile;
  return error >= 0 ? tau * error : (tau - 1) * error;
}
