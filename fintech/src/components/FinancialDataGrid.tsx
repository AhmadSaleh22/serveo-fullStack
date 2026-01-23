import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  Expand,
  Minimize2,
  Info,
  X,
  Edit3,
  Filter,
  Check,
  RotateCcw,
  GitCompare,
  History,
  Sparkles,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { financialSections, years } from '../data/mockData';
import { CellHistoryPopover } from './CellHistoryPopover';
import { ScenarioComparisonGrid } from './ScenarioComparisonGrid';
import type { FinancialRowData, FinancialSection } from '../types/financial';

// Dependency map for recalculation effects
const dependencyMap: Record<string, string[]> = {
  'total-revenue': ['gross-profit', 'gross-margin', 'ebitda', 'ebitda-margin'],
  'cogs': ['gross-profit', 'gross-margin'],
  'gross-profit': ['ebitda', 'operating-income', 'gross-margin'],
  'ebitda': ['operating-income', 'ebitda-margin'],
  'operating-income': ['pretax-income', 'operating-margin'],
  'pretax-income': ['net-income'],
  'net-income': ['net-margin', 'eps'],
};

// Formula definitions for calculated cells
const formulaMap: Record<string, { formula: string; components: string[] }> = {
  'gross-profit': {
    formula: 'Revenue - COGS',
    components: ['Total Revenue', 'Cost of Goods Sold'],
  },
  'ebitda': {
    formula: 'Gross Profit - R&D - SG&A',
    components: ['Gross Profit', 'R&D Expense', 'SG&A Expense'],
  },
  'operating-income': {
    formula: 'EBITDA - D&A',
    components: ['EBITDA', 'Depreciation & Amortization'],
  },
  'pretax-income': {
    formula: 'Operating Income + Interest + Other',
    components: ['Operating Income', 'Interest Expense', 'Other Income'],
  },
  'net-income': {
    formula: 'Pre-Tax Income - Taxes',
    components: ['Pre-Tax Income', 'Tax Expense'],
  },
  'gross-margin': {
    formula: '(Gross Profit / Revenue) × 100',
    components: ['Gross Profit', 'Total Revenue'],
  },
  'ebitda-margin': {
    formula: '(EBITDA / Revenue) × 100',
    components: ['EBITDA', 'Total Revenue'],
  },
  'operating-margin': {
    formula: '(Operating Income / Revenue) × 100',
    components: ['Operating Income', 'Total Revenue'],
  },
  'net-margin': {
    formula: '(Net Income / Revenue) × 100',
    components: ['Net Income', 'Total Revenue'],
  },
};

function formatValue(value: number | null, label: string): string {
  if (value === null) return '—';

  const isPercentage = label.includes('%') || label.includes('Margin');
  const isEps = label.includes('EPS');

  if (isPercentage) {
    return `${value.toFixed(1)}%`;
  }

  if (isEps) {
    return `$${value.toFixed(2)}`;
  }

  const isNegative = value < 0;
  const absValue = Math.abs(value);

  if (absValue >= 1000) {
    const formatted = `$${(absValue / 1000).toFixed(1)}B`;
    return isNegative ? `(${formatted})` : formatted;
  }

  const formatted = `$${absValue.toLocaleString()}M`;
  return isNegative ? `(${formatted})` : formatted;
}

