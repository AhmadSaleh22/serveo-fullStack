import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, BarChart3, Command, Settings } from 'lucide-react';
import { ChatInterface } from './ChatInterface';
import { Workspace } from './Workspace';
import { CommandPalette } from './CommandPalette';
import { ResizableDivider } from './ResizableDivider';
import { SourceDrawer } from './SourceDrawer';
import { useApp } from '../context/AppContext';

function TopBar() {
  const { t } = useTranslation();
  const { theme, toggleTheme, openCommandPalette, language, changeLanguage } = useApp();

  return (
    <header className="flex-shrink-0 h-12 theme-bg-secondary border-b theme-border flex items-center justify-between px-4 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-sm">
          <BarChart3 className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold theme-text-primary tracking-tight">{t('app.name')}</h1>
        </div>
      </div>

      <nav className="flex items-center gap-1">
        <button
          type="button"
          onClick={openCommandPalette}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium theme-text-muted
            theme-bg-tertiary border theme-border hover:theme-bg-hover rounded-lg transition-colors"
        >
          <Command className="w-3.5 h-3.5" />
          {t('common.search')}
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] theme-bg-secondary rounded border theme-border ms-2">
            <span>⌘</span>K
          </kbd>
        </button>
        {/* Language Switcher */}
        <button
          type="button"
          onClick={() => changeLanguage(language === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium theme-text-secondary hover:theme-text-primary theme-bg-hover rounded-lg transition-colors"
          title={language === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
        >
          <span className="text-sm">{language === 'en' ? '🇺🇸' : '🇸🇦'}</span>
          <span className="hidden sm:inline">{language === 'en' ? 'EN' : 'عربي'}</span>
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 theme-text-secondary hover:theme-text-primary theme-bg-hover rounded-lg transition-colors"
          title={theme === 'dark' ? t('app.switchToLight') : t('app.switchToDark')}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
          type="button"
          className="p-2 theme-text-secondary hover:theme-text-primary theme-bg-hover rounded-lg transition-colors"
          title={t('common.settings')}
        >
          <Settings className="w-4 h-4" />
        </button>
      </nav>
    </header>
  );
}

const MIN_SIDEBAR_WIDTH = 300;
const MAX_SIDEBAR_WIDTH = 550;
const DEFAULT_SIDEBAR_WIDTH = 380;

export function Dashboard() {
  const { direction } = useApp();
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);

  const handleResize = useCallback((newWidth: number) => {
    setSidebarWidth(newWidth);
  }, []);

  return (
    <div
      dir={direction}
      className="h-screen flex flex-col theme-bg-primary theme-text-primary transition-colors"
    >
      <TopBar />

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Sidebar - Resizable */}
        <motion.aside
          initial={{ x: direction === 'ltr' ? -20 : 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ width: sidebarWidth }}
          className="flex-shrink-0 h-full"
        >
          <ChatInterface />
        </motion.aside>

        {/* Resizable Divider */}
        <ResizableDivider
          onResize={handleResize}
          minWidth={MIN_SIDEBAR_WIDTH}
          maxWidth={MAX_SIDEBAR_WIDTH}
        />

        {/* Main Workspace - Multi-tab */}
        <main className="flex-1 overflow-hidden theme-bg-primary">
          <Workspace />
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette />

      {/* Source Drawer */}
      <SourceDrawer />
    </div>
  );
}
