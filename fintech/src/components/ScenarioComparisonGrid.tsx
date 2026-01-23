import { motion } from 'framer-motion';
import { GitCompare, Sparkles, User, ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useState } from 'react';
import type { ScenarioData, FinancialSection } from '../types/financial';

interface ScenarioComparisonGridProps {
  sections: FinancialSection[];
  years: string[];
}

// Generate scenario values with adjustments
function getScenarioValue(
  baseValue: number | null,
  scenario: ScenarioData,
  rowId: string
): number | null {
  if (baseValue === null) return null;

  // Apply scenario-specific adjustments
  const adjustmentFactors: Record<string, number> = {
    base: 1,
    user: 1.05, // 5% higher
    bull: 1.25, // 25% higher
    bear: 0.85, // 15% lower
  };

  const factor = adjustmentFactors[scenario.type] || 1;

  // Add some variation per row
  const rowVariation = rowId.includes('revenue') ? 1.02 : rowId.includes('cost') ? 0.98 : 1;

  return baseValue * factor * rowVariation;
}

function formatValue(value: number | null): string {
  if (value === null) return '—';
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  const formatted = absValue >= 1000
    ? `$${(absValue / 1000).toFixed(1)}B`
    : `$${absValue.toFixed(0)}M`;
  return isNegative ? `(${formatted})` : formatted;
}