function formatGrowth(value: number | null): string {
  if (value === null) return '';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(0)}%`;
}

interface FormulaTooltipProps {
  rowId: string;
  children: React.ReactNode;
}

function FormulaTooltip({ rowId, children }: FormulaTooltipProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const formula = formulaMap[rowId];

  if (!formula) {
    return <>{children}</>;
  }

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="cursor-help"
      >
        {children}
        <Info className="inline-block w-3 h-3 ms-1 opacity-40" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full mb-2 start-0 w-56"
          >
            <div className="theme-bg-secondary border theme-border rounded-lg shadow-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold theme-text-primary">{t('grid.formula')}</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-0.5 theme-text-muted hover:theme-text-primary"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <code className="block text-xs font-mono text-blue-500 bg-blue-500/10 px-2 py-1 rounded mb-2">
                {formula.formula}
              </code>
              <div className="space-y-1">
                <p className="text-xs theme-text-muted">{t('grid.components')}</p>
                {formula.components.map((comp) => (
                  <p key={comp} className="text-xs theme-text-secondary ps-2">
                    • {comp}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Editable cell component
interface EditableCellProps {
  rowId: string;
  year: string;
  value: number | null;
  label: string;
  isEditMode: boolean;
  isOverridden: boolean;
  isRecalculating: boolean;
  onSave: (value: number) => void;
  onClear: () => void;
  onRightClick: (e: React.MouseEvent) => void;
}

function EditableCell({
  value,
  label,
  isEditMode,
  isOverridden,
  isRecalculating,
  onSave,
  onClear,
  onRightClick,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const isPercentage = label.includes('%') || label.includes('Margin');
  const isNegative = value !== null && value < 0;

  const handleDoubleClick = () => {
    if (!isEditMode) return;
    setIsEditing(true);
    setEditValue(value?.toString() || '');
  };

  const handleSave = () => {
    const numValue = parseFloat(editValue);
    if (!isNaN(numValue)) {
      onSave(numValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          className="w-20 px-2 py-1 text-end text-sm font-mono theme-bg-primary border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={handleSave}
          className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
        >
          <Check className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`
        relative flex flex-col items-end cursor-${isEditMode ? 'pointer' : 'default'}
        ${isOverridden ? 'cell-overridden pe-2' : ''}
        ${isRecalculating ? 'recalc-flash' : ''}
        group/cell
      `}
      onDoubleClick={handleDoubleClick}
      onContextMenu={onRightClick}
      title={isEditMode ? 'Double-click to edit • Right-click for history' : 'Right-click for history'}
    >
      {/* History indicator on hover */}
      <div className="absolute -start-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 transition-opacity">
        <History className="w-3 h-3 theme-text-muted" />
      </div>
      <span
        className={`tabular-nums tracking-tight ${
          isPercentage
            ? 'theme-text-muted'
            : isNegative
            ? 'text-red-500'
            : 'text-emerald-600 dark:text-emerald-400'
        }`}
      >
        {formatValue(value, label)}
      </span>
      {isOverridden && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="absolute -top-1 -end-1 p-0.5 bg-amber-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          title="Revert to original"
        >
          <RotateCcw className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}

interface FinancialRowProps {
  row: FinancialRowData;
  rowIndex: number;
  onCellRightClick: (rowId: string, year: string, value: number | null, e: React.MouseEvent) => void;
}

function FinancialRow({ row, rowIndex, onCellRightClick }: FinancialRowProps) {
  const {
    highlightedRowId,
    deepDiveData,
    isEditMode,
    cellOverrides,
    setCellOverride,
    clearCellOverride,
    recalculatingCells,
    triggerRecalculation,
    gridFilter,
  } = useApp();

  const isHighlighted = highlightedRowId === row.id;
  const isDeepDiveTarget = deepDiveData?.metricId === row.id;
  const isFilteredOut = gridFilter && gridFilter.type === 'year' && !years.includes(gridFilter.value);

  const paddingStart = row.indent ? `${row.indent * 1.25}rem` : '0';
  const isZebraRow = rowIndex % 2 === 1;
  const hasFormula = formulaMap[row.id];

  const handleCellSave = useCallback((year: string, newValue: number) => {
    const originalValue = row.values[year];
    setCellOverride(row.id, year, newValue, originalValue);

    // Trigger recalculation effect on dependent cells
    const dependents = dependencyMap[row.id] || [];
    if (dependents.length > 0) {
      triggerRecalculation(dependents.map(d => `${d}-${year}`));
    }
  }, [row.id, row.values, setCellOverride, triggerRecalculation]);

  const handleCellClear = useCallback((year: string) => {
    clearCellOverride(row.id, year);
  }, [row.id, clearCellOverride]);

  const handleRightClick = useCallback((year: string, value: number | null, e: React.MouseEvent) => {
    e.preventDefault();
    onCellRightClick(row.id, year, value, e);
  }, [row.id, onCellRightClick]);

  return (
    <motion.tr
      id={`row-${row.id}`}
      initial={false}
      animate={{
        backgroundColor: isHighlighted || isDeepDiveTarget
          ? 'var(--highlight-color)'
          : 'transparent',
      }}
      transition={{ duration: 0.3 }}
      className={`
        border-b theme-border transition-all duration-200 group
        ${isZebraRow && !row.isHeader && !row.isSubtotal ? 'bg-black/[0.02] dark:bg-white/[0.02]' : ''}
        ${row.isHeader ? 'theme-bg-tertiary font-semibold' : ''}
        ${row.isSubtotal ? 'theme-bg-tertiary border-t-2' : ''}
        ${isHighlighted || isDeepDiveTarget ? 'ring-2 ring-blue-500/30 ring-inset' : ''}
        ${isFilteredOut ? 'opacity-40' : ''}
        hover:bg-blue-500/5
      `}
      style={{
        '--highlight-color': 'rgba(59, 130, 246, 0.1)',
      } as React.CSSProperties}
    >
      <td
        className={`py-2.5 px-4 text-start ${row.isBold ? 'font-semibold' : ''} ${
          row.isSubtotal || row.isHeader ? 'theme-text-primary' : 'theme-text-secondary'
        }`}
        style={{ paddingInlineStart: `calc(1rem + ${paddingStart})` }}
      >
        {hasFormula ? (
          <FormulaTooltip rowId={row.id}>{row.label}</FormulaTooltip>
        ) : (
          row.label
        )}
      </td>
      {years.map((year) => {
        const overrideKey = `${row.id}-${year}`;
        const override = cellOverrides.get(overrideKey);
        const value = override ? override.overrideValue : row.values[year];
        const growth = row.growth?.[year];
        const isRecalculating = recalculatingCells.has(overrideKey);
        const isFiltered = gridFilter?.type === 'year' && gridFilter.value === year;

        return (
          <td
            key={year}
            className={`py-2.5 px-3 text-end font-mono text-sm ${
              row.isBold ? 'font-semibold' : ''
            } ${isFiltered ? 'filter-highlight' : ''}`}
          >
            <EditableCell
              rowId={row.id}
              year={year}
              value={value}
              label={row.label}
              isEditMode={isEditMode}
              isOverridden={!!override}
              isRecalculating={isRecalculating}
              onSave={(newValue) => handleCellSave(year, newValue)}
              onClear={() => handleCellClear(year)}
              onRightClick={(e) => handleRightClick(year, value, e)}
            />
            {growth !== null && growth !== undefined && (
              <span
                className={`text-xs tabular-nums ${
                  growth >= 0 ? 'text-emerald-500' : 'text-red-500'
                }`}
              >
                {formatGrowth(growth)}
              </span>
            )}
          </td>
        );
      })}
    </motion.tr>
  );
}

interface SectionProps {
  section: FinancialSection;
  startIndex: number;
  onCellRightClick: (rowId: string, year: string, value: number | null, e: React.MouseEvent) => void;
}

function Section({ section, startIndex, onCellRightClick }: SectionProps) {
  const { expandedSections, toggleSection } = useApp();
  const isExpanded = expandedSections.has(section.id);

  return (
    <>
      <tr
        className="theme-bg-secondary border-b theme-border cursor-pointer hover:bg-blue-500/5 transition-colors"
        onClick={() => toggleSection(section.id)}
      >
        <td colSpan={years.length + 1} className="py-3 px-4">
          <div className="flex items-center gap-2">
            <motion.div
              initial={false}
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="theme-text-muted"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
            <span className="font-semibold theme-text-primary tracking-tight">
              {section.title}
            </span>
            <span className="text-xs theme-text-muted font-mono">
              ({section.rows.length} items)
            </span>
          </div>
        </td>
      </tr>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <td colSpan={years.length + 1} className="p-0">
              <table className="w-full">
                <tbody>
                  {section.rows.map((row, index) => (
                    <FinancialRow
                      key={row.id}
                      row={row}
                      rowIndex={startIndex + index}
                      onCellRightClick={onCellRightClick}
                    />
                  ))}
                </tbody>
              </table>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

export function FinancialDataGrid() {
  const { t } = useTranslation();
  const {
    isAllExpanded,
    expandAll,
    collapseAll,
    deepDiveData,
    clearDeepDive,
    isEditMode,
    toggleEditMode,
    cellOverrides,
    clearAllOverrides,
    gridFilter,
    clearGridFilter,
    isScenarioMode,
    toggleScenarioMode,
    activeCellHistory,
    setActiveCellHistory,
  } = useApp();

  const [cellHistoryPosition, setCellHistoryPosition] = useState<{ x: number; y: number } | null>(null);
  const [currentCellValue, setCurrentCellValue] = useState<number | null>(null);

  let rowIndex = 0;
  const overrideCount = cellOverrides.size;

  // Handle right-click on cells to show history popover
  const handleCellRightClick = useCallback((
    rowId: string,
    year: string,
    value: number | null,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    setActiveCellHistory({ rowId, year });
    setCellHistoryPosition({ x: e.clientX, y: e.clientY });
    setCurrentCellValue(value);
  }, [setActiveCellHistory]);

  // If scenario mode is enabled, render the comparison grid
  if (isScenarioMode) {
    return <ScenarioComparisonGrid sections={financialSections} years={years} />;
  }

  return (
    <div className="theme-bg-tertiary rounded-xl border theme-border overflow-hidden shadow-sm transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b theme-border theme-bg-secondary">
        <div>
          <h3 className="text-base font-semibold theme-text-primary tracking-tight">
            {t('grid.title')}
          </h3>
          <p className="text-xs theme-text-muted font-mono">
            {t('grid.valuesInMillions')} • {isEditMode ? t('grid.doubleClickToEdit') : t('grid.hoverForFormulas')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Grid Filter Indicator */}
          {gridFilter && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-purple-500 bg-purple-500/10 rounded-lg"
            >
              <Filter className="w-3 h-3" />
              <span>{t('grid.filtered', { value: gridFilter.value })}</span>
              <button
                type="button"
                onClick={clearGridFilter}
                className="hover:text-purple-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}

          {/* Override Count */}
          {overrideCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-500 bg-amber-500/10 rounded-lg"
            >
              <span>{t('grid.override', { count: overrideCount })}</span>
              <button
                type="button"
                onClick={clearAllOverrides}
                className="hover:text-amber-600"
                title={t('grid.clearAllOverrides')}
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </motion.div>
          )}

          {/* Deep Dive Indicator */}
          {deepDiveData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-500 bg-blue-500/10 rounded-lg"
            >
              <span>{t('grid.deepDiveLabel', { label: deepDiveData.metricLabel })}</span>
              <button
                type="button"
                onClick={clearDeepDive}
                className="hover:text-blue-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}

          {/* Scenario Comparison Toggle */}
          <button
            type="button"
            onClick={toggleScenarioMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isScenarioMode
                ? 'text-purple-600 bg-purple-500/20 border border-purple-500/30'
                : 'theme-text-secondary theme-bg-tertiary border theme-border hover:theme-bg-hover'
            }`}
            title={t('grid.compare')}
          >
            <GitCompare className="w-3.5 h-3.5" />
            {isScenarioMode ? t('grid.comparing') : t('grid.compare')}
          </button>

          {/* Edit Mode Toggle */}
          <button
            type="button"
            onClick={toggleEditMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isEditMode
                ? 'text-amber-600 bg-amber-500/20 border border-amber-500/30'
                : 'theme-text-secondary theme-bg-tertiary border theme-border hover:theme-bg-hover'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditMode ? t('grid.editing') : t('grid.editMode')}
          </button>

          {/* Expand/Collapse */}
          <button
            type="button"
            onClick={isAllExpanded ? collapseAll : expandAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium theme-text-secondary
              theme-bg-tertiary border theme-border hover:theme-bg-hover rounded-lg transition-colors"
          >
            {isAllExpanded ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                {t('grid.collapse')}
              </>
            ) : (
              <>
                <Expand className="w-3.5 h-3.5" />
                {t('grid.expand')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b theme-border theme-bg-secondary">
              <th className="py-3 px-4 text-start text-xs font-semibold theme-text-muted uppercase tracking-widest w-[260px]">
                {t('grid.lineItem')}
              </th>
              {years.map((year) => (
                <th
                  key={year}
                  className="py-3 px-3 text-end text-xs font-semibold uppercase tracking-widest w-[110px] font-mono"
                >
                  <span
                    className={
                      year.endsWith('A')
                        ? 'text-blue-500'
                        : 'text-emerald-500'
                    }
                  >
                    {year}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {financialSections.map((section) => {
              const sectionStartIndex = rowIndex;
              rowIndex += section.rows.length;
              return (
                <Section
                  key={section.id}
                  section={section}
                  startIndex={sectionStartIndex}
                  onCellRightClick={handleCellRightClick}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t theme-border theme-bg-secondary">
        <div className="flex items-center justify-between text-xs theme-text-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {t('grid.actual')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {t('grid.estimated')}
            </span>
            {/* Status Indicators */}
            <span className="border-s theme-border ps-4 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-purple-500" />
              {t('grid.aiGenerated')}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-amber-500" />
              {t('grid.userModified')}
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-500" />
              {t('grid.verified')}
            </span>
          </div>
          <span className="font-mono flex items-center gap-3">
            <span className="flex items-center gap-1">
              <History className="inline w-3 h-3" />
              {t('grid.rightClickForHistory')}
            </span>
            <span className="flex items-center gap-1">
              <Info className="inline w-3 h-3" />
              {t('grid.hoverForFormulas')}
            </span>
          </span>
        </div>
      </div>

      {/* Cell History Popover */}
      {activeCellHistory && cellHistoryPosition && (
        <CellHistoryPopover
          rowId={activeCellHistory.rowId}
          year={activeCellHistory.year}
          currentValue={currentCellValue}
          position={cellHistoryPosition}
          onClose={() => {
            setActiveCellHistory(null);
            setCellHistoryPosition(null);
            setCurrentCellValue(null);
          }}
        />
      )}
    </div>
  );
}
