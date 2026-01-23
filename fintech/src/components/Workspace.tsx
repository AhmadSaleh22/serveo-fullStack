import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Table2, LineChart, Presentation, Command } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FinancialDataGrid } from './FinancialDataGrid';
import { SensitivityChart } from './SensitivityChart';
import { PPTPreview } from './PPTPreview';

export function Workspace() {
  const { t } = useTranslation();
  const { activeTab, setActiveTab, openCommandPalette, deepDiveData } = useApp();

  const tabs = [
    { id: 'grid' as const, label: t('workspace.tabs.dataGrid'), icon: Table2 },
    { id: 'chart' as const, label: t('workspace.tabs.charts'), icon: LineChart },
    { id: 'ppt' as const, label: t('workspace.tabs.presentation'), icon: Presentation },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tab Bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b theme-border theme-bg-secondary">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const hasNotification = tab.id === 'grid' && deepDiveData;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? 'text-blue-500 bg-blue-500/10'
                    : 'theme-text-secondary hover:theme-text-primary hover:theme-bg-hover'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {hasNotification && (
                  <span className="absolute top-1 end-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={openCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium theme-text-muted
            theme-bg-tertiary border theme-border hover:theme-bg-hover rounded-lg transition-colors"
        >
          <Command className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('workspace.commands')}</span>
          <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] theme-bg-secondary rounded border theme-border">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'grid' && (
            <motion.div
              key="grid"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto p-4 sm:p-6 space-y-4"
            >
              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: t('stats.revenue'), value: '$1.44B', change: '+20%', positive: true },
                  { label: t('stats.ebitda'), value: '$432M', change: '+20%', positive: true },
                  { label: t('stats.netIncome'), value: '$259M', change: '+20%', positive: true },
                  { label: t('stats.eps'), value: '$2.59', change: '+20%', positive: true },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="theme-bg-tertiary rounded-lg border theme-border p-3 shadow-sm"
                  >
                    <p className="text-xs theme-text-muted mb-0.5">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold theme-text-primary font-mono tabular-nums">
                        {stat.value}
                      </span>
                      <span
                        className={`text-xs font-medium font-mono ${
                          stat.positive ? 'text-emerald-500' : 'text-red-500'
                        }`}
                      >
                        {stat.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <FinancialDataGrid />
            </motion.div>
          )}

          {activeTab === 'chart' && (
            <motion.div
              key="chart"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto p-4 sm:p-6 space-y-4"
            >
              <SensitivityChart />

              {/* Additional chart placeholder */}
              <div className="theme-bg-tertiary rounded-xl border theme-border p-6 shadow-sm">
                <h3 className="text-sm font-semibold theme-text-primary mb-4">
                  {t('workspace.revenueBreakdown')}
                </h3>
                <div className="h-64 flex items-center justify-center border-2 border-dashed theme-border rounded-lg">
                  <p className="text-sm theme-text-muted">{t('workspace.pieChartPlaceholder')}</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ppt' && (
            <motion.div
              key="ppt"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <PPTPreview />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
