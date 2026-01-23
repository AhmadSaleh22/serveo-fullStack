import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  Direction,
  Theme,
  WorkspaceTab,
  SourceCitation,
  CellOverride,
  ChartFilter,
  SlideData,
  ScenarioData,
  AuditEntry,
  CellMetadata,
  DataStatus,
} from '../types/financial';

type Language = 'en' | 'ar';

interface DeepDiveData {
  metricId: string;
  metricLabel: string;
  timestamp: Date;
}

interface AppContextType {
  // Theme & Language
  direction: Direction;
  toggleDirection: () => void;
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  changeLanguage: (lang: Language) => void;

  // Workspace
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;

  // Deep Dive
  deepDiveData: DeepDiveData | null;
  triggerDeepDive: (metricId: string, metricLabel: string) => void;
  clearDeepDive: () => void;

  // Grid
  highlightedRowId: string | null;
  setHighlightedRowId: (id: string | null) => void;
  expandedSections: Set<string>;
  toggleSection: (sectionId: string) => void;
  isAllExpanded: boolean;
  expandAll: () => void;
  collapseAll: () => void;

  // Command Palette
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;

  // Source Drawer
  activeSourceCitation: SourceCitation | null;
  openSourceDrawer: (citation: SourceCitation) => void;
  closeSourceDrawer: () => void;

  // Edit Mode & Overrides
  isEditMode: boolean;
  toggleEditMode: () => void;
  cellOverrides: Map<string, CellOverride>;
  setCellOverride: (rowId: string, year: string, value: number, originalValue: number | null) => void;
  clearCellOverride: (rowId: string, year: string) => void;
  clearAllOverrides: () => void;
  recalculatingCells: Set<string>;
  triggerRecalculation: (cellIds: string[]) => void;

  // Grid Filtering
  gridFilter: ChartFilter | null;
  setGridFilter: (filter: ChartFilter) => void;
  clearGridFilter: () => void;

  // Loading States
  isDataLoading: boolean;
  setDataLoading: (loading: boolean) => void;

  // Slides Management
  slides: SlideData[];
  currentSlideIndex: number;
  setSlides: (slides: SlideData[]) => void;
  setCurrentSlide: (index: number) => void;
  addSlide: (afterIndex?: number) => void;
  deleteSlide: (slideId: string) => void;
  duplicateSlide: (slideId: string) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;

  // Scenario Comparison
  isScenarioMode: boolean;
  toggleScenarioMode: () => void;
  activeScenarios: [ScenarioData | null, ScenarioData | null];
  setActiveScenarios: (scenarios: [ScenarioData | null, ScenarioData | null]) => void;
  availableScenarios: ScenarioData[];

  // Audit Trail
  auditHistory: Map<string, AuditEntry[]>;
  addAuditEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  getAuditHistory: (rowId: string, year: string) => AuditEntry[];
  activeCellHistory: { rowId: string; year: string } | null;
  setActiveCellHistory: (cell: { rowId: string; year: string } | null) => void;

