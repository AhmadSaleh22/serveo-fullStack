import { useState, useCallback, useRef } from 'react';
import type { WebSocketStatus } from '../types/financial';

interface UseWebSocketOptions {
  baseDelay?: number; // Base delay between words in ms
  punctuationDelay?: number; // Extra delay after punctuation
}

interface StreamController {
  abort: () => void;
  isStreaming: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { baseDelay = 50, punctuationDelay = 150 } = options;

  const [status, setStatus] = useState<WebSocketStatus>('connected');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(false);
  const controllerRef = useRef<StreamController | null>(null);

  // Simulate connection (already connected by default for mock)
  const connect = useCallback(() => {
    setStatus('connecting');
    setTimeout(() => setStatus('connected'), 500);
  }, []);

  const disconnect = useCallback(() => {
    setStatus('disconnected');
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
  }, []);

  // Word-by-word streaming with punctuation-aware delays
  const streamText = useCallback(
    async (
      text: string,
      onWord: (currentText: string, isComplete: boolean) => void
    ): Promise<void> => {
      // Reset abort flag
      abortRef.current = false;
      setIsStreaming(true);

      // Create controller for this stream
      const controller: StreamController = {
        abort: () => {
          abortRef.current = true;
        },
        isStreaming: true,
      };
      controllerRef.current = controller;

      // Split text into words while preserving whitespace
      const words = text.split(/(\s+)/);
      let currentText = '';

      for (let i = 0; i < words.length; i++) {
        if (abortRef.current) {
          setIsStreaming(false);
          return;
        }

        const word = words[i];
        currentText += word;

        // Only callback for non-whitespace words (but include the accumulated text)
        if (word.trim()) {
          onWord(currentText, false);

          // Calculate delay based on punctuation
          let delay = baseDelay;
          if (/[.!?]$/.test(word)) {
            delay += punctuationDelay * 2; // Longer pause after sentences
          } else if (/[,;:]$/.test(word)) {
            delay += punctuationDelay; // Medium pause after commas
          }

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      // Final callback with complete flag
      onWord(currentText, true);
      setIsStreaming(false);
      controllerRef.current = null;
    },
    [baseDelay, punctuationDelay]
  );

  // Abort current stream
  const abortStream = useCallback(() => {
    abortRef.current = true;
    setIsStreaming(false);
  }, []);

  return {
    status,
    isStreaming,
    connect,
    disconnect,
    streamText,
    abortStream,
  };
}

// Simulated AI response generator for demo purposes
export function generateMockResponse(userMessage: string): string {
  const responses: Record<string, string> = {
    default: `Based on my analysis of the financial data, I can provide you with key insights. The company shows strong revenue growth of 20% year-over-year, with EBITDA margins improving to 30%. Net income has increased significantly, driven by operational efficiency gains and cost optimization initiatives. The forward guidance suggests continued momentum with projected revenue of $1.73B for 2025E.`,
    revenue: `Looking at the revenue breakdown, product revenue accounts for 70% of total revenue at $1,008M, while service revenue contributes 30% at $432M. The product segment has shown particularly strong growth due to new product launches and market expansion. Service revenue benefits from recurring subscription models with high retention rates.`,
    margins: `The margin analysis reveals healthy profitability across all levels. Gross margin stands at 65%, reflecting strong pricing power and efficient cost of goods sold management. EBITDA margin of 30% indicates solid operational efficiency, while net margin of 18% demonstrates effective cost control and tax optimization strategies.`,
    forecast: `The financial forecast projects continued growth trajectory. Revenue is expected to reach $1.73B in 2025E and $2.07B in 2026E, representing a 20% CAGR. EBITDA is projected to grow in line with revenue, maintaining the 30% margin. Key growth drivers include market expansion, product innovation, and strategic acquisitions.`,
  };

  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('revenue') || lowerMessage.includes('sales')) {
    return responses.revenue;
  }
  if (lowerMessage.includes('margin') || lowerMessage.includes('profit')) {
    return responses.margins;
  }
  if (lowerMessage.includes('forecast') || lowerMessage.includes('project')) {
    return responses.forecast;
  }

  return responses.default;
}
