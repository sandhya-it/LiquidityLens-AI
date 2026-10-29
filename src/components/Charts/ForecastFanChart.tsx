import React, { useState } from 'react';
import { ForecastPoint, DataRecord } from '../../types';
import { formatINR, formatMonthYear } from '../../utils/indianFormat';

interface ForecastFanChartProps {
  historical: DataRecord[];
  forecasts: ForecastPoint[];
  title?: string;
  categoryName: string;
}

export const ForecastFanChart: React.FC<ForecastFanChartProps> = ({
  historical,
  forecasts,
  title,
  categoryName,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Take the last 12 historical records to display with the 3 forecast periods
  const recentHistory = historical.slice(-12);
  
  // Combine historical and forecast into unified points
  type ChartPoint = {
    month: string;
    actual: number | null;
    point: number | null;
    lower80: number | null;
    upper80: number | null;
    lower95: number | null;
    upper95: number | null;
    isForecast: boolean;
  };

  const points: ChartPoint[] = recentHistory.map(r => ({
    month: r.date,
    actual: r.net_flow,
    point: null,
    lower80: null,
    upper80: null,
    lower95: null,
    upper95: null,
    isForecast: false,
  }));

  // Bridge the last actual point to the first forecast point
  const lastActual = recentHistory[recentHistory.length - 1];

  forecasts.forEach(f => {
    points.push({
      month: f.forecastMonth,
      actual: null,
      point: f.pointForecast,
      lower80: f.lower80,
      upper80: f.upper80,
      lower95: f.lower95,
      upper95: f.upper95,
      isForecast: true,
    });
  });

  // Calculate scales
  let minVal = -90000;
  let maxVal = 100000;

  points.forEach(p => {
    if (p.actual !== null) {
      minVal = Math.min(minVal, p.actual);
      maxVal = Math.max(maxVal, p.actual);
    }
    if (p.lower95 !== null) minVal = Math.min(minVal, p.lower95);
    if (p.upper95 !== null) maxVal = Math.max(maxVal, p.upper95);
  });

  // Add 10% padding
  const valRange = maxVal - minVal;
  const chartMin = minVal - valRange * 0.1;
  const chartMax = maxVal + valRange * 0.1;

  const width = 860;
  const height = 340;
  const padLeft = 80;
  const padRight = 40;
  const padTop = 30;
  const padBottom = 40;

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const getX = (idx: number) => padLeft + (idx / (points.length - 1)) * innerW;
  const getY = (val: number) => padTop + innerH - ((val - chartMin) / (chartMax - chartMin)) * innerH;

  const zeroY = getY(0);

  // SVG paths for historical line
  let histPath = '';
  recentHistory.forEach((_, idx) => {
    const x = getX(idx);
    const y = getY(points[idx].actual!);
    if (idx === 0) histPath += `M ${x} ${y}`;
    else histPath += ` L ${x} ${y}`;
  });

  // SVG paths for 95% fan band
  const forecastStartIndex = recentHistory.length - 1;
  let fan95Path = '';
  let fan80Path = '';
  let pointPath = '';

  // Start bands from last actual point
  const bridgeX = getX(forecastStartIndex);
  const bridgeY = getY(lastActual.net_flow);

  // 95% polygon
  let top95 = `M ${bridgeX} ${bridgeY}`;
  let btm95 = `L ${bridgeX} ${bridgeY}`;

  forecasts.forEach((f, idx) => {
    const x = getX(forecastStartIndex + 1 + idx);
    const yUpper = getY(f.upper95);
    const yLower = getY(f.lower95);
    top95 += ` L ${x} ${yUpper}`;
    btm95 = ` L ${x} ${yLower}` + btm95;
  });
  fan95Path = top95 + btm95 + ' Z';

  // 80% polygon
  let top80 = `M ${bridgeX} ${bridgeY}`;
  let btm80 = `L ${bridgeX} ${bridgeY}`;

  forecasts.forEach((f, idx) => {
    const x = getX(forecastStartIndex + 1 + idx);
    const yUpper = getY(f.upper80);
    const yLower = getY(f.lower80);
    top80 += ` L ${x} ${yUpper}`;
    btm80 = ` L ${x} ${yLower}` + btm80;
  });
  fan80Path = top80 + btm80 + ' Z';

  // Point forecast line
  pointPath = `M ${bridgeX} ${bridgeY}`;
  forecasts.forEach((f, idx) => {
    const x = getX(forecastStartIndex + 1 + idx);
    const yPoint = getY(f.pointForecast);
    pointPath += ` L ${x} ${yPoint}`;
  });

  // Y axis ticks
  const yTicks = [chartMin, chartMin + (chartMax - chartMin) * 0.25, 0, chartMin + (chartMax - chartMin) * 0.75, chartMax];

  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            {title || `${categoryName} — Monthly Net Flow Forecast & Prediction Bands`}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Next 3 Months (T+1, T+2, T+3) with 80% and 95% empirically calibrated confidence bands (in ₹ Crores)
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-800 inline-block" />
            <span className="text-slate-600">Observed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-indigo-600 inline-block" />
            <span className="text-slate-600 font-medium">Point Forecast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-indigo-200/60 rounded-xs inline-block" />
            <span className="text-slate-600">80% Interval</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-indigo-100/40 border border-indigo-200 rounded-xs inline-block" />
            <span className="text-slate-600">95% Interval</span>
          </div>
        </div>
      </div>

      <div className="relative mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[700px] select-none">
          {/* Horizontal Grid lines */}
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

          {/* Zero baseline indicator */}
          <line
            x1={padLeft}
            y1={zeroY}
            x2={width - padRight}
            y2={zeroY}
            stroke="#64748b"
            strokeWidth={1}
            strokeDasharray="4,4"
          />

          {/* 95% Confidence Fan Area */}
          <path d={fan95Path} fill="#e0e7ff" fillOpacity="0.45" />

          {/* 80% Confidence Fan Area */}
          <path d={fan80Path} fill="#c7d2fe" fillOpacity="0.65" />

          {/* Point Forecast Dashed Line */}
          <path d={pointPath} fill="none" stroke="#4f46e5" strokeWidth={2.5} strokeDasharray="5,4" />

          {/* Historical Solid Line */}
          <path d={histPath} fill="none" stroke="#0f172a" strokeWidth={2.2} />

          {/* Historical Data Dots */}
          {recentHistory.map((r, idx) => {
            const x = getX(idx);
            const y = getY(r.net_flow);
            const isTax = r.advance_tax_flag === 1;
            return (
              <g key={idx}>
                <circle
                  cx={x}
                  cy={y}
                  r={isTax ? 4.5 : 3.5}
                  fill={isTax ? '#ef4444' : '#0f172a'}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  className="cursor-pointer transition-transform hover:scale-125"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}

          {/* Forecast Points Dots */}
          {forecasts.map((f, idx) => {
            const x = getX(forecastStartIndex + 1 + idx);
            const y = getY(f.pointForecast);
            return (
              <g key={`fc-${idx}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={5}
                  fill="#4f46e5"
                  stroke="#ffffff"
                  strokeWidth={2}
                  className="cursor-pointer transition-transform hover:scale-125"
                  onMouseEnter={() => setHoveredIndex(forecastStartIndex + 1 + idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}

          {/* X Axis Labels */}
          {points.map((p, idx) => {
            const x = getX(idx);
            const isFc = p.isForecast;
            return (
              <g key={`x-${idx}`}>
                <line x1={x} y1={height - padBottom} x2={x} y2={height - padBottom + 5} stroke="#cbd5e1" />
                <text
                  x={x}
                  y={height - padBottom + 18}
                  textAnchor="middle"
                  className={`text-[10px] font-mono tabular-nums ${isFc ? 'font-semibold fill-indigo-600' : 'fill-slate-500'}`}
                >
                  {formatMonthYear(p.month).split(' ')[0]}
                </text>
                <text
                  x={x}
                  y={height - padBottom + 29}
                  textAnchor="middle"
                  className={`text-[9px] font-mono tabular-nums ${isFc ? 'font-semibold fill-indigo-600' : 'fill-slate-400'}`}
                >
                  {p.month.split('-')[0].slice(2)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute z-10 bg-slate-900/95 text-white text-xs rounded-md shadow-lg p-2.5 pointer-events-none transition-all"
            style={{
              left: Math.min(width - 200, Math.max(80, getX(hoveredIndex) - 90)),
              top: Math.max(10, getY(points[hoveredIndex].point ?? points[hoveredIndex].actual ?? 0) - 95),
            }}
          >
            <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1">
              {formatMonthYear(points[hoveredIndex].month)} {points[hoveredIndex].isForecast ? '(Forecast)' : '(Actual)'}
            </div>
            {points[hoveredIndex].actual !== null ? (
              <div className="font-mono tabular-nums text-emerald-400">
                Net Flow: {formatINR(points[hoveredIndex].actual!)}
              </div>
            ) : (
              <div className="space-y-0.5 font-mono text-[11px] tabular-nums">
                <div className="text-indigo-300 font-semibold">
                  Point: {formatINR(points[hoveredIndex].point!)}
                </div>
                <div className="text-slate-300 text-[10px]">
                  80% Band: [{formatINR(points[hoveredIndex].lower80!)} to {formatINR(points[hoveredIndex].upper80!)}]
                </div>
                <div className="text-slate-400 text-[10px]">
                  95% Band: [{formatINR(points[hoveredIndex].lower95!)} to {formatINR(points[hoveredIndex].upper95!)}]
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>* Red markers represent historical Advance-Tax / Fiscal Year-End release dates</span>
        <span>Empirical uncertainty bounds widen by $\sqrt&#123;h&#125;$ over multi-step horizons</span>
      </div>
    </div>
  );
};
