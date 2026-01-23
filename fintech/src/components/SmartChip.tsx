import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import type { FinancialMetric } from '../types/financial';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SmartChipProps {
  metric: FinancialMetric;
}

export function SmartChip({ metric }: SmartChipProps) {
  const { setHighlightedRowId } = useApp();

  const handleMouseEnter = () => {
    setHighlightedRowId(metric.id);
  };

  const handleMouseLeave = () => {
    setHighlightedRowId(null);
  };

  const handleClick = () => {
    const element = document.getElementById(`row-${metric.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedRowId(metric.id);
      setTimeout(() => setHighlightedRowId(null), 2000);
    }
  };

  const isPositive = metric.change !== undefined && metric.change >= 0;
  const isNegative = metric.change !== undefined && metric.change < 0;

  return (
    <motion.button
      type="button"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md
        theme-bg-secondary border theme-border
        hover:border-blue-500/50 transition-all duration-200 cursor-pointer
        text-sm font-medium theme-text-primary
        hover:shadow-[0_0_12px_rgba(59,130,246,0.2)]"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="text-blue-500">{metric.label}:</span>
      <span className="tabular-nums font-semibold">{metric.formattedValue}</span>
      {metric.change !== undefined && (
        <span
          className={`flex items-center gap-0.5 text-xs ${
            isPositive ? 'text-emerald-500' : isNegative ? 'text-red-500' : 'theme-text-muted'
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {Math.abs(metric.change)}%
        </span>
      )}
    </motion.button>
  );
}
