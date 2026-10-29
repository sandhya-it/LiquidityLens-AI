import React, { useState } from 'react';
import { BacktestOriginResult } from '../../types';
import { formatINR, formatMonthYear } from '../../utils/indianFormat';

interface BacktestChartProps {
  backtest: BacktestOriginResult[];
  categoryName: string;
}

export const BacktestChart: React.FC<BacktestChartProps> = ({ backtest, categoryName }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!backtest || backtest.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 border border-slate-200 rounded-lg">
        No backtest history available.
      </div>
    );
  }

  const width = 860;
  const height = 300;
  const padLeft = 75;
  const padRight = 35;
  const padTop = 25;
  const padBottom = 35;

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  let minVal = -90000;
  let maxVal = 100000;
  backtest.forEach(b => {
    minVal = Math.min(minVal, b.actualFlow, b.predictedFlow, b.lower95);
    maxVal = Math.max(maxVal, b.actualFlow, b.predictedFlow, b.upper95);
  });

  const valRange = maxVal - minVal;
  const chartMin = minVal - valRange * 0.08;
  const chartMax = maxVal + valRange * 0.08;

  const getX = (idx: number) => padLeft + (idx / Math.max(1, backtest.length - 1)) * innerW;
  const getY = (val: number) => padTop + innerH - ((val - chartMin) / (chartMax - chartMin)) * innerH;

  const zeroY = getY(0);

  // Path for Actuals
  let actualPath = '';
  backtest.forEach((b, idx) => {
    const x = getX(idx);
    const y = getY(b.actualFlow);
    if (idx === 0) actualPath += `M ${x} ${y}`;
    else actualPath += ` L ${x} ${y}`;
  });

  // Path for Predicted
  let predPath = '';
  backtest.forEach((b, idx) => {
    const x = getX(idx);
    const y = getY(b.predictedFlow);
    if (idx === 0) predPath += `M ${x} ${y}`;
    else predPath += ` L ${x} ${y}`;
  });

  const yTicks = [chartMin, chartMin + (chartMax - chartMin) * 0.25, 0, chartMin + (chartMax - chartMin) * 0.75, chartMax];

  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            {categoryName} — Rolling-Origin Walk-Forward Backtest (Last {backtest.length} Releases)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict temporal cross-validation: model updated sequentially at each release date with zero future lookahead
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-900 inline-block" />
            <span className="text-slate-700 font-medium">Actual Released Flow</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-indigo-600 inline-block" />
            <span className="text-indigo-600 font-medium">Out-of-Sample Forecast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-slate-600">Inside 95% Band</span>
          </div>
        </div>
      </div>

      <div className="relative mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[700px] select-none">
          {/* Grid lines */}
          {yTicks.map((val, i) => {
            const y = getY(val);
            const isZero = Math.abs(val) < 100;
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={isZero ? '#94a3b8' : '#f1f5f9'}
                  strokeWidth={isZero ? 1.5 : 1}
                  strokeDasharray={isZero ? undefined : '3,3'}
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] font-mono fill-slate-400 tabular-nums"
                >
                  {Math.round(val / 1000)}k Cr
                </text>
              </g>
            );
          })}

          {/* Zero line */}
          <line
            x1={padLeft}
            y1={zeroY}
            x2={width - padRight}
            y2={zeroY}
            stroke="#64748b"
            strokeWidth={1}
            strokeDasharray="4,4"
          />

          {/* Prediction line */}
          <path d={predPath} fill="none" stroke="#4f46e5" strokeWidth={2.2} strokeDasharray="4,4" />

          {/* Actual line */}
          <path d={actualPath} fill="none" stroke="#0f172a" strokeWidth={2.2} />

          {/* Data Points */}
          {backtest.map((b, idx) => {
            const x = getX(idx);
            const yAct = getY(b.actualFlow);
            const yPred = getY(b.predictedFlow);

            return (
              <g key={idx}>
                {/* Vertical error link */}
                <line
                  x1={x}
                  y1={yAct}
                  x2={x}
                  y2={yPred}
                  stroke={b.covered95 ? '#10b981' : '#f43f5e'}
                  strokeWidth={1}
                  strokeDasharray="2,2"
                />

                {/* Actual circle */}
                <circle
                  cx={x}
                  cy={yAct}
                  r={4}
                  fill="#0f172a"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />

                {/* Predicted square */}
                <rect
                  x={x - 3}
                  y={yPred - 3}
                  width={6}
                  height={6}
                  fill={b.covered95 ? '#4f46e5' : '#e11d48'}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              </g>
            );
          })}

          {/* X axis ticks */}
          {backtest.map((b, idx) => {
            // Show every 2nd or 3rd month label for legibility
            if (idx % 2 !== 0 && idx !== backtest.length - 1) return null;
            const x = getX(idx);
            return (
              <g key={`x-${idx}`}>
                <text
                  x={x}
                  y={height - padBottom + 16}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-slate-500 tabular-nums"
                >
                  {formatMonthYear(b.targetMonth).split(' ')[0]}
                </text>
                <text
                  x={x}
                  y={height - padBottom + 27}
                  textAnchor="middle"
                  className="text-[9px] font-mono fill-slate-400 tabular-nums"
                >
                  '{b.targetMonth.slice(2, 4)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover details tooltip */}
        {hoveredIdx !== null && backtest[hoveredIdx] && (
          <div
            className="absolute z-10 bg-slate-900/95 text-white text-xs rounded-md shadow-lg p-2.5 pointer-events-none transition-all font-mono tabular-nums"
            style={{
              left: Math.min(width - 220, Math.max(60, getX(hoveredIdx) - 90)),
              top: Math.max(10, getY(backtest[hoveredIdx].actualFlow) - 95),
            }}
          >
            <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1">
              Origin: {formatMonthYear(backtest[hoveredIdx].originDate)} → Target: {formatMonthYear(backtest[hoveredIdx].targetMonth)}
            </div>
            <div>Actual Flow: {formatINR(backtest[hoveredIdx].actualFlow)}</div>
            <div className="text-indigo-300">Predicted: {formatINR(backtest[hoveredIdx].predictedFlow)}</div>
            <div className={backtest[hoveredIdx].error >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              Residual Error: {formatINR(backtest[hoveredIdx].error)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Coverage: {backtest[hoveredIdx].covered95 ? 'Inside 95% Band' : 'Outside 95% Band'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
