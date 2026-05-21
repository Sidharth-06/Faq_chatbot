'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ChartDataset {
  label: string;
  data: number[];
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'donut';
  title?: string;
  labels: string[];
  datasets: ChartDataset[];
}

interface CustomChartProps {
  data: ChartData;
}

// Harmonious neo-brutalist color palette
const ACCENT_COLORS = [
  '#A82C24', // Terracotta Red (Primary)
  '#dde6f8', // Soft Blue-Gray (Secondary)
  '#F5C542', // Amber Gold (Tertiary)
  '#10B981', // Emerald Green
  '#7A1A1A', // Dark Crimson
  '#3B82F6', // Royal Blue
  '#EC4899', // Pink Accent
];

export default function CustomChart({ data }: CustomChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
    return (
      <div className="p-4 border border-black bg-zinc-50 text-xs text-zinc-500 font-mono">
        Error: Invalid chart data provided.
      </div>
    );
  }

  const { type, title, labels, datasets } = data;
  const primaryDataset = datasets[0];
  const chartValues = primaryDataset.data;
  const maxValue = Math.max(...chartValues, 1);

  // Tooltip tracking handler
  const handleMouseMove = (e: React.MouseEvent, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
    
    if (parentRect) {
      setTooltipPos({
        x: rect.left - parentRect.left + rect.width / 2,
        y: rect.top - parentRect.top - 38
      });
    }
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  // ── 1. BAR CHART RENDERER ──────────────────────────────────────────────────
  const renderBarChart = () => {
    return (
      <div className="relative flex flex-col w-full min-h-[220px] justify-end pt-8">
        {/* Tooltip Overlay */}
        <AnimatePresence>
          {hoveredIndex !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 4 }}
              transition={{ duration: 0.15 }}
              style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
              className="absolute -translate-x-1/2 pointer-events-none z-20 bg-zinc-950 text-white border border-black text-[10px] font-black uppercase tracking-wider px-2 py-1 shadow-[1.5px_1.5px_0_0_#000]"
            >
              <div className="font-mono text-center">
                <span className="text-zinc-400 mr-1">{labels[hoveredIndex]}:</span>
                <span className="text-brand-red font-extrabold">${chartValues[hoveredIndex]}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Data Bars */}
        <div className="flex w-full items-end gap-3 px-2 h-[160px] border-b border-black">
          {chartValues.map((val, idx) => {
            const pct = (val / maxValue) * 100;
            return (
              <div
                key={idx}
                className="flex-1 flex flex-col justify-end items-center group h-full relative cursor-pointer"
                onMouseMove={(e) => handleMouseMove(e, idx)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Visual Bar Card */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${pct}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full border-t border-x border-black bg-brand-red relative group-hover:bg-brand-red-dark transition-colors select-none shadow-[1px_-1px_0_0_#000] hover:shadow-[1.5px_-1.5px_0_0_#000] hover:translate-y-[-1px] transition-all duration-200"
                  style={{
                    backgroundColor: ACCENT_COLORS[idx % ACCENT_COLORS.length]
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* X Axis Labels */}
        <div className="flex w-full justify-between items-center gap-3 px-2 mt-2 select-none">
          {labels.map((lbl, idx) => (
            <div key={idx} className="flex-1 text-center text-[9px] font-black tracking-wider text-zinc-600 uppercase font-sans truncate">
              {lbl}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── 2. LINE CHART RENDERER ─────────────────────────────────────────────────
  const renderLineChart = () => {
    const width = 500;
    const height = 200;
    const padding = { top: 25, right: 30, bottom: 25, left: 40 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const points = chartValues.map((val, idx) => {
      const x = padding.left + (idx / (labels.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - (val / maxValue) * chartHeight;
      return { x, y, value: val, label: labels[idx], index: idx };
    });

    // Construct SVG Path
    let linePath = '';
    let areaPath = '';

    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
      areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;
    }

    return (
      <div className="relative flex flex-col w-full select-none pt-4">
        {/* Tooltip Overlay */}
        <AnimatePresence>
          {hoveredIndex !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 4 }}
              transition={{ duration: 0.15 }}
              style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
              className="absolute -translate-x-1/2 pointer-events-none z-20 bg-zinc-950 text-white border border-black text-[10px] font-black uppercase tracking-wider px-2 py-1 shadow-[1.5px_1.5px_0_0_#000]"
            >
              <div className="font-mono text-center">
                <span className="text-zinc-400 mr-1">{labels[hoveredIndex]}:</span>
                <span className="text-brand-red font-extrabold">${chartValues[hoveredIndex]}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Horizontal Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding.top + chartHeight * ratio;
            const gridVal = Math.round(maxValue * (1 - ratio));
            return (
              <g key={idx} className="opacity-30">
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#a1a1aa"
                  strokeWidth={0.75}
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-zinc-500 font-mono text-[8px] font-bold"
                >
                  ${gridVal}
                </text>
              </g>
            );
          })}

          {/* Area under the line */}
          <motion.path
            d={areaPath}
            fill="url(#lineGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.12 }}
            transition={{ duration: 1 }}
          />

          {/* Core SVG Line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="#A82C24"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />

          {/* Bottom baseline */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={width - padding.right}
            y2={padding.top + chartHeight}
            stroke="#000"
            strokeWidth={1.5}
          />

          {/* Data points */}
          {points.map((pt, idx) => (
            <g key={idx}>
              {/* Invisible larger circle for easier hover interaction */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={10}
                fill="transparent"
                className="cursor-pointer"
                onMouseMove={(e) => handleMouseMove(e, idx)}
                onMouseLeave={handleMouseLeave}
              />
              
              {/* Visual Node circle */}
              <motion.circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === idx ? 5 : 3.5}
                fill={hoveredIndex === idx ? '#A82C24' : '#fff'}
                stroke="#000"
                strokeWidth={1.5}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.08, duration: 0.3 }}
                className="pointer-events-none"
              />
            </g>
          ))}

          {/* Bottom Labels */}
          {points.map((pt, idx) => (
            <text
              key={idx}
              x={pt.x}
              y={height - 5}
              textAnchor="middle"
              className="fill-zinc-500 font-sans text-[8px] font-black uppercase tracking-wider"
            >
              {pt.label}
            </text>
          ))}

          {/* Gradient Definition */}
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A82C24" />
              <stop offset="100%" stopColor="#A82C24" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  // ── 3. DONUT / PIE CHART RENDERER ──────────────────────────────────────────
  const renderDonutChart = () => {
    const total = chartValues.reduce((a, b) => a + b, 0);
    const radius = 35;
    const strokeWidth = 14;
    const circ = 2 * Math.PI * radius; // 219.91
    
    let accumulatedAngle = 0;

    const segments = chartValues.map((val, idx) => {
      const percentage = total > 0 ? val / total : 0;
      const strokeLength = percentage * circ;
      const strokeOffset = circ - strokeLength + accumulatedAngle;
      accumulatedAngle -= strokeLength;

      return {
        value: val,
        label: labels[idx],
        pct: (percentage * 100).toFixed(1),
        strokeLength,
        strokeOffset,
        color: ACCENT_COLORS[idx % ACCENT_COLORS.length]
      };
    });

    return (
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4 select-none">
        {/* SVG Ring Donut */}
        <div className="relative w-[130px] h-[130px]">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 overflow-visible">
            {segments.map((seg, idx) => (
              <motion.circle
                key={idx}
                cx={50}
                cy={50}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${seg.strokeLength} ${circ - seg.strokeLength}`}
                strokeDashoffset={seg.strokeOffset}
                strokeLinecap="butt"
                className="cursor-pointer transition-all duration-200"
                style={{ originX: '50px', originY: '50px' }}
                whileHover={{ strokeWidth: strokeWidth + 2 }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={handleMouseLeave}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: 'easeOut', delay: idx * 0.1 }}
              />
            ))}
          </svg>

          {/* Absolute centered percentage badge */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[8px] font-black uppercase text-zinc-400 tracking-wider">
              {hoveredIndex !== null ? segments[hoveredIndex].label : 'Total'}
            </span>
            <span className="text-xs font-black text-zinc-950 font-mono mt-0.5">
              {hoveredIndex !== null 
                ? `${segments[hoveredIndex].pct}%`
                : `$${total}`
              }
            </span>
          </div>
        </div>

        {/* Legend sidebar */}
        <div className="flex flex-col gap-2 justify-center max-w-[200px] w-full">
          {segments.map((seg, idx) => (
            <div 
              key={idx}
              className={`flex items-center justify-between gap-4 p-1.5 border border-transparent transition-all duration-200 rounded-none ${
                hoveredIndex === idx ? 'bg-zinc-50 border-black shadow-[1px_1px_0_0_#000] scale-[1.02]' : ''
              }`}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 shrink-0 border border-black" style={{ backgroundColor: seg.color }} />
                <span className="text-[10px] font-black tracking-wide text-zinc-800 uppercase truncate max-w-[90px]">
                  {seg.label}
                </span>
              </div>
              <span className="text-[10px] font-black font-mono text-zinc-950">
                ${seg.value} ({seg.pct}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'pie':
      case 'donut':
        return renderDonutChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <div className="my-4 bg-[#faf8f5] border border-black p-4 rounded-none shadow-[2px_2px_0_0_#000] hover:shadow-[3.5px_3.5px_0_0_#000] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] transition-all duration-300 w-full overflow-hidden">
      {/* Title */}
      {title && (
        <h4 className="text-[10px] font-black text-zinc-950 tracking-wider uppercase border-b border-black pb-2 select-none">
          📈 {title}
        </h4>
      )}

      {/* Render selected chart */}
      {renderChart()}

      {/* Dataset Label Footer */}
      {type !== 'pie' && type !== 'donut' && (
        <div className="mt-3 flex items-center justify-center gap-1.5 select-none border-t border-zinc-100 pt-2.5">
          <span 
            className="w-2.5 h-2.5 border border-black" 
            style={{ backgroundColor: ACCENT_COLORS[0] }} 
          />
          <span className="text-[8px] font-extrabold uppercase tracking-widest text-zinc-400">
            {primaryDataset.label}
          </span>
        </div>
      )}
    </div>
  );
}
