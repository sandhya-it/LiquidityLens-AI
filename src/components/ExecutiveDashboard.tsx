import React, { useState } from 'react';
import { DataRecord, FundCategory } from '../types';
import { generateCategoryForecast } from '../services/forecastingEngine';
import { simulateCashBufferPolicy } from '../services/bufferPolicyEngine';
import { runRollingOriginEvaluation } from '../services/evaluationEngine';
import { analyzeMacroDrivers } from '../services/driverAnalysis';
import { formatINR, formatCroresWithSign, formatPercent, formatMonthYear } from '../utils/indianFormat';
import { ForecastFanChart } from './Charts/ForecastFanChart';
import { AlertTriangle, TrendingDown, TrendingUp, ShieldAlert, CheckCircle2, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { NavPage } from './Navbar';

interface ExecutiveDashboardProps {
  records: DataRecord[];
  onNavigate: (page: NavPage) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  records,
  onNavigate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FundCategory>('Liquid Fund');
  const [selectedHorizon, setSelectedHorizon] = useState<number>(1); // 1, 2, 3

  // Computations for both categories
  const liquidForecast = generateCategoryForecast(records, 'Liquid Fund');
  const overnightForecast = generateCategoryForecast(records, 'Overnight Fund');

  const currentForecast = selectedCategory === 'Liquid Fund' ? liquidForecast : overnightForecast;
  const targetForecastPoint = currentForecast.forecasts.find(f => f.horizon === selectedHorizon) || currentForecast.forecasts[0];

  // Cash buffer policy computation
  const bufferResult = simulateCashBufferPolicy(records, {
    category: selectedCategory,
    forecastHorizon: selectedHorizon,
    conservativeQuantile: 0.95,
    opportunityYield: 7.20,
    overnightYield: 6.45,
    distressPenaltyRate: 2.0,
    shortfallMultiplier: 3.0,
  });

  // Benchmarking scores
  const evalResult = runRollingOriginEvaluation(records, selectedCategory, 24);
  const bestScore = evalResult.benchmarkScores.find(s => s.selected) || evalResult.benchmarkScores[0];

  // Top validated macro drivers
  const drivers = analyzeMacroDrivers(records, selectedCategory).slice(0, 4);

  // Latest observation info
  const categoryRecords = records.filter(r => r.fund_category === selectedCategory);
  const latestRecord = categoryRecords[categoryRecords.length - 1];

  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Fund Manager Executive Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            1st-of-the-month predictive liquidity intelligence & cash-buffer allocation cockpit
          </p>
        </div>

        {/* Global Category & Horizon Filters */}
        <div className="flex items-center gap-3">
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

          <div className="flex items-center bg-slate-200/70 p-1 rounded-lg">
            {[1, 2, 3].map(h => (
              <button
                key={h}
                onClick={() => setSelectedHorizon(h)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  selectedHorizon === h
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                T+{h}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Freshness & Quality Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 px-4 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Latest Release: <strong className="font-mono text-slate-900">{formatMonthYear(latestRecord?.date || '')}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span>Category AUM: <strong className="font-mono text-slate-900">{formatINR(latestRecord?.AUM || 0)}</strong></span>
          <span className="text-slate-300">|</span>
          <span>Active Model: <strong className="text-indigo-600 font-semibold">{currentForecast.selectedModel}</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-slate-500">Backtest Origins: {evalResult.numOrigins} / 24</span>
          <button
            onClick={() => onNavigate('benchmarking')}
            className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-0.5"
          >
            Audit Log <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Key Metric Tiles Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Next Month Net Flow Forecast */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Forecast Net Flow ({formatMonthYear(targetForecastPoint?.forecastMonth || '')})</span>
            {targetForecastPoint?.pointForecast && targetForecastPoint.pointForecast < 0 ? (
              <TrendingDown className="w-4 h-4 text-rose-500" />
            ) : (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <div className={`text-xl font-bold font-mono tabular-nums mt-1.5 ${
            targetForecastPoint?.pointForecast && targetForecastPoint.pointForecast < 0 ? 'text-rose-600' : 'text-emerald-700'
          }`}>
            {formatCroresWithSign(targetForecastPoint?.pointForecast || 0)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-mono tabular-nums flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>80% Range:</span>
            <span className="text-slate-700 font-medium">
              [{formatINR(targetForecastPoint?.lower80 || 0, { showUnit: false })} to {formatINR(targetForecastPoint?.upper80 || 0)}]
            </span>
          </div>
        </div>

        {/* Tile 2: Recommended Cash Buffer */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Recommended Cash Buffer</span>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
              95% Tail
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-1.5">
            {formatINR(bufferResult.recommended.recommendedBufferCr)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-mono tabular-nums flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>% of Current AUM:</span>
            <span className="text-indigo-600 font-semibold">{bufferResult.recommended.bufferPctOfAUM}%</span>
          </div>
        </div>

        {/* Tile 3: Naive Baseline Comparison */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Baseline Buffer (Last Year Outflow)</span>
            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Naive</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-700 tabular-nums mt-1.5">
            {formatINR(bufferResult.naiveBaseline.recommendedBufferCr)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-mono tabular-nums flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Shortfall Episodes:</span>
            <span className={bufferResult.naiveBaseline.simulatedShortfallCount > bufferResult.recommended.simulatedShortfallCount ? 'text-rose-600 font-semibold' : 'text-slate-700'}>
              {bufferResult.naiveBaseline.simulatedShortfallCount} vs {bufferResult.recommended.simulatedShortfallCount}
            </span>
          </div>
        </div>

        {/* Tile 4: Expected Decision Cost & Savings */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Decision Cost Savings</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {bufferResult.costSavingsPct > 0 ? `-${bufferResult.costSavingsPct}%` : 'Par'}
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 tabular-nums mt-1.5">
            {bufferResult.costSavingsCr > 0 ? `+${formatINR(bufferResult.costSavingsCr)}` : formatINR(bufferResult.costSavingsCr)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-mono tabular-nums flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Formula Cost:</span>
            <span className="text-slate-700">{formatINR(bufferResult.recommended.totalDecisionCostCr)}</span>
          </div>
        </div>
      </div>

      {/* Main Visual Forecast Fan Chart */}
      <ForecastFanChart
        historical={categoryRecords}
        forecasts={currentForecast.forecasts}
        categoryName={selectedCategory}
      />

      {/* Two Column Grid: 3-Month Trajectory Table + Drivers & Risk Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: 3-Month Forward Forecast Schedule */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">3-Month Out-of-Sample Forecast Schedule</h3>
              <p className="text-xs text-slate-500 mt-0.5">Category-specific net flows with confidence limits</p>
            </div>
            <button
              onClick={() => onNavigate('forecast-explorer')}
              className="text-xs text-indigo-600 font-medium hover:underline inline-flex items-center gap-1"
            >
              Full Explorer <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="py-2">Horizon</th>
                  <th className="py-2">Month</th>
                  <th className="py-2 text-right">Point (₹ Cr)</th>
                  <th className="py-2 text-right">80% Interval</th>
                  <th className="py-2 text-right">95% Interval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-mono tabular-nums">
                {currentForecast.forecasts.map(f => (
                  <tr key={f.horizon} className="hover:bg-slate-50/60">
                    <td className="py-2.5 font-sans font-medium text-slate-700">T+{f.horizon}</td>
                    <td className="py-2.5 font-semibold text-slate-900">{formatMonthYear(f.forecastMonth)}</td>
                    <td className={`py-2.5 text-right font-bold ${f.pointForecast < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {formatCroresWithSign(f.pointForecast)}
                    </td>
                    <td className="py-2.5 text-right text-slate-600 text-[11px]">
                      [{formatINR(f.lower80, { showUnit: false })} to {formatINR(f.upper80, { showUnit: false })}]
                    </td>
                    <td className="py-2.5 text-right text-slate-400 text-[11px]">
                      [{formatINR(f.lower95, { showUnit: false })} to {formatINR(f.upper95, { showUnit: false })}]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">Model Selection Rationale:</div>
            <p className="text-[11px] leading-relaxed text-slate-600">{currentForecast.selectionReason}</p>
          </div>
        </div>

        {/* Right: Key Validated Macro Drivers */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Key Validated Liquidity Drivers</h3>
              <p className="text-xs text-slate-500 mt-0.5">Empirically ranked by predictive out-of-sample impact</p>
            </div>
            <button
              onClick={() => onNavigate('driver-analysis')}
              className="text-xs text-indigo-600 font-medium hover:underline inline-flex items-center gap-1"
            >
              All Drivers <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 mt-3">
            {drivers.map(d => (
              <div key={d.key} className="p-3 bg-slate-50/70 border border-slate-100 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">{d.name}</span>
                  <span className="text-[11px] font-mono text-indigo-600 font-medium">
                    Score: {d.importanceScore}/100
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-1">
                  <span>Correlation: <strong className="font-mono text-slate-700">{d.correlation > 0 ? `+${d.correlation}` : d.correlation}</strong></span>
                  <span>·</span>
                  <span className={d.direction.includes('Outflow') ? 'text-rose-600' : 'text-emerald-700 font-medium'}>
                    {d.direction}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal italic">
                  Impact: {d.outOfSampleDelta}
                </p>
              </div>
            ))}
          </div>

          {/* Regulatory Context Box */}
          <div className="mt-4 p-3 bg-indigo-50/50 border border-indigo-100 rounded-md text-[11px] text-indigo-900">
            <strong>SEBI Liquidity Norm Context:</strong> Mutual fund regulations mandate a minimum of 20% in liquid assets for Liquid Funds. LiquidityLens optimizes the cash/TREPS portion beyond mandatory government securities to eliminate shortfall penalties.
          </div>
        </div>
      </div>
    </div>
  );
};
