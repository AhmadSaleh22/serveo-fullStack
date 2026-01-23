import { useState } from 'react';
import { useStartup } from '../context/StartupContext';
import {
  ArrowLeft,
  Download,
  Play,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
  Grid3X3,
} from 'lucide-react';
import { formatCurrency } from '../utils/financialCalculations';
import pptxgen from 'pptxgenjs';
import type { PitchSlide } from '../types/startup';

export function PitchDeckView() {
  const { currentProject, setActiveView } = useStartup();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');

  const deck = currentProject?.pitchDeck;

  if (!deck) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">No pitch deck generated yet</p>
          <button
            onClick={() => setActiveView('wizard')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Go to Wizard
          </button>
        </div>
      </div>
    );
  }

  const exportToPPTX = async () => {
    setExporting(true);

    try {
      const pptx = new pptxgen();
      pptx.title = currentProject?.profile.name || 'Pitch Deck';
      pptx.author = 'StartupKit';
      pptx.layout = 'LAYOUT_16x9';

      // Define master slide style
      pptx.defineSlideMaster({
        title: 'STARTUP_MASTER',
        background: { color: '18181B' },
        objects: [
          { rect: { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '18181B' } } },
        ],
      });

      deck.slides.forEach((slide) => {
        const pptxSlide = pptx.addSlide({ masterName: 'STARTUP_MASTER' });

        // Title
        pptxSlide.addText(slide.title, {
          x: 0.5,
          y: 0.5,
          w: '90%',
          h: 0.8,
          fontSize: 36,
          bold: true,
          color: 'FFFFFF',
        });

        // Headline
        if (slide.content.headline) {
          pptxSlide.addText(slide.content.headline, {
            x: 0.5,
            y: 1.5,
            w: '90%',
            h: 0.6,
            fontSize: 24,
            color: 'A5B4FC',
          });
        }

        // Bullets
        if (slide.content.bullets && slide.content.bullets.length > 0) {
          const bulletText = slide.content.bullets.map((b) => ({
            text: b,
            options: { bullet: true, color: 'D1D5DB', fontSize: 18 },
          }));
          pptxSlide.addText(bulletText, {
            x: 0.5,
            y: 2.3,
            w: '90%',
            h: 3,
            valign: 'top',
          });
        }

        // Stats
        if (slide.content.stats && slide.content.stats.length > 0) {
          const startY = slide.content.bullets ? 4.5 : 2.3;
          slide.content.stats.forEach((stat, index) => {
            const x = 0.5 + (index % 3) * 3;
            const y = startY + Math.floor(index / 3) * 1.2;

            pptxSlide.addText(stat.value, {
              x,
              y,
              w: 2.8,
              h: 0.5,
              fontSize: 28,
              bold: true,
              color: '818CF8',
            });
            pptxSlide.addText(stat.label, {
              x,
              y: y + 0.5,
              w: 2.8,
              h: 0.3,
              fontSize: 14,
              color: '9CA3AF',
            });
          });
        }

        // Add notes
        if (slide.notes) {
          pptxSlide.addNotes(slide.notes);
        }
      });

      await pptx.writeFile({ fileName: `${currentProject?.profile.name}_Pitch_Deck.pptx` });
    } catch (error) {
      console.error('Export failed:', error);
    }

    setExporting(false);
  };

  const nextSlide = () => {
    if (currentSlide < deck.slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const slide = deck.slides[currentSlide];

  // Presentation mode
  if (isPresenting) {
    return (
      <div
        className="fixed inset-0 bg-zinc-900 z-50 flex items-center justify-center"
        onClick={nextSlide}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
          if (e.key === 'ArrowLeft') prevSlide();
          if (e.key === 'Escape') setIsPresenting(false);
        }}
        tabIndex={0}
      >
        <SlideContent slide={slide} isPresenting />

        {/* Navigation hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-zinc-500 text-sm">
          {currentSlide + 1} / {deck.slides.length} • Press ESC to exit
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPresenting(false);
          }}
          className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveView('home')}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-lg">{currentProject?.profile.name}</h1>
              <p className="text-xs text-zinc-500">Pitch Deck • {deck.slides.length} slides</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('financial')}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              View Financial Model
            </button>

            <div className="flex border border-zinc-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('single')}
                className={`p-2 ${viewMode === 'single' ? 'bg-zinc-700' : 'hover:bg-zinc-800'}`}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-zinc-700' : 'hover:bg-zinc-800'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setIsPresenting(true)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4" />
              Present
            </button>

            <button
              onClick={exportToPPTX}
              disabled={exporting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export PPTX
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {viewMode === 'single' ? (
          <div className="flex gap-6">
            {/* Slide thumbnails */}
            <div className="w-48 flex-shrink-0 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              {deck.slides.map((s, index) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-full aspect-video rounded-lg border-2 transition-all p-2 text-left ${
                    currentSlide === index
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
                  }`}
                >
                  <p className="text-[8px] font-medium truncate">{s.title}</p>
                  <p className="text-[6px] text-zinc-500">{index + 1}</p>
                </button>
              ))}
            </div>

            {/* Main slide */}
            <div className="flex-1">
              <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                <div className="aspect-video p-8">
                  <SlideContent slide={slide} />
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <span className="text-sm text-zinc-400">
                  {currentSlide + 1} / {deck.slides.length}
                </span>

                <button
                  onClick={nextSlide}
                  disabled={currentSlide === deck.slides.length - 1}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Speaker notes */}
              {slide.notes && (
                <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <h4 className="text-xs font-medium text-zinc-400 mb-2">Speaker Notes</h4>
                  <p className="text-sm text-zinc-300">{slide.notes}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Grid view
          <div className="grid grid-cols-4 gap-4">
            {deck.slides.map((s, index) => (
              <button
                key={s.id}
                onClick={() => {
                  setCurrentSlide(index);
                  setViewMode('single');
                }}
                className="bg-zinc-900 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-all overflow-hidden"
              >
                <div className="aspect-video p-4">
                  <SlideContent slide={s} isThumbnail />
                </div>
                <div className="px-4 py-2 border-t border-zinc-800">
                  <p className="text-xs font-medium truncate">{s.title}</p>
                  <p className="text-[10px] text-zinc-500">Slide {index + 1}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Slide content renderer
function SlideContent({
  slide,
  isPresenting = false,
  isThumbnail = false,
}: {
  slide: PitchSlide;
  isPresenting?: boolean;
  isThumbnail?: boolean;
}) {
  const scale = isThumbnail ? 0.3 : isPresenting ? 1.2 : 1;

  return (
    <div className={`h-full flex flex-col ${isPresenting ? 'max-w-4xl mx-auto' : ''}`}>
      {/* Title */}
      <h2
        className={`font-bold text-white mb-4 ${
          isThumbnail ? 'text-xs' : isPresenting ? 'text-5xl' : 'text-3xl'
        }`}
      >
        {slide.title}
      </h2>

      {/* Headline */}
      {slide.content.headline && (
        <p
          className={`text-indigo-300 mb-6 ${
            isThumbnail ? 'text-[8px]' : isPresenting ? 'text-2xl' : 'text-xl'
          }`}
        >
          {slide.content.headline}
        </p>
      )}

      {/* Stats */}
      {slide.content.stats && slide.content.stats.length > 0 && (
        <div className={`grid ${slide.content.stats.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'} gap-4 mb-6`}>
          {slide.content.stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p
                className={`font-bold text-indigo-400 ${
                  isThumbnail ? 'text-[8px]' : isPresenting ? 'text-3xl' : 'text-2xl'
                }`}
              >
                {stat.value}
              </p>
              <p
                className={`text-zinc-400 ${
                  isThumbnail ? 'text-[6px]' : isPresenting ? 'text-base' : 'text-sm'
                }`}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Bullets */}
      {slide.content.bullets && slide.content.bullets.length > 0 && (
        <ul className={`space-y-2 ${isThumbnail ? 'text-[6px]' : isPresenting ? 'text-xl' : 'text-base'}`}>
          {slide.content.bullets.map((bullet, index) => (
            <li key={index} className="text-zinc-300 flex items-start gap-2">
              <span className="text-indigo-400">•</span>
              {bullet}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
