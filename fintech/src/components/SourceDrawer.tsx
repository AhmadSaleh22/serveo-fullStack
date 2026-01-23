import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, ExternalLink, Calendar, BookOpen, Mic, BarChart3, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { SourceCitation } from '../types/financial';

// Icon mapping for citation types
const citationTypeIcons: Record<SourceCitation['type'], React.ElementType> = {
  annual_report: BookOpen,
  sec_filing: FileText,
  earnings_call: Mic,
  analyst_report: BarChart3,
  internal: Building2,
};

const citationTypeLabels: Record<SourceCitation['type'], string> = {
  annual_report: 'Annual Report',
  sec_filing: 'SEC Filing',
  earnings_call: 'Earnings Call',
  analyst_report: 'Analyst Report',
  internal: 'Internal Document',
};

export function SourceDrawer() {
  const { activeSourceCitation, closeSourceDrawer, direction } = useApp();
  const isOpen = activeSourceCitation !== null;

  const TypeIcon = activeSourceCitation
    ? citationTypeIcons[activeSourceCitation.type]
    : FileText;

  return (
    <AnimatePresence>
      {isOpen && activeSourceCitation && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={closeSourceDrawer}
          />

          {/* Drawer - slides in from end (right in LTR, left in RTL) */}
          <motion.div
            initial={{ x: direction === 'ltr' ? '100%' : '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction === 'ltr' ? '100%' : '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 bottom-0 w-[380px] max-w-[90vw] theme-bg-secondary border-s theme-border shadow-2xl z-50"
            style={{ [direction === 'ltr' ? 'right' : 'left']: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b theme-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <TypeIcon className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold theme-text-primary">Source Details</h3>
                  <p className="text-xs theme-text-muted">
                    {citationTypeLabels[activeSourceCitation.type]}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeSourceDrawer}
                className="p-2 theme-text-secondary hover:theme-text-primary theme-bg-hover rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
              {/* Document Name */}
              <div className="theme-bg-tertiary rounded-lg p-4 border theme-border">
                <h4 className="text-xs font-medium theme-text-muted mb-2 uppercase tracking-wider">
                  Document
                </h4>
                <p className="text-sm font-medium theme-text-primary">
                  {activeSourceCitation.documentName}
                </p>
                {activeSourceCitation.pageNumber && (
                  <p className="text-xs theme-text-muted mt-1">
                    Page {activeSourceCitation.pageNumber}
                  </p>
                )}
              </div>

              {/* Date */}
              <div className="theme-bg-tertiary rounded-lg p-4 border theme-border">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-3.5 h-3.5 theme-text-muted" />
                  <h4 className="text-xs font-medium theme-text-muted uppercase tracking-wider">
                    Date
                  </h4>
                </div>
                <p className="text-sm theme-text-primary">
                  {new Date(activeSourceCitation.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Excerpt */}
              <div className="theme-bg-tertiary rounded-lg p-4 border theme-border">
                <h4 className="text-xs font-medium theme-text-muted mb-2 uppercase tracking-wider">
                  Relevant Excerpt
                </h4>
                <blockquote className="text-sm theme-text-secondary italic border-s-2 border-blue-500 ps-3">
                  "{activeSourceCitation.excerpt}"
                </blockquote>
              </div>

              {/* Link */}
              {activeSourceCitation.url && (
                <a
                  href={activeSourceCitation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full px-4 py-3 theme-bg-tertiary border theme-border rounded-lg hover:border-blue-500/50 transition-colors group"
                >
                  <span className="text-sm font-medium text-blue-500 group-hover:text-blue-400">
                    View Original Document
                  </span>
                  <ExternalLink className="w-4 h-4 text-blue-500 group-hover:text-blue-400" />
                </a>
              )}

              {/* Citation Type Badge */}
              <div className="pt-4 border-t theme-border">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                      activeSourceCitation.type === 'sec_filing'
                        ? 'bg-purple-500/10 text-purple-500'
                        : activeSourceCitation.type === 'earnings_call'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : activeSourceCitation.type === 'analyst_report'
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-gray-500/10 text-gray-500'
                    }`}
                  >
                    <TypeIcon className="w-3 h-3" />
                    {citationTypeLabels[activeSourceCitation.type]}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
