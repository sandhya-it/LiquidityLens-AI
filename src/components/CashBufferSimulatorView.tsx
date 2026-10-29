import React, { useState } from 'react';
import { DataRecord, FundCategory, BufferPolicyParams } from '../types';
import { simulateCashBufferPolicy } from '../services/bufferPolicyEngine';
import { SensitivityCurveChart } from './Charts/SensitivityCurveChart';
import { formatINR, formatPercent } from '../utils/indianFormat';
import { Sliders, ShieldAlert, DollarSign, Calculator, HelpCircle, Check, ArrowRight } from 'lucide-react';

interface CashBufferSimulatorViewProps {
  records: DataRecord[];
}

export const CashBufferSimulatorView: React.FC<CashBufferSimulatorViewProps> = ({ records }) => {
  const [selectedCategory, setSelectedCategory] = useState<FundCategory>('Liquid Fund');
  
  // Adjustable Policy Parameters
  const [conservativeQuantile, setConservativeQuantile] = useState<number>(0.95);
  const [opportunityYield, setOpportunityYield] = useState<number>(7.20); // % p.a. (e.g. 3M CP or 91D T-Bill)
  const [overnightYield, setOvernightYield] = useState<number>(6.45); // % p.a. (e.g. TREPS / Cash)
  const [distressPenaltyRate, setDistressPenaltyRate] = useState<number>(2.0); // % distress borrowing/liquidation haircut
  const [shortfallMultiplier, setShortfallMultiplier] = useState<number>(3.0); // Strictly 3x per prompt

  const params: BufferPolicyParams = {
    category: selectedCategory,
    forecastHorizon: 1,
    conservativeQuantile,
    opportunityYield,
    overnightYield,
    distressPenaltyRate,
    shortfallMultiplier,
  };

  const simResult = simulateCashBufferPolicy(records, params);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cash-Buffer Decision Engine & Cost Backtest
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Balancing idle cash yield return drag against the 3× redemption shortfall penalty
          </p>
        </div>

        {/* Category Switcher */}
        <div className="flex items-center bg-slate-200/70 p-1 rounded-lg">
          <button
            onClick={() => setSelectedCategory('Liquid Fund')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedCategory === 'Liquid Fund'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Liquid Funds
          </button>
          <button
            onClick={() => setSelectedCategory('Overnight Fund')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedCategory === 'Overnight Fund'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overnight Funds
          </button>
        </div>
      </div>

      {/* Official Cost Function Header Notice */}
      <div className="bg-slate-900 text-white p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-semibold tracking-wider text-indigo-400">
            PS03 Problem Statement Decision Cost Objective
          </div>
          <div className="text-lg font-mono font-bold mt-0.5">
            Decision Cost = (Yield Forgone on Idle Cash) + 3 × (Redemption Shortfall Penalty)
          </div>
        </div>
        <div className="text-right text-xs font-mono text-slate-300">
          <div>Evaluated over {simResult.recommended.numBacktestPeriods} historical release origins</div>
          <div className="text-emerald-400 font-bold mt-0.5">
            {simResult.isRecommendedBetter
              ? `Recommended saves ${formatINR(simResult.costSavingsCr)} (${simResult.costSavingsPct}%)`
              : 'At Parity with Baseline'}
          </div>
        </div>
      </div>

      {/* Interactive Controls Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Interactive Regulatory & Yield Assumptions</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Real-time simulation rerun</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Control 1: Quantile */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Outflow Quantile (τ)</span>
              <span className="font-mono font-bold text-indigo-600">{Math.round(conservativeQuantile * 100)}th Pct</span>
            </div>
            <input
              type="range"
              min={0.80}
              max={0.99}
              step={0.01}
              value={conservativeQuantile}
              onChange={e => setConservativeQuantile(parseFloat(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="text-[10px] text-slate-400">Conservative outflow buffer percentile</div>
          </div>

          {/* Control 2: Opportunity Yield */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Opportunity Yield (CP/T-Bill)</span>
              <span className="font-mono font-bold text-slate-900">{opportunityYield.toFixed(2)}% p.a.</span>
            </div>
            <input
              type="range"
              min={6.50}
              max={9.00}
              step={0.05}
              value={opportunityYield}
              onChange={e => setOpportunityYield(parseFloat(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="text-[10px] text-slate-400">Yield forgone by holding idle cash vs 3M CP</div>
          </div>

          {/* Control 3: Overnight Yield */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Overnight / TREPS Cash Yield</span>
              <span className="font-mono font-bold text-slate-900">{overnightYield.toFixed(2)}% p.a.</span>
            </div>
            <input
              type="range"
              min={5.50}
              max={7.50}
              step={0.05}
              value={overnightYield}
              onChange={e => setOvernightYield(parseFloat(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="text-[10px] text-slate-400">Yield earned on buffer in TREPS window</div>
          </div>

          {/* Control 4: Distress Shortfall Penalty */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Shortfall Distress Rate</span>
              <span className="font-mono font-bold text-rose-600">{distressPenaltyRate.toFixed(2)}%</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={5.0}
              step={0.1}
              value={distressPenaltyRate}
              onChange={e => setDistressPenaltyRate(parseFloat(e.target.value))}
              className="w-full accent-rose-600"
            />
            <div className="text-[10px] text-slate-400">Secondary liquidation discount / borrowing rate</div>
          </div>
        </div>
      </div>

      {/* Head-to-Head Policy Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Quantile Cash Buffer (Recommended) */}
        <div className="bg-white border-2 border-indigo-500 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
            <div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                Proposed Candidate Policy
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {simResult.recommended.policyName}
              </h3>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono text-indigo-600 tabular-nums">
                {formatINR(simResult.recommended.recommendedBufferCr)}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                {simResult.recommended.bufferPctOfAUM}% of AUM
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono tabular-nums">
            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <div className="text-slate-400 text-[10px] uppercase font-sans">Simulated Shortfalls</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {simResult.recommended.simulatedShortfallCount} episodes
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Total: {formatINR(simResult.recommended.totalShortfallCr)}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <div className="text-slate-400 text-[10px] uppercase font-sans">Idle Cash Return Drag</div>
              <div className="text-lg font-bold text-amber-600 mt-0.5">
                {formatINR(simResult.recommended.idleCashReturnDragCr)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Annual spread: {(opportunityYield - overnightYield).toFixed(2)}%
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <div className="text-slate-400 text-[10px] uppercase font-sans">Base Shortfall Penalty</div>
              <div className="text-lg font-bold text-rose-600 mt-0.5">
                {formatINR(simResult.recommended.shortfallPenaltyCr)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Weighted @ {distressPenaltyRate}%
              </div>
            </div>

            <div className="p-3 bg-indigo-50/60 rounded border border-indigo-200">
              <div className="text-indigo-900 text-[10px] uppercase font-sans font-bold">
                Total Decision Cost (Formula)
              </div>
              <div className="text-lg font-bold text-indigo-700 mt-0.5">
                {formatINR(simResult.recommended.totalDecisionCostCr)}
              </div>
              <div className="text-[10px] text-indigo-600 mt-0.5">
                Drag + 3 × Shortfall
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Naive Baseline */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
                Problem Statement Baseline
              </span>
              <h3 className="text-base font-bold text-slate-700 mt-1">
                {simResult.naiveBaseline.policyName}
              </h3>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono text-slate-700 tabular-nums">
                {formatINR(simResult.naiveBaseline.recommendedBufferCr)}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                {simResult.naiveBaseline.bufferPctOfAUM}% of AUM
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono tabular-nums">
            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <div className="text-slate-400 text-[10px] uppercase font-sans">Simulated Shortfalls</div>
              <div className="text-lg font-bold text-rose-600 mt-0.5">
                {simResult.naiveBaseline.simulatedShortfallCount} episodes
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Total: {formatINR(simResult.naiveBaseline.totalShortfallCr)}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <div className="text-slate-400 text-[10px] uppercase font-sans">Idle Cash Return Drag</div>
              <div className="text-lg font-bold text-amber-600 mt-0.5">
                {formatINR(simResult.naiveBaseline.idleCashReturnDragCr)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Annual spread: {(opportunityYield - overnightYield).toFixed(2)}%
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <div className="text-slate-400 text-[10px] uppercase font-sans">Base Shortfall Penalty</div>
              <div className="text-lg font-bold text-rose-600 mt-0.5">
                {formatINR(simResult.naiveBaseline.shortfallPenaltyCr)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Weighted @ {distressPenaltyRate}%
              </div>
            </div>

            <div className="p-3 bg-slate-100 rounded border border-slate-200">
              <div className="text-slate-700 text-[10px] uppercase font-sans font-bold">
                Total Decision Cost (Formula)
              </div>
              <div className="text-lg font-bold text-slate-800 mt-0.5">
                {formatINR(simResult.naiveBaseline.totalDecisionCostCr)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Drag + 3 × Shortfall
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sensitivity Curve Chart */}
      <SensitivityCurveChart
        data={simResult.sensitivityCurve}
        currentRecommendedPct={simResult.recommended.bufferPctOfAUM}
        baselinePct={simResult.naiveBaseline.bufferPctOfAUM}
      />

      {/* Cost Arithmetic & Calculation Proof Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">
          Decision Cost Formulation & Unit Standards
        </h3>
        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
          {simResult.methodologyNotes.map((note, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="font-mono text-indigo-600 font-semibold">{idx + 1}.</span>
              <span>{note}</span>
            </div>
          ))}
        </div>
        <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-500 mt-2 font-mono">
          Units: Net flows & Buffers in ₹ Crores. Yields in % p.a. converted to monthly via (30/365). Shortfall penalty multiplied by 3.0 to reflect institutional risk aversion under SEBI liquidity mandates.
        </div>
      </div>
    </div>
  );
};
