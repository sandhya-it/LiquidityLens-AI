import React, { useState } from 'react';
import { DataRecord, FundCategory } from '../types';
import { runRollingOriginEvaluation } from '../services/evaluationEngine';
import { BacktestChart } from './Charts/BacktestChart';
import { formatINR, formatPercent, formatMonthYear } from '../utils/indianFormat';
import { ShieldCheck, AlertCircle, Award, CheckCircle2, History } from 'lucide-react';

interface ModelBenchmarkingViewProps {
  records: DataRecord[];
}

export const ModelBenchmarkingView: React.FC<ModelBenchmarkingViewProps> = ({ records }) => {
  const [selectedCategory, setSelectedCategory] = useState<FundCategory>('Liquid Fund');
  const [showFullBacktestLog, setShowFullBacktestLog] = useState<boolean>(false);

  const evalResult = runRollingOriginEvaluation(records, selectedCategory, 24);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Model Benchmarking & Walk-Forward Cross-Validation
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Rolling-origin walk-forward evaluation across up to 24 monthly releases with zero temporal data leakage
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

      {/* Coverage Status Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {evalResult.isComplete24Origins ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <div>
            <span className="font-semibold text-slate-900">
              Backtest Evaluation Origins: {evalResult.numOrigins} / 24 Periods Evaluated
            </span>
            <div className="text-slate-500 text-[11px] mt-0.5">
              {evalResult.isComplete24Origins
                ? 'Full 24-period rolling walk-forward benchmark requirement satisfied.'
                : evalResult.notes.join(' ')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">Selected Model:</span>
          <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-mono">
            {evalResult.selectedModel}
          </span>
        </div>
      </div>

      {/* Actual vs Predicted Rolling Backtest Chart */}
      <BacktestChart
        backtest={evalResult.historicalBacktest}
        categoryName={selectedCategory}
      />

      {/* Model-by-Model Metrics Benchmark Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="font-semibold text-slate-800">
            Out-of-Sample Performance Matrix ({evalResult.numOrigins} Origins)
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            Pinball losses in ₹ Cr · Lower loss = superior quantile calibration
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="py-2.5 px-3">Model Name</th>
                <th className="py-2.5 px-3 text-right">MAPE (%)*</th>
                <th className="py-2.5 px-3 text-right">WAPE (%)</th>
                <th className="py-2.5 px-3 text-right">MAE (₹ Cr)</th>
                <th className="py-2.5 px-3 text-right">Pinball τ=0.10</th>
                <th className="py-2.5 px-3 text-right">Pinball τ=0.50</th>
                <th className="py-2.5 px-3 text-right">Pinball τ=0.95</th>
                <th className="py-2.5 px-3 text-right">80% Coverage</th>
                <th className="py-2.5 px-3 text-right">95% Coverage</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-[11px]">
              {evalResult.benchmarkScores.map(score => (
                <tr key={score.modelName} className={score.selected ? 'bg-indigo-50/40 font-semibold' : 'hover:bg-slate-50'}>
                  <td className="py-3 px-3 font-sans text-slate-900">
                    <div className="font-medium flex items-center gap-1.5">
                      {score.selected && <Award className="w-3.5 h-3.5 text-indigo-600" />}
                      <span>{score.modelName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700">{score.mape}%</td>
                  <td className="py-3 px-3 text-right text-slate-900 font-bold">{score.wape}%</td>
                  <td className="py-3 px-3 text-right text-slate-800">₹ {score.mae.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-right text-slate-600">{score.pinball10.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-right text-slate-600">{score.pinball50.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-right text-indigo-600 font-medium">{score.pinball95.toLocaleString('en-IN')}</td>
                  <td className={`py-3 px-3 text-right ${score.coverage80 >= 75 ? 'text-emerald-700 font-bold' : 'text-amber-600'}`}>
                    {score.coverage80}%
                  </td>
                  <td className={`py-3 px-3 text-right ${score.coverage95 >= 90 ? 'text-emerald-700 font-bold' : 'text-amber-600'}`}>
                    {score.coverage95}%
                  </td>
                  <td className="py-3 px-3 text-center font-sans">
                    {score.selected ? (
                      <span className="text-[10px] text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded font-bold">
                        Selected
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Baseline</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zero Denominator & Pinball Loss Explanation Note per Section 8 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
          <div className="font-semibold text-slate-800">
            * Zero/Near-Zero Flow Handling for MAPE:
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Mutual fund category net flows frequently cross zero when subscriptions match redemptions. Standard MAPE produces infinite division. LiquidityLens implements a guarded epsilon floor (epsilon = ₹ 1,000 Cr) and pairs it with Weighted Absolute Percentage Error (WAPE = sum |e_t| / sum |y_t|) for unbiased comparative evaluation.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
          <div className="font-semibold text-slate-800">
            Pinball Quantile Loss Interpretation:
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            For cash buffer sizing, asymmetric tail risk is paramount. Pinball loss at $\tau = 0.95$ penalizes under-forecasting redemptions 19 times more severely than over-forecasting, ensuring the selected model protects against liquidity distress selling.
          </p>
        </div>
      </div>

      {/* Expandable Historical Backtest Log Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFullBacktestLog(!showFullBacktestLog)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
          >
            <History className="w-4 h-4" />
            <span>{showFullBacktestLog ? 'Hide' : 'Inspect'} Complete Backtest Origin Audit Log ({evalResult.historicalBacktest.length} Releases)</span>
          </button>
        </div>

        {showFullBacktestLog && (
          <div className="mt-3 overflow-x-auto max-h-96 border border-slate-100 rounded">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium sticky top-0">
                <tr>
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Origin Date</th>
                  <th className="py-2 px-3">Target Month</th>
                  <th className="py-2 px-3 text-right">Actual Released (₹ Cr)</th>
                  <th className="py-2 px-3 text-right">Out-of-Sample Pred (₹ Cr)</th>
                  <th className="py-2 px-3 text-right">Residual Error (₹ Cr)</th>
                  <th className="py-2 px-3 text-center">In 80% Band</th>
                  <th className="py-2 px-3 text-center">In 95% Band</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-[11px]">
                {evalResult.historicalBacktest.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-400">{row.originIndex}</td>
                    <td className="py-2 px-3 text-slate-700">{row.originDate}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{row.targetMonth}</td>
                    <td className="py-2 px-3 text-right">{formatINR(row.actualFlow)}</td>
                    <td className="py-2 px-3 text-right text-indigo-600 font-medium">{formatINR(row.predictedFlow)}</td>
                    <td className={`py-2 px-3 text-right font-medium ${row.error >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatINR(row.error)}
                    </td>
                    <td className="py-2 px-3 text-center font-sans">
                      {row.covered80 ? (
                        <span className="text-emerald-700 font-semibold text-[10px]">YES</span>
                      ) : (
                        <span className="text-rose-600 text-[10px]">NO</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center font-sans">
                      {row.covered95 ? (
                        <span className="text-emerald-700 font-semibold text-[10px]">YES</span>
                      ) : (
                        <span className="text-rose-600 text-[10px]">NO</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
