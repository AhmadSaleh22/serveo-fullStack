import { useState } from 'react';
import { Dialog, DialogPanel, DialogBackdrop, Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  TrendingUp,
  FileSpreadsheet,
  PieChart,
  Calculator,
  Layers,
  Zap,
  ArrowRight,
  Command,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette() {
  const { t } = useTranslation();
  const { isCommandPaletteOpen, closeCommandPalette, setActiveTab, triggerDeepDive } = useApp();
  const [query, setQuery] = useState('');
  const [selectedCommand, setSelectedCommand] = useState<CommandItem | null>(null);

  const commands: CommandItem[] = [
    {
      id: 'generate-forecast',
      label: t('commands.generateForecast'),
      description: t('commands.generateForecastDesc'),
      icon: <TrendingUp className="w-4 h-4" />,
      shortcut: 'F',
      action: () => {
        triggerDeepDive('total-revenue', t('financial.totalRevenue'));
        closeCommandPalette();
      },
    },
    {
      id: 'add-scenario',
      label: t('commands.addScenario'),
      description: t('commands.addScenarioDesc'),
      icon: <Layers className="w-4 h-4" />,
      shortcut: 'S',
      action: () => {
        setActiveTab('chart');
        closeCommandPalette();
      },
    },
    {
      id: 'analyze-margins',
      label: t('commands.analyzeMargins'),
      description: t('commands.analyzeMarginsDesc'),
      icon: <Calculator className="w-4 h-4" />,
      action: () => {
        triggerDeepDive('ebitda', t('financial.ebitda'));
        closeCommandPalette();
      },
    },
    {
      id: 'export-model',
      label: t('commands.exportModel'),
      description: t('commands.exportModelDesc'),
      icon: <FileSpreadsheet className="w-4 h-4" />,
      shortcut: 'E',
      action: () => {
        closeCommandPalette();
      },
    },
    {
      id: 'create-presentation',
      label: t('commands.createPresentation'),
      description: t('commands.createPresentationDesc'),
      icon: <PieChart className="w-4 h-4" />,
      shortcut: 'P',
      action: () => {
        setActiveTab('ppt');
        closeCommandPalette();
      },
    },
    {
      id: 'quick-valuation',
      label: t('commands.quickValuation'),
      description: t('commands.quickValuationDesc'),
      icon: <Zap className="w-4 h-4" />,
      action: () => {
        triggerDeepDive('net-income', t('financial.netIncome'));
        closeCommandPalette();
      },
    },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (command: CommandItem | null) => {
    if (command) {
      command.action();
      setSelectedCommand(null);
      setQuery('');
    }
  };

  const handleClose = () => {
    closeCommandPalette();
    setQuery('');
    setSelectedCommand(null);
  };

  return (
    <Dialog
      open={isCommandPaletteOpen}
      onClose={handleClose}
      className="relative z-50"
    >
      {/* Backdrop */}
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-150 data-[closed]:opacity-0"
      />

      {/* Command Palette Container */}
      <div className="fixed inset-0 flex items-start justify-center pt-[20vh] p-4">
        <DialogPanel
          transition
          className="w-full max-w-xl transform transition-all duration-150 data-[closed]:opacity-0 data-[closed]:scale-95"
        >
          <Combobox
            value={selectedCommand}
            onChange={handleSelect}
            onClose={() => setQuery('')}
          >
            <div className="theme-bg-secondary border theme-border rounded-xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b theme-border">
                <Search className="w-5 h-5 theme-text-muted flex-shrink-0" />
                <ComboboxInput
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('commands.searchPlaceholder')}
                  className="flex-1 bg-transparent text-base theme-text-primary placeholder:theme-text-muted focus:outline-none"
                />
                <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs theme-text-muted theme-bg-tertiary rounded border theme-border">
                  <Command className="w-3 h-3" />K
                </kbd>
              </div>

              {/* Commands List */}
              <ComboboxOptions
                static
                className="max-h-80 overflow-y-auto p-2"
              >
                {filteredCommands.length === 0 ? (
                  <div className="px-4 py-8 text-center theme-text-muted">
                    {t('commands.noCommandsFound', { query })}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredCommands.map((cmd) => (
                      <ComboboxOption
                        key={cmd.id}
                        value={cmd}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-start transition-colors cursor-pointer data-[focus]:bg-blue-500/20 data-[focus]:text-blue-500 theme-text-primary"
                      >
                        {({ focus }) => (
                          <>
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                                focus ? 'bg-blue-500/20' : 'theme-bg-tertiary'
                              }`}
                            >
                              {cmd.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-medium">{cmd.label}</span>
                              </div>
                              <p className="text-xs theme-text-muted truncate">{cmd.description}</p>
                            </div>
                            {cmd.shortcut && (
                              <kbd className="flex-shrink-0 px-2 py-1 text-xs theme-text-muted theme-bg-tertiary rounded border theme-border">
                                {cmd.shortcut}
                              </kbd>
                            )}
                            {focus && (
                              <ArrowRight className="w-4 h-4 flex-shrink-0 text-blue-500" />
                            )}
                          </>
                        )}
                      </ComboboxOption>
                    ))}
                  </div>
                )}
              </ComboboxOptions>

              {/* Footer */}
              <div className="px-4 py-2 border-t theme-border theme-bg-tertiary">
                <div className="flex items-center justify-between text-xs theme-text-muted">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded theme-bg-secondary border theme-border">↑↓</kbd>
                      {t('common.navigate')}
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded theme-bg-secondary border theme-border">↵</kbd>
                      {t('common.select')}
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded theme-bg-secondary border theme-border">Esc</kbd>
                      {t('common.close')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Combobox>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