  // Cell Metadata
  cellMetadata: Map<string, CellMetadata>;
  setCellStatus: (rowId: string, year: string, status: DataStatus) => void;
  getCellStatus: (rowId: string, year: string) => DataStatus;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default slides configuration
const defaultSlides: SlideData[] = [
  { id: 'slide-1', title: 'Executive Summary', order: 0, type: 'executive' },
  { id: 'slide-2', title: 'Revenue Analysis', order: 1, type: 'revenue' },
  { id: 'slide-3', title: 'Revenue by Segment', order: 2, type: 'segment' },
  { id: 'slide-4', title: 'Profitability', order: 3, type: 'margins' },
  { id: 'slide-5', title: 'Forward Guidance', order: 4, type: 'guidance' },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('language') as Language;
    return stored || 'en';
  });
  const [direction, setDirection] = useState<Direction>(() => language === 'ar' ? 'rtl' : 'ltr');
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme;
      if (stored) return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('grid');
  const [deepDiveData, setDeepDiveData] = useState<DeepDiveData | null>(null);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['revenue', 'costs', 'ebitda', 'net-income'])
  );
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Source Drawer State
  const [activeSourceCitation, setActiveSourceCitation] = useState<SourceCitation | null>(null);

  // Edit Mode & Overrides State
  const [isEditMode, setIsEditMode] = useState(false);
  const [cellOverrides, setCellOverrides] = useState<Map<string, CellOverride>>(new Map());
  const [recalculatingCells, setRecalculatingCells] = useState<Set<string>>(new Set());

  // Grid Filtering State
  const [gridFilter, setGridFilterState] = useState<ChartFilter | null>(null);

  // Loading State
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Slides State
  const [slides, setSlidesState] = useState<SlideData[]>(defaultSlides);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Scenario Comparison State
  const [isScenarioMode, setIsScenarioMode] = useState(false);
  const [activeScenarios, setActiveScenarios] = useState<[ScenarioData | null, ScenarioData | null]>([null, null]);

  // Sample scenarios for demonstration
  const availableScenarios: ScenarioData[] = [
    {
      id: 'base-case',
      name: 'AI Base Case',
      type: 'base',
      description: 'AI-generated baseline forecast based on historical trends',
      values: {},
      createdAt: new Date('2024-01-15'),
      isAIGenerated: true,
    },
    {
      id: 'user-adjusted',
      name: 'User Adjusted',
      type: 'user',
      description: 'User-modified scenario with custom assumptions',
      values: {},
      createdAt: new Date(),
      isAIGenerated: false,
    },
    {
      id: 'bull-case',
      name: 'Bull Case',
      type: 'bull',
      description: '+25% growth scenario with optimistic assumptions',
      values: {},
      createdAt: new Date('2024-01-15'),
      isAIGenerated: true,
    },
    {
      id: 'bear-case',
      name: 'Bear Case',
      type: 'bear',
      description: '+10% growth scenario with conservative assumptions',
      values: {},
      createdAt: new Date('2024-01-15'),
      isAIGenerated: true,
    },
  ];

  // Audit Trail State
  const [auditHistory, setAuditHistory] = useState<Map<string, AuditEntry[]>>(new Map());
  const [activeCellHistory, setActiveCellHistory] = useState<{ rowId: string; year: string } | null>(null);

  // Cell Metadata State
  const [cellMetadata, setCellMetadata] = useState<Map<string, CellMetadata>>(new Map());

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') {
          setIsCommandPaletteOpen(false);
          setActiveCellHistory(null);
        }
        return;
      }

      // Cmd/Ctrl + K - Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }

      // Alt + E - Toggle Edit Mode
      if (e.altKey && e.key === 'e') {
        e.preventDefault();
        setIsEditMode((prev) => !prev);
      }

      // Alt + P - Toggle PPT Preview
      if (e.altKey && e.key === 'p') {
        e.preventDefault();
        setActiveTab((prev) => (prev === 'ppt' ? 'grid' : 'ppt'));
      }

      // Alt + S - Toggle Scenario Comparison
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        setIsScenarioMode((prev) => {
          if (!prev) {
            setActiveScenarios([availableScenarios[0], availableScenarios[1]]);
          }
          return !prev;
        });
      }

      // Alt + C - Toggle Chart View
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        setActiveTab((prev) => (prev === 'chart' ? 'grid' : 'chart'));
      }

      // Escape - Close all overlays
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setActiveCellHistory(null);
        setActiveSourceCitation(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [availableScenarios]);

  const toggleDirection = useCallback(() => {
    setDirection((prev) => (prev === 'ltr' ? 'rtl' : 'ltr'));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const changeLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    // Automatically set RTL for Arabic
    setDirection(lang === 'ar' ? 'rtl' : 'ltr');
  }, [i18n]);

  const triggerDeepDive = useCallback((metricId: string, metricLabel: string) => {
    setDeepDiveData({ metricId, metricLabel, timestamp: new Date() });
    setActiveTab('grid');
    setHighlightedRowId(metricId);

    // Expand the relevant section
    const sectionMap: Record<string, string> = {
      'total-revenue': 'revenue',
      'product-revenue': 'revenue',
      'service-revenue': 'revenue',
      'cogs': 'costs',
      'gross-profit': 'costs',
      'ebitda': 'ebitda',
      'operating-income': 'ebitda',
      'net-income': 'net-income',
    };

    const sectionId = sectionMap[metricId];
    if (sectionId) {
      setExpandedSections((prev) => new Set([...prev, sectionId]));
    }

    setTimeout(() => {
      const element = document.getElementById(`row-${metricId}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  const clearDeepDive = useCallback(() => {
    setDeepDiveData(null);
    setHighlightedRowId(null);
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const isAllExpanded = expandedSections.size === 4;

  const expandAll = useCallback(() => {
    setExpandedSections(new Set(['revenue', 'costs', 'ebitda', 'net-income']));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedSections(new Set());
  }, []);

  const openCommandPalette = useCallback(() => setIsCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setIsCommandPaletteOpen(false), []);
  const toggleCommandPalette = useCallback(() => setIsCommandPaletteOpen((prev) => !prev), []);

  // Source Drawer Actions
  const openSourceDrawer = useCallback((citation: SourceCitation) => {
    setActiveSourceCitation(citation);
  }, []);

  const closeSourceDrawer = useCallback(() => {
    setActiveSourceCitation(null);
  }, []);

  // Edit Mode Actions
  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  const setCellOverride = useCallback(
    (rowId: string, year: string, value: number, originalValue: number | null) => {
      const key = `${rowId}-${year}`;

      // Add to audit history
      const cellKey = `${rowId}-${year}`;
      const newAuditEntry: AuditEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        rowId,
        year,
        action: 'user_override',
        previousValue: originalValue,
        newValue: value,
        timestamp: new Date(),
        userName: 'Current User',
        note: 'Manual override',
      };
      setAuditHistory((prev) => {
        const next = new Map(prev);
        const existing = next.get(cellKey) || [];
        next.set(cellKey, [...existing, newAuditEntry]);
        return next;
      });

      // Update cell overrides
      setCellOverrides((prev) => {
        const next = new Map(prev);
        next.set(key, {
          rowId,
          year,
          originalValue,
          overrideValue: value,
          timestamp: new Date(),
        });
        return next;
      });

      // Update cell status to user_modified
      setCellMetadata((prev) => {
        const next = new Map(prev);
        next.set(cellKey, {
          cellKey,
          status: 'user_modified',
          lastModified: new Date(),
        });
        return next;
      });
    },
    []
  );

  const clearCellOverride = useCallback((rowId: string, year: string) => {
    const key = `${rowId}-${year}`;
    const cellKey = `${rowId}-${year}`;

    // Get the current override to record what we're reverting from
    const currentOverride = cellOverrides.get(key);
    if (currentOverride) {
      // Add revert to audit history
      const revertEntry: AuditEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        rowId,
        year,
        action: 'system_recalculated',
        previousValue: currentOverride.overrideValue,
        newValue: currentOverride.originalValue,
        timestamp: new Date(),
        source: 'User Revert',
        note: 'Reverted to original value',
      };
      setAuditHistory((prev) => {
        const next = new Map(prev);
        const existing = next.get(cellKey) || [];
        next.set(cellKey, [...existing, revertEntry]);
        return next;
      });
    }

    setCellOverrides((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });

    // Update cell status back to ai_generated
    setCellMetadata((prev) => {
      const next = new Map(prev);
      next.set(cellKey, {
        cellKey,
        status: 'ai_generated',
        lastModified: new Date(),
      });
      return next;
    });
  }, [cellOverrides]);

  const clearAllOverrides = useCallback(() => {
    setCellOverrides(new Map());
  }, []);

  const triggerRecalculation = useCallback((cellIds: string[]) => {
    setRecalculatingCells(new Set(cellIds));
    setTimeout(() => {
      setRecalculatingCells(new Set());
    }, 600);
  }, []);

  // Grid Filter Actions
  const setGridFilter = useCallback((filter: ChartFilter) => {
    setGridFilterState(filter);
    setActiveTab('grid');
  }, []);

  const clearGridFilter = useCallback(() => {
    setGridFilterState(null);
  }, []);

  // Data Loading Actions
  const setDataLoading = useCallback((loading: boolean) => {
    setIsDataLoading(loading);
  }, []);

  // Slide Management Actions
  const setSlides = useCallback((newSlides: SlideData[]) => {
    setSlidesState(newSlides);
  }, []);

  const setCurrentSlide = useCallback((index: number) => {
    setCurrentSlideIndex(index);
  }, []);

  const addSlide = useCallback((afterIndex?: number) => {
    setSlidesState((prev) => {
      const newId = `slide-${Date.now()}`;
      const insertIndex = afterIndex !== undefined ? afterIndex + 1 : prev.length;
      const newSlide: SlideData = {
        id: newId,
        title: 'New Slide',
        order: insertIndex,
        type: 'custom',
      };
      const next = [...prev];
      next.splice(insertIndex, 0, newSlide);
      // Update order for all slides
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  const deleteSlide = useCallback((slideId: string) => {
    setSlidesState((prev) => {
      if (prev.length <= 1) return prev; // Don't delete last slide
      const filtered = prev.filter((s) => s.id !== slideId);
      return filtered.map((s, i) => ({ ...s, order: i }));
    });
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const duplicateSlide = useCallback((slideId: string) => {
    setSlidesState((prev) => {
      const slideIndex = prev.findIndex((s) => s.id === slideId);
      if (slideIndex === -1) return prev;
      const original = prev[slideIndex];
      const newSlide: SlideData = {
        ...original,
        id: `slide-${Date.now()}`,
        title: `${original.title} (Copy)`,
        order: slideIndex + 1,
      };
      const next = [...prev];
      next.splice(slideIndex + 1, 0, newSlide);
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  const reorderSlides = useCallback((fromIndex: number, toIndex: number) => {
    setSlidesState((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  // Scenario Comparison Actions
  const toggleScenarioMode = useCallback(() => {
    setIsScenarioMode((prev) => {
      if (!prev) {
        // When enabling, set default scenarios
        setActiveScenarios([availableScenarios[0], availableScenarios[1]]);
      }
      return !prev;
    });
  }, [availableScenarios]);

  // Audit Trail Actions
  const addAuditEntry = useCallback((entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    const cellKey = `${entry.rowId}-${entry.year}`;
    const newEntry: AuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
    };
    setAuditHistory((prev) => {
      const next = new Map(prev);
      const existing = next.get(cellKey) || [];
      next.set(cellKey, [...existing, newEntry]);
      return next;
    });
  }, []);

  const getAuditHistory = useCallback((rowId: string, year: string): AuditEntry[] => {
    const cellKey = `${rowId}-${year}`;
    return auditHistory.get(cellKey) || [];
  }, [auditHistory]);

  // Cell Metadata Actions
  const setCellStatus = useCallback((rowId: string, year: string, status: DataStatus) => {
    const cellKey = `${rowId}-${year}`;
    setCellMetadata((prev) => {
      const next = new Map(prev);
      const existing = next.get(cellKey);
      next.set(cellKey, {
        ...existing,
        cellKey,
        status,
        lastModified: new Date(),
      });
      return next;
    });
  }, []);

  const getCellStatus = useCallback((rowId: string, year: string): DataStatus => {
    const cellKey = `${rowId}-${year}`;
    return cellMetadata.get(cellKey)?.status || 'ai_generated';
  }, [cellMetadata]);

  return (
    <AppContext.Provider
      value={{
        direction,
        toggleDirection,
        theme,
        toggleTheme,
        language,
        changeLanguage,
        activeTab,
        setActiveTab,
        deepDiveData,
        triggerDeepDive,
        clearDeepDive,
        highlightedRowId,
        setHighlightedRowId,
        expandedSections,
        toggleSection,
        isAllExpanded,
        expandAll,
        collapseAll,
        isCommandPaletteOpen,
        openCommandPalette,
        closeCommandPalette,
        toggleCommandPalette,
        // Source Drawer
        activeSourceCitation,
        openSourceDrawer,
        closeSourceDrawer,
        // Edit Mode
        isEditMode,
        toggleEditMode,
        cellOverrides,
        setCellOverride,
        clearCellOverride,
        clearAllOverrides,
        recalculatingCells,
        triggerRecalculation,
        // Grid Filter
        gridFilter,
        setGridFilter,
        clearGridFilter,
        // Loading
        isDataLoading,
        setDataLoading,
        // Slides
        slides,
        currentSlideIndex,
        setSlides,
        setCurrentSlide,
        addSlide,
        deleteSlide,
        duplicateSlide,
        reorderSlides,
        // Scenario Comparison
        isScenarioMode,
        toggleScenarioMode,
        activeScenarios,
        setActiveScenarios,
        availableScenarios,
        // Audit Trail
        auditHistory,
        addAuditEntry,
        getAuditHistory,
        activeCellHistory,
        setActiveCellHistory,
        // Cell Metadata
        cellMetadata,
        setCellStatus,
        getCellStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
