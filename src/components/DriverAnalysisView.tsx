import React, { useState } from 'react';
import { DataRecord, FundCategory, DriverInsight } from '../types';
import { analyzeMacroDrivers } from '../services/driverAnalysis';
import { AlertTriangle, TrendingDown, TrendingUp, Info } from 'lucide-react';

interface DriverAnalysisViewProps {
  records: DataRecord[];
}

export const DriverAnalysisView: React.FC<DriverAnalysisViewProps> = ({ records }) => {
  const [selectedCategory, setSelectedCategory] = useState<FundCategory>('Liquid Fund');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Tax & Calendar' | 'Monetary Policy' | 'Market & Yields'>('All');

  const drivers = analyzeMacroDrivers(records, selectedCategory);
  const filteredDrivers = selectedFilter === 'All'
    ? drivers
    : drivers.filter(d => d.category === selectedFilter);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Macro & Seasonal Driver Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Empirical identification and out-of-sample validation of redemption catalysts
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

      {/* Domain Insights Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1.5">
          <span className="text-xs font-semibold text-rose-700 uppercase tracking-wide">
            Advance Tax & Quarter-End Pull
          </span>
          <p className="text-xs text-slate-600 leading-relaxed">
            Corporate treasuries withdraw vast liquidity on 15th Mar, Jun, Sep, and Dec to meet statutory advance-tax liabilities. March fiscal year-end creates the largest annual drawdown (-₹50k+ Cr) due to bank balance sheet dressing.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1.5">
          <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
            RBI Banking System Liquidity
          </span>
          <p className="text-xs text-slate-600 leading-relaxed">
            Systemic liquidity (Net LAF surplus/deficit) drives overnight money market rates. Deficits force banks into overnight funding windows, reducing corporate bank deposits and spilling into Overnight Fund redemptions.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1.5">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
            CP & T-Bill Spreads
          </span>
          <p className="text-xs text-slate-600 leading-relaxed">
            When 3-month Commercial Paper yields widen significantly over the Repo Rate (spread &gt; 80 bps), institutional yield-seeking behavior pulls cash into Liquid Funds to capture debt carry.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-medium">
        {(['All', 'Tax & Calendar', 'Monetary Policy', 'Market & Yields'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setSelectedFilter(tab)}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              selectedFilter === tab
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Driver Explanatory Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Driver Ranking Matrix for {selectedCategory}</span>
          <span className="font-mono">Tested over {records.filter(r => r.fund_category === selectedCategory).length} monthly periods</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="py-2.5 px-3">Driver Name & Category</th>
                <th className="py-2.5 px-3">Direction of Association</th>
                <th className="py-2.5 px-3 text-right">Pearson r</th>
                <th className="py-2.5 px-3 text-right">Spearman Rank</th>
                <th className="py-2.5 px-3 text-right">Importance Score</th>
                <th className="py-2.5 px-3">Validation & Out-of-Sample Impact</th>
                <th className="py-2.5 px-3">Documented Limitations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {filteredDrivers.map(d => (
                <tr key={d.key} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{d.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{d.category}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 font-medium ${
                      d.direction.includes('Outflow')
                        ? 'text-rose-600'
                        : d.direction.includes('Inflow')
                        ? 'text-emerald-700'
                        : 'text-slate-600'
                    }`}>
                      {d.direction.includes('Outflow') && <TrendingDown className="w-3.5 h-3.5" />}
                      {d.direction.includes('Inflow') && <TrendingUp className="w-3.5 h-3.5" />}
                      {d.direction}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                    {d.correlation > 0 ? `+${d.correlation.toFixed(2)}` : d.correlation.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                    {d.spearmanCorr > 0 ? `+${d.spearmanCorr.toFixed(2)}` : d.spearmanCorr.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${d.importanceScore}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {d.importanceScore}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-800">{d.outOfSampleDelta}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{d.validationMethod}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-500 max-w-xs leading-normal">
                    {d.limitations}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory Statistical Warning per Section 7 */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-950 space-y-1">
        <div className="font-semibold flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Statutory Causation & Attribution Limitation</span>
        </div>
        <p className="leading-relaxed text-amber-900 text-[11px]">
          Correlation and permutation importance do not prove economic causation. Observed statistical linkages between advance tax dates, banking liquidity, and fund flows reflect structural corporate cash management routines in the Indian financial system rather than invariant causal laws. Models must not extrapolate outside observed historical regime bounds.
        </p>
      </div>
    </div>
  );
};
