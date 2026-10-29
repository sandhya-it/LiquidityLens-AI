import React, { useState } from 'react';
import { formatINR } from '../../utils/indianFormat';

interface SensitivityCurveChartProps {
  data: { bufferPct: number; totalCostCr: number; idleCostCr: number; penaltyCostCr: number }[];
  currentRecommendedPct: number;
  baselinePct: number;
}

export const SensitivityCurveChart: React.FC<SensitivityCurveChartProps> = ({
  data,
  currentRecommendedPct,
  baselinePct,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const width = 860;
  const height = 300;
  const padLeft = 75;
  const padRight = 35;
  const padTop = 25;
  const padBottom = 35;

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  let maxCost = 0;
  data.forEach(d => {
    maxCost = Math.max(maxCost, d.totalCostCr);
  });
  maxCost = maxCost * 1.05;

  const getX = (pct: number) => {
    const minPct = data[0].bufferPct;
    const maxPct = data[data.length - 1].bufferPct;
    return padLeft + ((pct - minPct) / (maxPct - minPct)) * innerW;
  };

  const getY = (cost: number) => padTop + innerH - (cost / maxCost) * innerH;

  // Find minimum cost point (optimal)
  let minCost = Infinity;
  let optimalPct = data[0].bufferPct;
  data.forEach(d => {
    if (d.totalCostCr < minCost) {
      minCost = d.totalCostCr;
      optimalPct = d.bufferPct;
    }
  });

  // Total cost path
  let totalPath = '';
  let idlePath = '';
  let penaltyPath = '';

  data.forEach((d, idx) => {
    const x = getX(d.bufferPct);
    const yTotal = getY(d.totalCostCr);
    const yIdle = getY(d.idleCostCr);
    const yPenalty = getY(d.penaltyCostCr * 3); // 3x multiplier displayed

    if (idx === 0) {
      totalPath += `M ${x} ${yTotal}`;
      idlePath += `M ${x} ${yIdle}`;
      penaltyPath += `M ${x} ${yPenalty}`;
    } else {
      totalPath += ` L ${x} ${yTotal}`;
      idlePath += ` L ${x} ${yIdle}`;
      penaltyPath += ` L ${x} ${yPenalty}`;
    }
  });

  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Cash Buffer Cost Optimization Curve
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Trade-off curve: Total Cost = Idle Cash Return Drag + 3 × Redemption Shortfall Penalty
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-indigo-600 inline-block" />
            <span className="text-slate-700 font-medium">Total Decision Cost</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-amber-500 inline-block" />
            <span className="text-slate-600">Idle Cash Drag</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-rose-500 inline-block" />
            <span className="text-slate-600">3× Shortfall Penalty</span>
          </div>
        </div>
      </div>

      <div className="relative mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[700px] select-none">
          {/* Horizontal grid */}
          {[0, maxCost * 0.25, maxCost * 0.5, maxCost * 0.75, maxCost].map((c, i) => {
            const y = getY(c);
            return (
              <g key={i}>
                <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#f1f5f9" strokeDasharray="3,3" />
                <text x={padLeft - 10} y={y + 4} textAnchor="end" className="text-[11px] font-mono fill-slate-400 tabular-nums">
                  ₹ {Math.round(c)} Cr
                </text>
              </g>
            );
          })}

          {/* Idle Drag Path */}
          <path d={idlePath} fill="none" stroke="#f59e0b" strokeWidth={1.8} strokeDasharray="4,4" />

          {/* Shortfall Penalty Path */}
          <path d={penaltyPath} fill="none" stroke="#f43f5e" strokeWidth={1.8} strokeDasharray="4,4" />

          {/* Total Decision Cost Path */}
          <path d={totalPath} fill="none" stroke="#4f46e5" strokeWidth={2.8} />

          {/* Optimal Buffer Marker */}
          <line
            x1={getX(optimalPct)}
            y1={padTop}
            x2={getX(optimalPct)}
            y2={height - padBottom}
            stroke="#10b981"
            strokeWidth={1.8}
            strokeDasharray="3,3"
          />
          <text
            x={getX(optimalPct)}
            y={padTop + 14}
            textAnchor="middle"
            className="text-[10px] font-mono font-semibold fill-emerald-700"
          >
            Optimal: {optimalPct}% AUM
          </text>

          {/* Current Recommended Buffer Marker */}
          <circle
            cx={getX(currentRecommendedPct)}
            cy={getY(data.find(d => d.bufferPct === Math.round(currentRecommendedPct))?.totalCostCr ?? minCost)}
            r={6}
            fill="#4f46e5"
            stroke="#ffffff"
            strokeWidth={2}
          />

          {/* Baseline Buffer Marker */}
          <circle
            cx={getX(baselinePct)}
            cy={getY(data.find(d => d.bufferPct === Math.round(baselinePct))?.totalCostCr ?? maxCost * 0.8)}
            r={5}
            fill="#94a3b8"
            stroke="#ffffff"
            strokeWidth={1.5}
          />

          {/* Data interactive dots */}
          {data.map((d, idx) => {
            const x = getX(d.bufferPct);
            const y = getY(d.totalCostCr);
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r={4}
                fill="#4f46e5"
                opacity={0}
                className="cursor-pointer hover:opacity-100"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}

          {/* X axis labels */}
          {data.map((d, idx) => {
            if (d.bufferPct % 3 !== 0) return null;
            const x = getX(d.bufferPct);
            return (
              <g key={`x-${idx}`}>
                <text x={x} y={height - padBottom + 16} textAnchor="middle" className="text-[11px] font-mono fill-slate-500 tabular-nums">
                  {d.bufferPct}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover details */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div
            className="absolute z-10 bg-slate-900/95 text-white text-xs rounded-md shadow-lg p-2.5 pointer-events-none transition-all font-mono tabular-nums"
            style={{
              left: Math.min(width - 200, Math.max(60, getX(data[hoveredIdx].bufferPct) - 90)),
              top: Math.max(10, getY(data[hoveredIdx].totalCostCr) - 95),
            }}
          >
            <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1">
              Buffer: {data[hoveredIdx].bufferPct}% of AUM
            </div>
            <div className="text-indigo-300 font-semibold">Total Cost: {formatINR(data[hoveredIdx].totalCostCr)}</div>
            <div className="text-amber-300">Idle Cash Drag: {formatINR(data[hoveredIdx].idleCostCr)}</div>
            <div className="text-rose-300">3× Shortfall Penalty: {formatINR(data[hoveredIdx].penaltyCostCr * 3)}</div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>* Green line indicates empirical cost-minimizing buffer point balancing drag vs shortfall</span>
        <span>Asymmetric 3× penalty strictly prioritizes redemption solvency over yield extraction</span>
      </div>
    </div>
  );
};
