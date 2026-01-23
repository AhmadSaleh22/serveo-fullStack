import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  User,
  RefreshCw,
  FileDown,
  FunctionSquare,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { AuditEntry, AuditActionType } from '../types/financial';

interface CellHistoryPopoverProps {
  rowId: string;
  year: string;
  currentValue: number | null;
  position: { x: number; y: number };
  onClose: () => void;
}

const actionConfig: Record<
  AuditActionType,
  { icon: React.ElementType; label: string; color: string; bgColor: string }
> = {
  ai_generated: {
    icon: Sparkles,
    label: 'AI Generated',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  user_override: {
    icon: User,
    label: 'User Override',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  system_recalculated: {
    icon: RefreshCw,
    label: 'System Recalculated',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  imported: {
    icon: FileDown,
    label: 'Imported',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  formula_updated: {
    icon: FunctionSquare,
    label: 'Formula Updated',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
};

function formatValue(value: number | null): string {
  if (value === null) return '—';
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}B`;
  }
  return `$${value.toFixed(0)}M`;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function TimelineEntry({ entry, isLast }: { entry: AuditEntry; isLast: boolean }) {
  const config = actionConfig[entry.action];
  const Icon = config.icon;

  return (
    <div className="relative flex gap-3">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute start-4 top-8 bottom-0 w-px bg-gradient-to-b from-slate-600 to-transparent" />
      )}

      {/* Icon */}
      <div
        className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}
      >
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
          <span className="text-[10px] theme-text-muted flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTimestamp(entry.timestamp)}
          </span>
        </div>

        {/* Value Change */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-mono theme-text-muted">
            {formatValue(entry.previousValue)}
          </span>
          <ChevronRight className="w-3 h-3 theme-text-muted" />
          <span className="text-sm font-mono font-medium theme-text-primary">
            {formatValue(entry.newValue)}
          </span>
        </div>

        {/* User/Source Info */}
        {(entry.userName || entry.source) && (
          <p className="text-[10px] theme-text-muted mt-1">
            {entry.userName && <span>by {entry.userName}</span>}
            {entry.source && <span> • {entry.source}</span>}
          </p>
        )}

        {/* Note */}
        {entry.note && (
          <p className="text-xs theme-text-secondary mt-1 italic">"{entry.note}"</p>
        )}
      </div>
    </div>
  );
}

export function CellHistoryPopover({
  rowId,
  year,
  currentValue,
  position,
  onClose,
}: CellHistoryPopoverProps) {
  const { getAuditHistory } = useApp();
  const history = getAuditHistory(rowId, year);

  // Generate sample history if none exists
  const displayHistory: AuditEntry[] =
    history.length > 0
      ? history
      : [
          {
            id: 'sample-1',
            rowId,
            year,
            action: 'ai_generated',
            previousValue: null,
            newValue: currentValue ? currentValue * 0.9 : 1000,
            timestamp: new Date(Date.now() - 86400000 * 3),
            userName: 'AI Model v2.1',
            source: 'Historical Trend Analysis',
          },
          {
            id: 'sample-2',
            rowId,
            year,
            action: 'user_override',
            previousValue: currentValue ? currentValue * 0.9 : 1000,
            newValue: currentValue ? currentValue * 0.95 : 1050,
            timestamp: new Date(Date.now() - 86400000),
            userName: 'Sarah Chen',
            note: 'Adjusted for Q4 seasonality',
          },
          {
            id: 'sample-3',
            rowId,
            year,
            action: 'system_recalculated',
            previousValue: currentValue ? currentValue * 0.95 : 1050,
            newValue: currentValue,
            timestamp: new Date(Date.now() - 3600000),
            source: 'Dependency Update',
          },
        ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.15 }}
        className="fixed z-50 w-80"
        style={{
          left: Math.min(position.x, window.innerWidth - 340),
          top: Math.min(position.y + 10, window.innerHeight - 400),
        }}
      >
        <div className="theme-bg-secondary border theme-border rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b theme-border theme-bg-tertiary">
            <div>
              <h3 className="text-sm font-semibold theme-text-primary">Cell History</h3>
              <p className="text-xs theme-text-muted">
                {rowId} • {year}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg theme-bg-hover theme-text-secondary hover:theme-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current Value */}
          <div className="px-4 py-3 border-b theme-border">
            <div className="flex items-center justify-between">
              <span className="text-xs theme-text-muted">Current Value</span>
              <span className="text-lg font-bold font-mono theme-text-primary">
                {formatValue(currentValue)}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="px-4 py-3 max-h-64 overflow-y-auto">
            <p className="text-[10px] theme-text-muted uppercase tracking-wider mb-3">
              Change History
            </p>
            <div className="space-y-0">
              {displayHistory
                .slice()
                .reverse()
                .map((entry, index) => (
                  <TimelineEntry
                    key={entry.id}
                    entry={entry}
                    isLast={index === displayHistory.length - 1}
                  />
                ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t theme-border theme-bg-tertiary">
            <p className="text-[10px] theme-text-muted text-center">
              {displayHistory.length} change{displayHistory.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
