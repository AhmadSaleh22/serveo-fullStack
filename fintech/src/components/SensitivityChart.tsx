import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, Info, MousePointer2 } from 'lucide-react';
import { sensitivityData } from '../data/mockData';
import { useApp } from '../context/AppContext';
import type { ChartFilter } from '../types/financial';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload) return null;

  return (
    <div className="theme-bg-secondary border theme-border rounded-lg p-3 shadow-xl">
      <p className="text-sm font-medium theme-text-primary mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="theme-text-secondary">{entry.name}:</span>
          </span>
          <span className="font-medium theme-text-primary tabular-nums">
            ${entry.value.toLocaleString()}M
          </span>
        </div>
      ))}
    </div>
  );
}

export function SensitivityChart() {
  const { t } = useTranslation();
  const { theme, setGridFilter } = useApp();
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  // Handle chart click to filter grid
  const handleChartClick = (data: unknown) => {
    const chartData = data as { activeLabel?: string | number };
    if (chartData?.activeLabel) {
      const filter: ChartFilter = {
        type: 'year',
        value: String(chartData.activeLabel),
        source: 'chart-click',
      };
      setGridFilter(filter);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="theme-bg-tertiary rounded-xl border theme-border overflow-hidden transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b theme-border theme-bg-secondary">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold theme-text-primary">{t('sensitivity.title')}</h3>
            <p className="text-xs theme-text-muted">{t('sensitivity.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs theme-text-muted">
            <MousePointer2 className="w-3 h-3" />
            {t('sensitivity.clickToFilter')}
          </span>
          <button
            type="button"
            className="p-2 theme-text-secondary theme-bg-hover rounded-lg transition-colors"
            title={t('sensitivity.learnMore')}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={sensitivityData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              onClick={handleChartClick}
              style={{ cursor: 'pointer' }}
            >
              <defs>
                <linearGradient id="colorBull" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBear" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: textColor, fontSize: 12 }}
                axisLine={{ stroke: gridColor }}
                tickLine={{ stroke: gridColor }}
              />
              <YAxis
                tick={{ fill: textColor, fontSize: 12 }}
                axisLine={{ stroke: gridColor }}
                tickLine={{ stroke: gridColor }}
                tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(1)}B` : `${value}M`}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '1rem' }}
                formatter={(value) => (
                  <span className="text-sm theme-text-secondary">{value}</span>
                )}
              />
              <Area
                type="monotone"
                dataKey="bull"
                name={t('sensitivity.bullCase')}
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBull)"
              />
              <Area
                type="monotone"
                dataKey="base"
                name={t('sensitivity.baseCase')}
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBase)"
              />
              <Area
                type="monotone"
                dataKey="bear"
                name={t('sensitivity.bearCase')}
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBear)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t theme-border theme-bg-secondary">
        <div className="flex items-center justify-between text-xs">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 rounded" />
              <span className="theme-text-muted">{t('sensitivity.bullGrowth')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-500 rounded" />
              <span className="theme-text-muted">{t('sensitivity.baseGrowth')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-red-500 rounded" />
              <span className="theme-text-muted">{t('sensitivity.bearGrowth')}</span>
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
