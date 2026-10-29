import { DataRecord, FundCategory, BufferPolicyParams, BufferComparisonResult, BufferSimulationMetrics } from '../types';

/**
 * Cash-Buffer Decision Engine strictly implementing the Zeckathon PS03 Cost Function:
 * Decision cost = yield forgone on idle cash + 3 * redemption shortfall penalty.
 */

export function simulateCashBufferPolicy(
  records: DataRecord[],
  params: BufferPolicyParams
): BufferComparisonResult {
  const catRecords = records.filter(r => r.fund_category === params.category);
  const sorted = [...catRecords].sort((a, b) => a.date.localeCompare(b.date));
  const n = sorted.length;

  const methodologyNotes: string[] = [
    'Formula: Decision Cost = (Yield Forgone on Idle Cash) + 3 × (Redemption Shortfall Penalty).',
    'Yield Forgone Rate = (Opportunity Yield % - Overnight Cash Yield %) × (30 / 365).',
    'Shortfall Penalty = Shortfall Amount × Distress Liquidation Penalty Rate.',
    'Conservative Policy: Sets buffer to the 95th percentile conservative forecast outflow.',
    'Naive Baseline Policy: Holds last year same-month outflow (or 0 if last year was net inflow).',
  ];

  if (n < 13) {
    methodologyNotes.push('Historical record depth < 13 months. Results marked provisional.');
  }

  const latestRecord = sorted[sorted.length - 1];
  const currentAUM = latestRecord.AUM;

  // Monthly yield drag rate
  const annualSpread = Math.max(0, params.opportunityYield - params.overnightYield) / 100;
  const monthlyYieldDragRate = annualSpread * (30 / 365);
  const distressPenaltyRate = params.distressPenaltyRate / 100;
  const shortfallMultiplier = params.shortfallMultiplier; // strictly 3x per prompt

  // Calculate backtest over available rolling periods (origins with lag 12 available)
  const evalOrigins = Math.min(24, Math.max(1, n - 12));
  const startIndex = n - evalOrigins;

  let recTotalIdleCost = 0;
  let recTotalShortfall = 0;
  let recShortfallCount = 0;

  let naiveTotalIdleCost = 0;
  let naiveTotalShortfall = 0;
  let naiveShortfallCount = 0;

  // Track historical outflows (negative net flows)
  const historicalOutflows: number[] = [];
  sorted.forEach(r => {
    if (r.net_flow < 0) {
      historicalOutflows.push(Math.abs(r.net_flow));
    }
  });

  // Calculate 95th percentile conservative outflow
  const sortedOutflows = [...historicalOutflows].sort((a, b) => a - b);
  const q95Idx = Math.floor(sortedOutflows.length * params.conservativeQuantile);
  const conservativeOutflowCr = sortedOutflows.length > 0 
    ? sortedOutflows[Math.min(q95Idx, sortedOutflows.length - 1)]
    : currentAUM * 0.08;

  // Dynamic recommended buffer: 95th percentile outflow, calibrated to current AUM
  const recommendedBufferCr = Math.max(conservativeOutflowCr, currentAUM * 0.05);

  // Naive baseline buffer: Last year's same month outflow (from 12 months prior to latest)
  let naiveBaselineBufferCr = currentAUM * 0.06;
  if (n >= 13) {
    const lastYearRecord = sorted[n - 13];
    naiveBaselineBufferCr = lastYearRecord.net_flow < 0 ? Math.abs(lastYearRecord.net_flow) : currentAUM * 0.03;
  }

  // Backtest across evaluation origins
  for (let i = startIndex; i < n; i++) {
    const cur = sorted[i];
    const actualOutflow = cur.net_flow < 0 ? Math.abs(cur.net_flow) : 0;

    // Recommended Policy at this origin
    const originBuffer = Math.min(currentAUM * 0.20, Math.max(currentAUM * 0.04, conservativeOutflowCr * (cur.AUM / currentAUM)));
    const recShortfall = Math.max(0, actualOutflow - originBuffer);
    const recIdleCash = Math.max(0, originBuffer - actualOutflow);

    if (recShortfall > 0) {
      recShortfallCount++;
      recTotalShortfall += recShortfall;
    }
    recTotalIdleCost += recIdleCash * monthlyYieldDragRate;

    // Naive Baseline Policy at this origin (last year same month)
    let naiveBuffer = 0;
    if (i >= 12) {
      const pastYear = sorted[i - 12];
      naiveBuffer = pastYear.net_flow < 0 ? Math.abs(pastYear.net_flow) : cur.AUM * 0.02;
    } else {
      naiveBuffer = cur.AUM * 0.05;
    }

    const naiveShortfall = Math.max(0, actualOutflow - naiveBuffer);
    const naiveIdleCash = Math.max(0, naiveBuffer - actualOutflow);

    if (naiveShortfall > 0) {
      naiveShortfallCount++;
      naiveTotalShortfall += naiveShortfall;
    }
    naiveTotalIdleCost += naiveIdleCash * monthlyYieldDragRate;
  }

  const recPenaltyCost = recTotalShortfall * distressPenaltyRate;
  const recTotalCost = recTotalIdleCost + shortfallMultiplier * recPenaltyCost;

  const naivePenaltyCost = naiveTotalShortfall * distressPenaltyRate;
  const naiveTotalCost = naiveTotalIdleCost + shortfallMultiplier * naivePenaltyCost;

  const recommendedMetrics: BufferSimulationMetrics = {
    policyName: 'Quantile Cash Buffer (95th Tail)',
    recommendedBufferCr: Math.round(recommendedBufferCr * 10) / 10,
    bufferPctOfAUM: Math.round((recommendedBufferCr / currentAUM) * 1000) / 10,
    simulatedShortfallCount: recShortfallCount,
    totalShortfallCr: Math.round(recTotalShortfall * 10) / 10,
    avgShortfallCr: recShortfallCount > 0 ? Math.round((recTotalShortfall / recShortfallCount) * 10) / 10 : 0,
    idleCashReturnDragCr: Math.round(recTotalIdleCost * 10) / 10,
    shortfallPenaltyCr: Math.round(recPenaltyCost * 10) / 10,
    totalDecisionCostCr: Math.round(recTotalCost * 10) / 10,
    numBacktestPeriods: evalOrigins,
  };

  const naiveMetrics: BufferSimulationMetrics = {
    policyName: "Naive Baseline (Last Year's Same-Month Outflow)",
    recommendedBufferCr: Math.round(naiveBaselineBufferCr * 10) / 10,
    bufferPctOfAUM: Math.round((naiveBaselineBufferCr / currentAUM) * 1000) / 10,
    simulatedShortfallCount: naiveShortfallCount,
    totalShortfallCr: Math.round(naiveTotalShortfall * 10) / 10,
    avgShortfallCr: naiveShortfallCount > 0 ? Math.round((naiveTotalShortfall / naiveShortfallCount) * 10) / 10 : 0,
    idleCashReturnDragCr: Math.round(naiveTotalIdleCost * 10) / 10,
    shortfallPenaltyCr: Math.round(naivePenaltyCost * 10) / 10,
    totalDecisionCostCr: Math.round(naiveTotalCost * 10) / 10,
    numBacktestPeriods: evalOrigins,
  };

  const costSavingsCr = Math.round((naiveTotalCost - recTotalCost) * 10) / 10;
  const costSavingsPct = naiveTotalCost > 0 
    ? Math.round(((naiveTotalCost - recTotalCost) / naiveTotalCost) * 1000) / 10 
    : 0;

  // Generate sensitivity curve over buffer percentages from 2% to 25% of AUM
  const sensitivityCurve: { bufferPct: number; totalCostCr: number; idleCostCr: number; penaltyCostCr: number }[] = [];
  for (let pct = 2; pct <= 25; pct += 1) {
    const testBuffer = currentAUM * (pct / 100);
    let simIdle = 0;
    let simShortfall = 0;

    for (let i = startIndex; i < n; i++) {
      const cur = sorted[i];
      const actualOutflow = cur.net_flow < 0 ? Math.abs(cur.net_flow) : 0;
      const sh = Math.max(0, actualOutflow - testBuffer);
      const id = Math.max(0, testBuffer - actualOutflow);
      simShortfall += sh;
      simIdle += id * monthlyYieldDragRate;
    }

    const pen = simShortfall * distressPenaltyRate;
    const tot = simIdle + shortfallMultiplier * pen;

    sensitivityCurve.push({
      bufferPct: pct,
      totalCostCr: Math.round(tot * 10) / 10,
      idleCostCr: Math.round(simIdle * 10) / 10,
      penaltyCostCr: Math.round(pen * 10) / 10,
    });
  }

  return {
    recommended: recommendedMetrics,
    naiveBaseline: naiveMetrics,
    costSavingsCr,
    costSavingsPct,
    isRecommendedBetter: costSavingsCr > 0,
    sensitivityCurve,
    methodologyNotes,
  };
}
