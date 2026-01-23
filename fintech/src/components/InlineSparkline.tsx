import { motion } from 'framer-motion';
import type { SparklineData } from '../types/financial';

interface InlineSparklineProps {
  data: SparklineData;
  width?: number;
  height?: number;
  showLabels?: boolean;
  animate?: boolean;
}

export function InlineSparkline({
  data,
  width = 120,
  height = 32,
  showLabels = false,
  animate = true,
}: InlineSparklineProps) {
  const { values, labels, type, color, trend } = data;

  const trendColor =
    color ||
    (trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#3b82f6');

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Normalize values to fit in chart
  const normalizedValues = values.map((v) => ((v - min) / range) * chartHeight);

  if (type === 'bar') {
    const barWidth = chartWidth / values.length - 2;

    return (
      <div
        className="inline-flex items-end gap-0.5 theme-bg-tertiary rounded px-1 py-0.5"
        style={{ height }}
      >
        {values.map((_, index) => {
          const barHeight = normalizedValues[index] || 2;
          const isLast = index === values.length - 1;

          return (
            <motion.div
              key={index}
              initial={animate ? { height: 0 } : false}
              animate={{ height: barHeight }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="rounded-t"
              style={{
                width: barWidth,
                backgroundColor: isLast ? trendColor : `${trendColor}60`,
              }}
            />
          );
        })}
      </div>
    );
  }

  // Line/Area chart
  const points = values.map((_, index) => {
    const x = padding + (index / (values.length - 1)) * chartWidth;
    const y = padding + chartHeight - normalizedValues[index];
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${
    height - padding
  } L ${padding} ${height - padding} Z`;

  return (
    <div className="inline-block theme-bg-tertiary rounded overflow-hidden">
      <svg width={width} height={height} className="block">
        <defs>
          <linearGradient id={`gradient-${data.values.join('-')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={trendColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        {type === 'area' && (
          <motion.path
            d={areaPath}
            fill={`url(#gradient-${data.values.join('-')})`}
            initial={animate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}

        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={trendColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animate ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {/* End dot */}
        <motion.circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={2.5}
          fill={trendColor}
          initial={animate ? { scale: 0 } : false}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: 0.6 }}
        />
      </svg>

      {/* Labels */}
      {showLabels && labels && (
        <div className="flex justify-between px-1 pb-0.5">
          <span className="text-[8px] theme-text-muted">{labels[0]}</span>
          <span className="text-[8px] theme-text-muted">{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  );
}

// Mini bar chart for inline metrics
interface InlineMiniBarProps {
  value: number;
  maxValue?: number;
  label?: string;
  color?: string;
}

export function InlineMiniBar({
  value,
  maxValue = 100,
  label,
  color = '#3b82f6',
}: InlineMiniBarProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <div className="inline-flex items-center gap-2 theme-bg-tertiary rounded px-2 py-1">
      {label && <span className="text-xs theme-text-muted">{label}</span>}
      <div className="w-16 h-2 rounded-full bg-slate-700 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-mono font-medium theme-text-primary">
        {value.toFixed(0)}%
      </span>
    </div>
  );
}

// Trend indicator with arrow
interface TrendIndicatorProps {
  value: number;
  label?: string;
  format?: 'percentage' | 'currency' | 'number';
}

export function TrendIndicator({ value, label, format = 'percentage' }: TrendIndicatorProps) {
  const isPositive = value >= 0;
  const color = isPositive ? 'text-emerald-500' : 'text-red-500';
  const bgColor = isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10';

  let formattedValue: string;
  switch (format) {
    case 'currency':
      formattedValue = `$${Math.abs(value).toFixed(1)}B`;
      break;
    case 'percentage':
      formattedValue = `${Math.abs(value).toFixed(1)}%`;
      break;
    default:
      formattedValue = Math.abs(value).toFixed(1);
  }

  return (
    <span className={`inline-flex items-center gap-1 ${bgColor} ${color} px-2 py-0.5 rounded text-xs font-medium`}>
      {label && <span className="theme-text-muted">{label}:</span>}
      <span>{isPositive ? '↑' : '↓'}</span>
      <span className="font-mono">{formattedValue}</span>
    </span>
  );
}
