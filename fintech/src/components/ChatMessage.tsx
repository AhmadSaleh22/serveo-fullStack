import { motion } from 'framer-motion';
import { Bot, User, ArrowRight, FileText, TrendingUp } from 'lucide-react';
import { SmartChip } from './SmartChip';
import { InlineSparkline, TrendIndicator } from './InlineSparkline';
import { useApp } from '../context/AppContext';
import type { ChatMessage as ChatMessageType, SourceCitation, SparklineData } from '../types/financial';

// Sample sparkline data for demo
const sampleSparklines: Record<string, SparklineData> = {
  'total-revenue': {
    values: [1000, 1100, 1200, 1440, 1728],
    labels: ['2022', '2023', '2024', '2025', '2026'],
    type: 'area',
    trend: 'up',
  },
  'gross-profit': {
    values: [650, 715, 780, 936, 1123],
    labels: ['2022', '2023', '2024', '2025', '2026'],
    type: 'line',
    trend: 'up',
  },
  'ebitda': {
    values: [280, 308, 360, 432, 518],
    labels: ['2022', '2023', '2024', '2025', '2026'],
    type: 'area',
    trend: 'up',
  },
  'net-income': {
    values: [180, 198, 216, 259, 311],
    labels: ['2022', '2023', '2024', '2025', '2026'],
    type: 'line',
    trend: 'up',
  },
};

interface ChatMessageProps {
  message: ChatMessageType;
}

// Streaming text component with blinking cursor
function StreamingText({ content, isComplete }: { content: string; isComplete: boolean }) {
  return (
    <span className="text-sm leading-relaxed whitespace-pre-wrap">
      {content}
      {!isComplete && <span className="typing-cursor" />}
    </span>
  );
}

// Citation marker component for inline citations
function CitationMarker({
  index,
  citation,
  onClick
}: {
  index: number;
  citation: SourceCitation;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="citation-marker hover:underline"
      title={citation.documentName}
    >
      [{index}]
    </button>
  );
}

// Parse content and replace citation markers with clickable elements
function ContentWithCitations({
  content,
  citations,
  onCitationClick
}: {
  content: string;
  citations?: SourceCitation[];
  onCitationClick: (citation: SourceCitation) => void;
}) {
  if (!citations || citations.length === 0) {
    return <span>{content}</span>;
  }

  // Split content by citation markers like [1], [2], etc.
  const parts = content.split(/(\[\d+\])/g);

  return (
    <>
      {parts.map((part, idx) => {
        const match = part.match(/\[(\d+)\]/);
        if (match) {
          const citationIndex = parseInt(match[1], 10);
          const citation = citations[citationIndex - 1];
          if (citation) {
            return (
              <CitationMarker
                key={idx}
                index={citationIndex}
                citation={citation}
                onClick={() => onCitationClick(citation)}
              />
            );
          }
        }
        return <span key={idx}>{part}</span>;
      })}
    </>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { triggerDeepDive, openSourceDrawer } = useApp();
  const isAssistant = message.role === 'assistant';

  const handleDeepDive = (metricId: string, metricLabel: string) => {
    triggerDeepDive(metricId, metricLabel);
  };

  const handleCitationClick = (citation: SourceCitation) => {
    openSourceDrawer(citation);
  };

  // Determine content to display (streamed or final)
  const displayContent = message.isStreaming && message.streamedContent
    ? message.streamedContent
    : message.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isAssistant ? 'items-start' : 'items-start flex-row-reverse'}`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
          isAssistant
            ? 'bg-gradient-to-br from-blue-500 to-blue-600'
            : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
        }`}
      >
        {isAssistant ? (
          <Bot className="w-4 h-4 text-white" />
        ) : (
          <User className="w-4 h-4 text-white" />
        )}
      </div>

      <div
        className={`flex-1 max-w-[85%] ${
          isAssistant ? 'text-start' : 'text-end'
        }`}
      >
        <div
          className={`inline-block rounded-2xl px-4 py-3 shadow-sm transition-colors ${
            isAssistant
              ? 'theme-bg-tertiary theme-text-primary rounded-ss-none border theme-border'
              : 'bg-blue-600 text-white rounded-se-none'
          }`}
        >
          {message.isLoading ? (
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm theme-text-muted">Analyzing financial data...</span>
            </div>
          ) : message.isStreaming ? (
            // Streaming state with cursor
            <StreamingText content={displayContent} isComplete={false} />
          ) : (
            // Complete message
            <>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                <ContentWithCitations
                  content={displayContent}
                  citations={message.citations}
                  onCitationClick={handleCitationClick}
                />
              </p>

              {message.metrics && message.metrics.length > 0 && (
                <div className="mt-3 pt-3 border-t theme-border space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs theme-text-muted font-medium">Key Metrics:</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <TrendIndicator value={20} label="YoY" />
                    </div>
                  </div>

                  {/* Metrics with Sparklines */}
                  <div className="space-y-2">
                    {message.metrics.map((metric) => {
                      const sparkline = sampleSparklines[metric.id];
                      return (
                        <div
                          key={metric.id}
                          className="flex items-center justify-between gap-3 p-2 theme-bg-secondary rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <SmartChip metric={metric} />
                          </div>
                          {sparkline && (
                            <InlineSparkline
                              data={sparkline}
                              width={80}
                              height={24}
                              showLabels={false}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Deep Dive Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {message.metrics.slice(0, 2).map((metric) => (
                      <motion.button
                        key={`dive-${metric.id}`}
                        type="button"
                        onClick={() => handleDeepDive(metric.id, metric.label)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                          text-blue-500 bg-blue-500/10 hover:bg-blue-500/20
                          border border-blue-500/30 rounded-lg transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Deep Dive: {metric.label}
                        <ArrowRight className="w-3 h-3" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Citations Summary */}
              {message.citations && message.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t theme-border">
                  <button
                    type="button"
                    onClick={() => message.citations && openSourceDrawer(message.citations[0])}
                    className="flex items-center gap-1.5 text-xs theme-text-muted hover:text-blue-500 transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    {message.citations.length} source{message.citations.length > 1 ? 's' : ''} cited
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-xs theme-text-muted mt-1.5 px-1 font-mono">
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
}
