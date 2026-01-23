import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Presentation,
  ChevronLeft,
  ChevronRight,
  Play,
  Maximize2,
  Minimize2,
  TrendingUp,
  DollarSign,
  Target,
  BarChart3,
  Plus,
  Copy,
  Trash2,
  GripVertical,
  MousePointer2,
  Move,
  Pause,
  SkipForward,
  SkipBack,
  Timer,
  X,
  Check,
  Loader2,
  FileDown,
} from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { SlideCanvas } from './SlideCanvas';
import { usePPTXExport } from '../hooks/usePPTXExport';
import type { SlideData } from '../types/financial';

// Real financial data for slides
const revenueData = [
  { year: '2023A', value: 1200 },
  { year: '2024E', value: 1440 },
  { year: '2025E', value: 1728 },
  { year: '2026E', value: 2074 },
];

const marginData = [
  { name: 'Gross', value: 65, color: '#10b981' },
  { name: 'EBITDA', value: 30, color: '#3b82f6' },
  { name: 'Net', value: 18, color: '#8b5cf6' },
];

const kpiData = [
  { label: 'Revenue', value: '$1.44B', change: '+20%', icon: DollarSign },
  { label: 'EBITDA', value: '$432M', change: '+20%', icon: TrendingUp },
  { label: 'Net Income', value: '$259M', change: '+20%', icon: Target },
  { label: 'EPS', value: '$2.59', change: '+20%', icon: BarChart3 },
];

interface SlideProps {
  isActive: boolean;
}