function DifferenceIndicator({ baseValue, compareValue }: { baseValue: number | null; compareValue: number | null }) {
  if (baseValue === null || compareValue === null) return null;

  const diff = ((compareValue - baseValue) / Math.abs(baseValue)) * 100;
  const isPositive = diff >= 0;

  if (Math.abs(diff) < 0.1) return null;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${
        isPositive ? 'text-emerald-500' : 'text-red-500'
      }`}
    >
      {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {isPositive ? '+' : ''}{diff.toFixed(1)}%
    </span>
  );
}

export function ScenarioComparisonGrid({ sections, years }: ScenarioComparisonGridProps) {
  const { activeScenarios, availableScenarios, setActiveScenarios, toggleScenarioMode } = useApp();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  );

  const [leftScenario, rightScenario] = activeScenarios;

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col theme-bg-tertiary rounded-xl border theme-border overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b theme-border theme-bg-secondary">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <GitCompare className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold theme-text-primary">Scenario Comparison</h3>
            <p className="text-xs theme-text-muted">Comparing {leftScenario?.name || 'Base'} vs {rightScenario?.name || 'User'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleScenarioMode}
          className="px-3 py-1.5 text-xs font-medium theme-text-secondary theme-bg-hover rounded-lg transition-colors"
        >
          Exit Compare
        </button>
      </div>

      {/* Scenario Selectors */}
      <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b theme-border theme-bg-tertiary">
        {[0, 1].map((index) => {
          const scenario = activeScenarios[index];
          const isAI = scenario?.isAIGenerated;

          return (
            <div key={index} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded flex items-center justify-center ${
                  isAI ? 'bg-purple-500/20' : 'bg-amber-500/20'
                }`}
              >
                {isAI ? (
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                ) : (
                  <User className="w-3.5 h-3.5 text-amber-500" />
                )}
              </div>
              <select
                value={scenario?.id || ''}
                onChange={(e) => {
                  const selected = availableScenarios.find((s) => s.id === e.target.value);
                  const newScenarios: [ScenarioData | null, ScenarioData | null] = [...activeScenarios];
                  newScenarios[index] = selected || null;
                  setActiveScenarios(newScenarios);
                }}
                className="flex-1 px-2 py-1.5 text-xs theme-bg-secondary border theme-border rounded-lg theme-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {availableScenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {/* Split Grid */}
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[800px]">
          <thead className="sticky top-0 z-10">
            <tr className="theme-bg-secondary">
              <th className="sticky start-0 z-20 px-4 py-3 text-start text-xs font-semibold theme-text-muted uppercase tracking-wider border-b theme-border min-w-[200px] theme-bg-secondary">
                Metric
              </th>
              {/* Left Scenario Columns */}
              {years.map((year) => (
                <th
                  key={`left-${year}`}
                  className="px-3 py-3 text-end text-xs font-semibold uppercase tracking-wider border-b theme-border min-w-[100px] bg-purple-500/5"
                >
                  <span className="text-purple-500">{year}</span>
                </th>
              ))}
              {/* Divider */}
              <th className="w-px border-b border-e-2 theme-border" />
              {/* Right Scenario Columns */}
              {years.map((year) => (
                <th
                  key={`right-${year}`}
                  className="px-3 py-3 text-end text-xs font-semibold uppercase tracking-wider border-b theme-border min-w-[100px] bg-amber-500/5"
                >
                  <span className="text-amber-500">{year}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => {
              const isExpanded = expandedSections.has(section.id);

              return (
                <motion.tbody key={section.id} initial={false}>
                  {/* Section Header */}
                  <tr
                    className="theme-bg-tertiary cursor-pointer hover:theme-bg-secondary transition-colors"
                    onClick={() => toggleSection(section.id)}
                  >
                    <td
                      colSpan={years.length * 2 + 2}
                      className="px-4 py-2 border-b theme-border"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 theme-text-muted" />
                        ) : (
                          <ChevronRight className="w-4 h-4 theme-text-muted" />
                        )}
                        <span className="text-xs font-semibold theme-text-primary uppercase tracking-wider">
                          {section.title}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Section Rows */}
                  {isExpanded &&
                    section.rows.map((row) => {
                      const baseRow = row.values;

                      return (
                        <tr
                          key={row.id}
                          className={`theme-bg-hover transition-colors ${
                            row.isSubtotal ? 'font-semibold' : ''
                          }`}
                        >
                          {/* Row Label */}
                          <td
                            className={`sticky start-0 px-4 py-2.5 border-b theme-border theme-bg-secondary ${
                              row.indent ? `ps-${4 + row.indent * 4}` : ''
                            }`}
                          >
                            <span
                              className={`text-sm ${
                                row.isSubtotal
                                  ? 'font-semibold theme-text-primary'
                                  : 'theme-text-secondary'
                              }`}
                              style={{ paddingLeft: row.indent ? `${row.indent * 16}px` : undefined }}
                            >
                              {row.label}
                            </span>
                          </td>

                          {/* Left Scenario Values */}
                          {years.map((year) => {
                            const baseValue = baseRow[year];
                            const leftValue = leftScenario
                              ? getScenarioValue(baseValue, leftScenario, row.id)
                              : baseValue;

                            return (
                              <td
                                key={`left-${year}`}
                                className="px-3 py-2.5 text-end border-b theme-border bg-purple-500/5"
                              >
                                <span className="text-sm font-mono theme-text-primary">
                                  {formatValue(leftValue)}
                                </span>
                              </td>
                            );
                          })}

                          {/* Divider */}
                          <td className="w-px border-b border-e-2 theme-border" />

                          {/* Right Scenario Values with Differences */}
                          {years.map((year) => {
                            const baseValue = baseRow[year];
                            const leftValue = leftScenario
                              ? getScenarioValue(baseValue, leftScenario, row.id)
                              : baseValue;
                            const rightValue = rightScenario
                              ? getScenarioValue(baseValue, rightScenario, row.id)
                              : baseValue;

                            return (
                              <td
                                key={`right-${year}`}
                                className="px-3 py-2.5 text-end border-b theme-border bg-amber-500/5"
                              >
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className="text-sm font-mono theme-text-primary">
                                    {formatValue(rightValue)}
                                  </span>
                                  <DifferenceIndicator
                                    baseValue={leftValue}
                                    compareValue={rightValue}
                                  />
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </motion.tbody>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 px-4 py-2 border-t theme-border theme-bg-secondary">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-500/20" />
          <span className="text-xs theme-text-muted">{leftScenario?.name || 'Base Case'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-500/20" />
          <span className="text-xs theme-text-muted">{rightScenario?.name || 'User Adjusted'}</span>
        </div>
      </div>
    </motion.div>
  );
}
