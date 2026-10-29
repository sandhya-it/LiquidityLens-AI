import React from 'react';
import { BookOpen, ShieldCheck, Scale, Cpu, Calendar, AlertOctagon } from 'lucide-react';

export const MethodologyView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Methodology, Mathematical Architecture & Regulatory Context
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Comprehensive technical specifications for Zeckathon PS03: Financial Forecasting & Cash Buffer Intelligence
        </p>
      </div>

      {/* Section 1: Executive Summary & Objective */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
          <BookOpen className="w-4 h-4" />
          <span>1. Problem Statement & Scope (PS03)</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Indian Liquid and Overnight Mutual Funds experience severe liquidity drains during corporate advance-tax deadlines (15 March, 15 June, 15 September, 15 December), quarter-ends, and fiscal year-ends (March). Maintaining excessive idle cash generates an unrecoverable yield drag that diminishes investor NAV returns. Conversely, retaining insufficient liquidity creates distress liquidation risk, borrowing penalties, or regulatory breach under SEBI circulars.
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong>LiquidityLens AI</strong> provides an institutional-grade decision science engine that forecasts monthly net flows for the subsequent 3 months, quantifies empirical prediction bounds, extracts macroeconomic drivers, and solves for the optimal cash buffer that minimizes the total decision cost.
        </p>
      </div>

      {/* Section 2: Mathematical Formulations */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
          <Cpu className="w-4 h-4" />
          <span>2. Forecasting Engine & Algorithm Implementations</span>
        </div>

        <div className="space-y-3 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
            <h4 className="font-semibold text-slate-900">A. Seasonal Naive Baseline</h4>
            <p className="font-mono text-slate-600 text-[11px]">
              y&#770;&#8348;&#8330;&#8345; = y&#8348;&#8330;&#8345;&#8331;&#8321;&#8322;
            </p>
            <p className="text-slate-500 text-[11px]">
              Assumes the net flow at horizon h matches the observed net flow from the identical calendar month one year prior. Serves as the mandatory benchmark required by PS03.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
            <h4 className="font-semibold text-slate-900">B. Classical ETS / SARIMAX Engine</h4>
            <p className="font-mono text-slate-600 text-[11px]">
              l&#8348; = &alpha;(y&#8348; - s&#8348;&#8331;&#8344;) + (1 - &alpha;)(l&#8348;&#8331;&#8321; + b&#8348;&#8331;&#8321;) <br />
              b&#8348; = &beta;(l&#8348; - l&#8348;&#8331;&#8321;) + (1 - &beta;)b&#8348;&#8331;&#8321; <br />
              y&#770;&#8348;&#8330;&#8345; = l&#8348; + h&phi;&#7500;b&#8348; + s&#8348;&#8330;&#8345;&#8331;&#8344; + &sum; &gamma;&#7522; X&#7522;,&#8348;&#8330;&#8345;
            </p>
            <p className="text-slate-500 text-[11px]">
              Combines Holt-Winters exponential smoothing with seasonal calendar indices and damped trend parameter &phi; = 0.85, augmented with dummy exogenous variables for advance tax dates and fiscal year-end March shocks.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
            <h4 className="font-semibold text-slate-900">C. Machine Learning Regressor</h4>
            <p className="font-mono text-slate-600 text-[11px]">
              X = [L&#8321;, L&#8322;, L&#8323;, L&#8321;&#8322;, MA&#8323;, TaxFlag, QtrFlag, FYFlag, NetLAF, Spread(CP - Repo), NiftyReturn] <br />
              min_w &sum; (y&#7522; - w&#84 host; X&#7522;)&#178; + &lambda; ||w||&#178;
            </p>
            <p className="text-slate-500 text-[11px]">
              Multivariate regularized regression engine with L2 penalty, utilizing recursive multi-step forecasting to prevent future data leakage while projecting multi-period horizons.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Prediction Intervals & Pinball Loss */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
          <Scale className="w-4 h-4" />
          <span>3. Uncertainty Calibration & Pinball Quantile Loss</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Prediction intervals (80% and 95%) are calibrated using held-out empirical residual quantiles from sequential backtest origins. The bounds widen across forecast horizons by the standard diffusion term:
        </p>
        <div className="p-3 bg-slate-50 rounded border border-slate-200 font-mono text-xs text-slate-800">
          Interval_h = y&#770;&#8348;&#8330;&#8345; &plusmn; q_&tau; &times; &radic;h
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Quantile accuracy is monitored via the <strong>Pinball Loss Function</strong>:
        </p>
        <div className="p-3 bg-slate-50 rounded border border-slate-200 font-mono text-xs text-slate-800">
          L_&tau;(y, y&#770;) = max(&tau;(y - y&#770;), (1 - &tau;)(y&#770; - y))
        </div>
        <p className="text-xs text-slate-500 text-[11px]">
          Evaluated across &tau; &isin; &#123;0.10, 0.20, 0.50, 0.80, 0.90, 0.95&#125;. At &tau; = 0.95, under-forecasting redemptions incurs a 19&times; higher penalty weight than over-forecasting, ensuring the selected model protects against liquidity distress.
        </p>
      </div>

      {/* Section 4: Cash Buffer Cost Function */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>4. Decision Cost Function & Units Specification</span>
        </div>
        <div className="p-3.5 bg-slate-900 text-white rounded font-mono text-xs">
          Decision Cost = (Yield Forgone on Idle Cash) + 3 &times; (Redemption Shortfall Penalty)
        </div>
        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <div>
            <strong>1. Units:</strong> All fund flows, AUM, buffers, and shortfalls are denominated in <strong>₹ Crores</strong>. Yields and penalty spreads are entered as annual percentages (% p.a.) and converted to monthly compounding via $(30 / 365)$.
          </div>
          <div>
            <strong>2. Idle Cash Return Drag:</strong>
            <div className="font-mono text-slate-800 bg-slate-50 p-2 rounded mt-1 text-[11px]">
              Idle Drag (₹ Cr) = max(0, Buffer - Actual Outflow) &times; (Opportunity Yield - Overnight Yield) &times; (30 / 365)
            </div>
          </div>
          <div>
            <strong>3. Redemption Shortfall Penalty:</strong>
            <div className="font-mono text-slate-800 bg-slate-50 p-2 rounded mt-1 text-[11px]">
              Shortfall Penalty (₹ Cr) = max(0, Actual Outflow - Buffer) &times; Distress Penalty Rate
            </div>
          </div>
          <div>
            <strong>4. The 3× Multiplier:</strong> Strictly mandated by the PS03 problem statement to reflect institutional solvency risk, secondary distress liquidation discounts, and regulatory compliance under SEBI liquidity mandates.
          </div>
        </div>
      </div>

      {/* Section 5: Statutory Disclaimer */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 space-y-1">
        <div className="font-semibold flex items-center gap-1.5">
          <AlertOctagon className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Decision Support & Regulatory Disclaimer</span>
        </div>
        <p className="leading-relaxed text-amber-900 text-[11px]">
          LiquidityLens AI is designed exclusively as an institutional analytical decision-support system for mutual fund investment teams, liquidity risk committees, and asset liability managers. Forecasts, prediction intervals, and buffer recommendations are model-based statistical estimates and do not constitute guaranteed financial returns, fiduciary advice, or formal regulatory representations under SEBI/AMFI regulations.
        </p>
      </div>
    </div>
  );
};