function ExecutiveSummarySlide({ isActive }: SlideProps) {
  return (
    <div className="absolute inset-0 flex flex-col p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-emerald-500/5" />

      <div className="relative z-10 flex-1 flex flex-col">
        <h2 className="text-2xl font-bold theme-text-primary mb-1">Executive Summary</h2>
        <p className="text-sm theme-text-muted mb-6">FY 2024 Financial Performance Review</p>

        <div className="grid grid-cols-2 gap-4 flex-1">
          {kpiData.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                animate={isActive ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="theme-bg-tertiary rounded-lg p-4 border theme-border"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-xs theme-text-muted">{kpi.label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold theme-text-primary font-mono">{kpi.value}</span>
                  <span className="text-xs text-emerald-500 font-medium">{kpi.change}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-4 p-3 theme-bg-tertiary rounded-lg border theme-border">
          <p className="text-xs theme-text-secondary">
            <span className="font-semibold text-emerald-500">Key Highlight:</span> Strong revenue growth of 20% YoY
            driven by product expansion and improved operating leverage.
          </p>
        </div>
      </div>
    </div>
  );
}

function RevenueSlide({ isActive }: SlideProps) {
  return (
    <div className="absolute inset-0 flex flex-col p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5" />

      <div className="relative z-10 flex-1 flex flex-col">
        <h2 className="text-2xl font-bold theme-text-primary mb-1">Revenue Analysis</h2>
        <p className="text-sm theme-text-muted mb-4">4-Year Revenue Trajectory</p>

        <div className="flex-1 flex gap-6">
          {/* Chart */}
          <div className="flex-1 theme-bg-tertiary rounded-lg border theme-border p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  axisLine={{ stroke: 'var(--border-color)' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  axisLine={{ stroke: 'var(--border-color)' }}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(1)}B` : `${v}M`}`}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#revGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stats */}
          <div className="w-40 flex flex-col gap-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isActive ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="theme-bg-tertiary rounded-lg p-3 border theme-border"
            >
              <p className="text-xs theme-text-muted mb-1">2024E Revenue</p>
              <p className="text-lg font-bold text-emerald-500 font-mono">$1.44B</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isActive ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3 }}
              className="theme-bg-tertiary rounded-lg p-3 border theme-border"
            >
              <p className="text-xs theme-text-muted mb-1">YoY Growth</p>
              <p className="text-lg font-bold text-emerald-500 font-mono">+20%</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isActive ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.4 }}
              className="theme-bg-tertiary rounded-lg p-3 border theme-border"
            >
              <p className="text-xs theme-text-muted mb-1">CAGR (3Y)</p>
              <p className="text-lg font-bold text-blue-500 font-mono">20.0%</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SegmentSlide({ isActive }: SlideProps) {
  return (
    <div className="absolute inset-0 flex flex-col p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />

      <div className="relative z-10 flex-1 flex flex-col">
        <h2 className="text-2xl font-bold theme-text-primary mb-1">Revenue by Segment</h2>
        <p className="text-sm theme-text-muted mb-4">Product vs Service Mix</p>

        <div className="flex-1 flex gap-6">
          {/* Visual breakdown */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-48 h-48">
              {/* Donut chart simulation */}
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="20"
                  strokeDasharray={`${70 * 2.51} ${100 * 2.51}`}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="20"
                  strokeDasharray={`${30 * 2.51} ${100 * 2.51}`}
                  strokeDashoffset={`-${70 * 2.51}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold theme-text-primary font-mono">$1.44B</p>
                  <p className="text-xs theme-text-muted">Total Revenue</p>
                </div>
              </div>
            </div>
          </div>

          {/* Segment details */}
          <div className="w-56 flex flex-col justify-center gap-4">
            {[
              { name: 'Product Revenue', value: '$1,008M', pct: '70%', color: 'bg-blue-500' },
              { name: 'Service Revenue', value: '$432M', pct: '30%', color: 'bg-emerald-500' },
            ].map((seg, index) => (
              <motion.div
                key={seg.name}
                initial={{ opacity: 0, x: 20 }}
                animate={isActive ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="theme-bg-tertiary rounded-lg p-4 border theme-border"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${seg.color}`} />
                  <span className="text-sm font-medium theme-text-primary">{seg.name}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold theme-text-primary font-mono">{seg.value}</span>
                  <span className="text-sm theme-text-muted font-mono">{seg.pct}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MarginsSlide({ isActive }: SlideProps) {
  return (
    <div className="absolute inset-0 flex flex-col p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-emerald-500/5" />

      <div className="relative z-10 flex-1 flex flex-col">
        <h2 className="text-2xl font-bold theme-text-primary mb-1">Profitability Analysis</h2>
        <p className="text-sm theme-text-muted mb-4">Margin Performance FY 2024E</p>

        <div className="flex-1 theme-bg-tertiary rounded-lg border theme-border p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={marginData} layout="vertical">
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: 'var(--text-primary)' }}
                width={60}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {marginData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Gross Margin', value: '65.0%', color: 'text-emerald-500' },
            { label: 'EBITDA Margin', value: '30.0%', color: 'text-blue-500' },
            { label: 'Net Margin', value: '18.0%', color: 'text-purple-500' },
          ].map((m, index) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 10 }}
              animate={isActive ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="text-center p-2 theme-bg-tertiary rounded-lg border theme-border"
            >
              <p className="text-xs theme-text-muted">{m.label}</p>
              <p className={`text-lg font-bold font-mono ${m.color}`}>{m.value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GuidanceSlide({ isActive }: SlideProps) {
  return (
    <div className="absolute inset-0 flex flex-col p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5" />

      <div className="relative z-10 flex-1 flex flex-col">
        <h2 className="text-2xl font-bold theme-text-primary mb-1">Forward Guidance</h2>
        <p className="text-sm theme-text-muted mb-4">FY 2025-2026 Outlook</p>

        <div className="flex-1 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { year: '2025E', revenue: '$1.73B', growth: '+20%' },
              { year: '2026E', revenue: '$2.07B', growth: '+20%' },
            ].map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={isActive ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="theme-bg-tertiary rounded-lg p-4 border theme-border"
              >
                <p className="text-sm font-medium text-blue-500 mb-2">{item.year}</p>
                <p className="text-2xl font-bold theme-text-primary font-mono">{item.revenue}</p>
                <p className="text-sm text-emerald-500 font-mono">{item.growth} YoY</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isActive ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
            className="flex-1 theme-bg-tertiary rounded-lg p-4 border theme-border"
          >
            <h3 className="text-sm font-semibold theme-text-primary mb-3">Strategic Priorities</h3>
            <ul className="space-y-2 text-sm theme-text-secondary">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                Expand product portfolio with AI-native features
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                Increase enterprise market penetration
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                Optimize operating costs through automation
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Map slide types to their components
const slideComponentMap: Record<SlideData['type'], React.ComponentType<SlideProps>> = {
  executive: ExecutiveSummarySlide,
  revenue: RevenueSlide,
  segment: SegmentSlide,
  margins: MarginsSlide,
  guidance: GuidanceSlide,
  custom: ExecutiveSummarySlide, // fallback for custom slides
};

// Initial slides data
const initialSlidesData: SlideData[] = [
  { id: 'slide-1', title: 'Executive Summary', order: 0, type: 'executive' },
  { id: 'slide-2', title: 'Revenue Analysis', order: 1, type: 'revenue' },
  { id: 'slide-3', title: 'Revenue by Segment', order: 2, type: 'segment' },
  { id: 'slide-4', title: 'Profitability', order: 3, type: 'margins' },
  { id: 'slide-5', title: 'Forward Guidance', order: 4, type: 'guidance' },
];

// Slideshow/Presentation Mode Component
interface SlideshowModeProps {
  slides: SlideData[];
  initialSlideIndex: number;
  onExit: () => void;
}

function SlideshowMode({ slides, initialSlideIndex, onExit }: SlideshowModeProps) {
  const [currentIndex, setCurrentIndex] = useState(initialSlideIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentSlideData = slides[currentIndex];
  const SlideComponent = currentSlideData ? slideComponentMap[currentSlideData.type] : null;

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-play
  useEffect(() => {
    if (isPlaying) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % slides.length);
      }, 5000); // 5 seconds per slide
    } else {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    }

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPlaying, slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'Enter':
          e.preventDefault();
          setCurrentIndex(prev => (prev + 1) % slides.length);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);
          break;
        case 'Escape':
          e.preventDefault();
          onExit();
          break;
        case 'Home':
          e.preventDefault();
          setCurrentIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setCurrentIndex(slides.length - 1);
          break;
        case 'p':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, onExit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Slide Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-6xl aspect-[16/9] bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden relative">
          {/* Logo */}
          <div className="absolute top-6 end-6 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center z-20">
            <span className="text-white font-bold text-sm">FA</span>
          </div>

          {/* Slide number */}
          <div className="absolute bottom-6 end-6 text-sm text-slate-400 font-mono z-20">
            {currentIndex + 1} / {slides.length}
          </div>

          {/* Slide Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlideData?.id || 'empty'}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
            >
              {SlideComponent && <SlideComponent isActive={true} />}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows (visible on hover) */}
          <button
            type="button"
            onClick={() => setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length)}
            className="absolute start-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors z-20 opacity-0 hover:opacity-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex(prev => (prev + 1) % slides.length)}
            className="absolute end-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors z-20 opacity-0 hover:opacity-100"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-6">
        {/* Left: Slide Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentIndex(0)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="First slide (Home)"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Previous slide (←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-mono text-sm min-w-[60px] text-center">
            {currentIndex + 1} / {slides.length}
          </span>
          <button
            type="button"
            onClick={() => setCurrentIndex(prev => (prev + 1) % slides.length)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Next slide (→ or Space)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex(slides.length - 1)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Last slide (End)"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Play/Pause & Timer */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsPlaying(prev => !prev)}
            className={`p-2 rounded-lg transition-colors ${
              isPlaying ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title={isPlaying ? 'Pause auto-play (P)' : 'Start auto-play (P)'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 text-slate-400">
            <Timer className="w-4 h-4" />
            <span className="font-mono text-sm">{formatTime(elapsedTime)}</span>
          </div>
        </div>

        {/* Right: Exit */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Press ESC to exit</span>
          <button
            type="button"
            onClick={onExit}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Exit presentation (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-800">
        <motion.div
          className="h-full bg-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
}

export function PPTPreview() {
  const { t } = useTranslation();
  const {
    slides,
    setSlides,
    currentSlideIndex,
    setCurrentSlide,
    addSlide,
    deleteSlide,
    duplicateSlide,
  } = useApp();

  const { exportToPPTX, isExporting, exportProgress } = usePPTXExport();
  const [isLayoutEditMode, setIsLayoutEditMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSlideshowMode, setIsSlideshowMode] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize slides on mount
  useEffect(() => {
    if (slides.length === 0) {
      setSlides(initialSlidesData);
    }
  }, [slides.length, setSlides]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const currentSlideData = slides[currentSlideIndex] || slides[0];
  const SlideComponent = currentSlideData ? slideComponentMap[currentSlideData.type] : null;

  const nextSlide = () => setCurrentSlide((currentSlideIndex + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((currentSlideIndex - 1 + slides.length) % slides.length);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'Escape' && isFullscreen) toggleFullscreen();
  };

  const handleReorder = (newOrder: SlideData[]) => {
    const updatedSlides = newOrder.map((slide, index) => ({
      ...slide,
      order: index,
    }));
    setSlides(updatedSlides);
  };

  const handleAddSlide = () => {
    addSlide(currentSlideIndex);
  };

  const handleDuplicateSlide = (slideId: string) => {
    duplicateSlide(slideId);
  };

  const handleDeleteSlide = (slideId: string) => {
    if (slides.length > 1) {
      deleteSlide(slideId);
    }
  };

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  const handleExportPPTX = async () => {
    setExportStatus('idle');
    const success = await exportToPPTX(slides, 'Financial_Presentation');
    setExportStatus(success ? 'success' : 'error');

    // Reset status after 3 seconds
    setTimeout(() => setExportStatus('idle'), 3000);
  };

  const handleRunPresentation = () => {
    setIsSlideshowMode(true);
  };

  if (slides.length === 0) {
    return (
      <div className="h-full flex items-center justify-center theme-bg-secondary">
        <p className="theme-text-muted">Loading slides...</p>
      </div>
    );
  }

  // Slideshow mode
  if (isSlideshowMode) {
    return (
      <SlideshowMode
        slides={slides}
        initialSlideIndex={currentSlideIndex}
        onExit={() => setIsSlideshowMode(false)}
      />
    );
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`h-full flex flex-col ${isFullscreen ? 'bg-black' : ''}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b theme-border ${isFullscreen ? 'bg-slate-900' : 'theme-bg-secondary'}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
            <Presentation className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${isFullscreen ? 'text-white' : 'theme-text-primary'}`}>
              {t('presentation.title')}
            </h3>
            <p className={`text-xs ${isFullscreen ? 'text-slate-400' : 'theme-text-muted'}`}>
              {t('presentation.slideCount', { count: slides.length })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Edit Layout Toggle */}
          <button
            type="button"
            onClick={() => setIsLayoutEditMode(!isLayoutEditMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isLayoutEditMode
                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                : 'theme-text-secondary theme-bg-hover'
            }`}
            title={isLayoutEditMode ? t('presentation.exitEdit') : t('presentation.editLayout')}
          >
            {isLayoutEditMode ? (
              <>
                <MousePointer2 className="w-3.5 h-3.5" />
                {t('presentation.exitEdit')}
              </>
            ) : (
              <>
                <Move className="w-3.5 h-3.5" />
                {t('presentation.editLayout')}
              </>
            )}
          </button>

          {/* Run Presentation */}
          <button
            type="button"
            onClick={handleRunPresentation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors"
            title={t('presentation.present')}
          >
            <Play className="w-3.5 h-3.5" />
            {t('presentation.present')}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 theme-text-secondary theme-bg-hover rounded-lg transition-colors"
            title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Export PPTX */}
          <button
            type="button"
            onClick={handleExportPPTX}
            disabled={isExporting}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              exportStatus === 'success'
                ? 'bg-emerald-500 text-white'
                : exportStatus === 'error'
                ? 'bg-red-500 text-white'
                : 'text-white bg-blue-600 hover:bg-blue-500'
            } ${isExporting ? 'opacity-75' : ''}`}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {t('presentation.exporting', { progress: Math.round(exportProgress) })}
              </>
            ) : exportStatus === 'success' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                {t('presentation.downloaded')}
              </>
            ) : exportStatus === 'error' ? (
              <>
                <X className="w-3.5 h-3.5" />
                {t('presentation.failed')}
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                {t('presentation.exportPPTX')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide Sidebar */}
        {!isFullscreen && (
          <div className="w-52 flex-shrink-0 border-e theme-border theme-bg-secondary flex flex-col">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b theme-border">
              <span className="text-xs font-medium theme-text-muted uppercase tracking-wider">{t('presentation.slides')}</span>
              <button
                type="button"
                onClick={handleAddSlide}
                className="p-1.5 theme-text-secondary theme-bg-hover rounded-lg transition-colors"
                title={t('presentation.addSlide')}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Slide Thumbnails - Reorderable */}
            <div className="flex-1 overflow-y-auto p-2">
              <Reorder.Group
                axis="y"
                values={slides}
                onReorder={handleReorder}
                className="space-y-2"
              >
                {slides.map((slide, index) => (
                  <Reorder.Item
                    key={slide.id}
                    value={slide}
                    className="group"
                  >
                    <div
                      onClick={() => setCurrentSlide(index)}
                      className={`relative rounded-lg border-2 transition-all overflow-hidden cursor-pointer ${
                        index === currentSlideIndex
                          ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                          : 'theme-border hover:border-blue-500/50'
                      }`}
                    >
                      {/* Drag Handle */}
                      <div className="absolute start-1 top-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10">
                        <GripVertical className="w-3 h-3 theme-text-muted" />
                      </div>

                      {/* Thumbnail Content */}
                      <div className="aspect-[16/9] theme-bg-tertiary flex flex-col items-center justify-center p-2">
                        <span className="text-[10px] font-medium theme-text-primary text-center line-clamp-2">
                          {slide.title}
                        </span>
                        <span className="text-[9px] theme-text-muted mt-0.5">{index + 1}</span>
                      </div>

                      {/* Slide Actions */}
                      <div className="absolute end-1 top-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateSlide(slide.id);
                          }}
                          className="p-1 rounded theme-bg-secondary/80 backdrop-blur theme-text-secondary hover:text-blue-500 transition-colors"
                          title="Duplicate slide"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {slides.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSlide(slide.id);
                            }}
                            className="p-1 rounded theme-bg-secondary/80 backdrop-blur theme-text-secondary hover:text-red-500 transition-colors"
                            title="Delete slide"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>

            {/* Sidebar Footer */}
            <div className="px-3 py-2 border-t theme-border">
              <p className="text-[10px] theme-text-muted text-center">
                {t('presentation.dragToReorder')}
              </p>
            </div>
          </div>
        )}

        {/* Slide Preview Area */}
        <div className={`flex-1 flex items-center justify-center p-6 overflow-hidden ${isFullscreen ? 'bg-black' : 'theme-bg-primary'}`}>
          <div className={`w-full ${isFullscreen ? 'max-w-6xl' : 'max-w-4xl'} aspect-[16/9] theme-bg-secondary rounded-xl border theme-border shadow-2xl overflow-hidden relative`}>
            {/* Logo */}
            <div className="absolute top-4 end-4 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center z-20">
              <span className="text-white font-bold text-xs">FA</span>
            </div>

            {/* Slide number */}
            <div className="absolute bottom-4 end-4 text-xs theme-text-muted font-mono z-20">
              {currentSlideIndex + 1} / {slides.length}
            </div>

            {/* Slide Content */}
            {isLayoutEditMode ? (
              <SlideCanvas
                isEditMode={isLayoutEditMode}
                slideType={currentSlideData?.type || 'executive'}
              />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlideData?.id || 'empty'}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  {SlideComponent && <SlideComponent isActive={true} />}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Navigation Arrows */}
            <button
              type="button"
              onClick={prevSlide}
              className="absolute start-2 top-1/2 -translate-y-1/2 p-2 rounded-full theme-bg-tertiary/80 backdrop-blur theme-text-secondary hover:theme-text-primary transition-colors z-20"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="absolute end-2 top-1/2 -translate-y-1/2 p-2 rounded-full theme-bg-tertiary/80 backdrop-blur theme-text-secondary hover:theme-text-primary transition-colors z-20"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help (shown in edit mode) */}
      {isLayoutEditMode && (
        <div className="px-4 py-2 border-t theme-border theme-bg-secondary">
          <div className="flex items-center justify-center gap-6 text-xs theme-text-muted">
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">Drag</kbd> {t('presentation.dragToMove')}</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">Double-click</kbd> {t('presentation.doubleClickToEdit')}</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">Delete</kbd> {t('presentation.deleteToRemove')}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
