import React, { useState } from 'react';
import { DataRecord, FundCategory } from '../types';
import {
  generateCategoryForecast,
  runSeasonalNaiveForecast,
  runClassicalETSSARIMAXForecast,
  runMachineLearningRegressorForecast,
} from '../services/forecastingEngine';
import { ForecastFanChart } from './Charts/ForecastFanChart';
import { formatINR, formatCroresWithSign, formatMonthYear } from '../utils/indianFormat';
import { AlertCircle, HelpCircle, ArrowRight, ShieldCheck, Check } from 'lucide-react';

interface ForecastExplorerProps {
  records: DataRecord[];
}

export const ForecastExplorer: React.FC<ForecastExplorerProps> = ({ records }) => {
  const [selectedCategory, setSelectedCategory] = useState<FundCategory>('Liquid Fund');
  const [activeModelTab, setActiveModelTab] = useState<'selected' | 'all'>('selected');

  const catRecords = records.filter(r => r.fund_category === selectedCategory);
  const autoForecast = generateCategoryForecast(records, selectedCategory);

  const seasonalNaive = runSeasonalNaiveForecast(catRecords, 3);
  const classicalETS = runClassicalETSSARIMAXForecast(catRecords, 3);
  const mlRegressor = runMachineLearningRegressorForecast(catRecords, 3);

  const modelsList = [
    {
      name: 'Seasonal Naive Baseline',
      desc: 'Repeats flow of exact same month from previous year (lag 12)',
      result: seasonalNaive,
    },
    {
      name: 'Classical ETS/SARIMAX',
      desc: 'Exponential smoothing with seasonal indices + calendar tax adjustments',
      result: classicalETS,
    },
    {
      name: 'Machine Learning Regressor',
      desc: 'Multivariate regularized regressor using lags, banking liquidity, and spreads',
      result: mlRegressor,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            3-Month Forecast Explorer & Prediction Intervals
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Forward multi-step projections with empirically calibrated 80% and 95% confidence intervals
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

      {/* Model Selection Alert Banner */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <div className="font-semibold text-indigo-950">
            Selected Model: {autoForecast.selectedModel}
          </div>
          <div className="text-indigo-800 mt-0.5 leading-relaxed">
            {autoForecast.selectionReason}
          </div>
          {autoForecast.dataLimitations.length > 0 && (
            <div className="mt-1.5 text-amber-800 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{autoForecast.dataLimitations.join(' ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Forecast Chart */}
      <ForecastFanChart
        historical={catRecords}
        forecasts={autoForecast.forecasts}
        categoryName={selectedCategory}
      />

      {/* Forecast Output Data Cards (T+1, T+2, T+3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {autoForecast.forecasts.map(f => (
          <div key={f.horizon} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Horizon T+{f.horizon}
              </span>
              <span className="text-xs font-semibold text-slate-900">
                {formatMonthYear(f.forecastMonth)}
              </span>
            </div>

            <div>
              <div className="text-xs text-slate-400">Point Forecast</div>
              <div className={`text-2xl font-bold font-mono tabular-nums mt-0.5 ${
                f.pointForecast < 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}>
                {formatCroresWithSign(f.pointForecast)}
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded border border-slate-100 space-y-2 text-xs font-mono tabular-nums">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">80% Interval:</span>
                <span className="font-medium text-slate-800">
                  [{formatINR(f.lower80, { showUnit: false })} to {formatINR(f.upper80)}]
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">95% Interval:</span>
                <span className="text-slate-600">
                  [{formatINR(f.lower95, { showUnit: false })} to {formatINR(f.upper95)}]
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex items-center justify-between">
              <span>Model Used:</span>
              <span className="text-slate-700 font-semibold">{f.modelUsed}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Model-by-Model Side-by-Side Comparison */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Model-by-Model Comparison</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluating candidate algorithms across identical out-of-sample forecast horizons
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">3 Competing Paradigms</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {modelsList.map(m => {
            const isWinner = m.name === autoForecast.selectedModel;
            return (
              <div
                key={m.name}
                className={`p-4 rounded-lg border transition-all ${
                  isWinner ? 'bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-400' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{m.name}</h4>
                  {isWinner && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">{m.desc}</p>

                <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Out-of-Sample MAE:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹ {Math.round(m.result.outOfSampleMAE).toLocaleString('en-IN')} Cr
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">T+1 Point:</span>
                    <span className="font-mono font-medium text-slate-800">
                      {formatCroresWithSign(m.result.forecasts[0]?.pointForecast || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">T+2 Point:</span>
                    <span className="font-mono font-medium text-slate-800">
                      {formatCroresWithSign(m.result.forecasts[1]?.pointForecast || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">T+3 Point:</span>
                    <span className="font-mono font-medium text-slate-800">
                      {formatCroresWithSign(m.result.forecasts[2]?.pointForecast || 0)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Uncertainty Notice & Disclaimer */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <span>Statutory Uncertainty & Risk Notice</span>
        </div>
        <p className="leading-relaxed text-slate-500 text-[11px]">
          Prediction intervals represent statistical bounds based on empirical error distributions. They do not constitute financial guarantees of liquidity solvency or redemption fulfillment. Actual fund flows remain subject to unexpected macroeconomic shocks, corporate tax schedule modifications, or sudden RBI regulatory directives.
        </p>
      </div>
    </div>
  );
};
