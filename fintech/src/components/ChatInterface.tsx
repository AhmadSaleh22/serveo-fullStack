import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Send, Sparkles, RotateCcw } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import type { ChatMessage as ChatMessageType } from '../types/financial';
import { sampleMetrics, sampleCitations } from '../data/mockData';
import { useWebSocket, generateMockResponse } from '../hooks/useWebSocket';

export function ChatInterface() {
  const { t } = useTranslation();

  const getInitialMessages = useCallback((): ChatMessageType[] => [
    {
      id: '1',
      role: 'assistant',
      content: t('chat.welcomeMessage'),
      timestamp: new Date(Date.now() - 300000),
      metrics: [],
    },
  ], [t]);

  const [messages, setMessages] = useState<ChatMessageType[]>(() => getInitialMessages());
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  const { streamText } = useWebSocket({
    baseDelay: 40,
    punctuationDelay: 120,
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Update streaming message content
  const updateStreamingMessage = useCallback((messageId: string, content: string, isComplete: boolean) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              streamedContent: content,
              isStreaming: !isComplete,
              isLoading: false,
              content: isComplete ? content : msg.content,
            }
          : msg
      )
    );
    scrollToBottom();
  }, [scrollToBottom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userQuery = inputValue.trim();
    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: userQuery,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Create streaming message placeholder
    const streamingMessageId = (Date.now() + 1).toString();
    streamingMessageIdRef.current = streamingMessageId;

    const streamingMessage: ChatMessageType = {
      id: streamingMessageId,
      role: 'assistant',
      content: '',
      streamedContent: '',
      timestamp: new Date(),
      isLoading: true,
      isStreaming: false,
    };

    setMessages((prev) => [...prev, streamingMessage]);

    // Small delay before starting stream (simulates thinking)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Generate response based on user query
    const fullResponse = generateMockResponse(userQuery);

    // Start streaming the response word by word
    await streamText(fullResponse, (currentText, isComplete) => {
      updateStreamingMessage(streamingMessageId, currentText, isComplete);
    });

    // Add metrics and citations after streaming completes
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === streamingMessageId
          ? {
              ...msg,
              metrics: sampleMetrics.slice(0, 3),
              citations: sampleCitations.slice(0, 2),
              isStreaming: false,
              isLoading: false,
            }
          : msg
      )
    );

    streamingMessageIdRef.current = null;
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const handleReset = () => {
    setMessages(getInitialMessages());
    setInputValue('');
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full theme-bg-secondary transition-colors">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b theme-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold theme-text-primary">{t('chat.title')}</h2>
              <p className="text-xs theme-text-muted">{t('chat.subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="p-2 theme-text-secondary theme-bg-hover rounded-lg transition-colors"
            title={t('chat.resetConversation')}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t theme-border">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder')}
            className="w-full px-4 py-3 pe-12 theme-bg-tertiary border theme-border rounded-xl
              text-sm theme-text-primary placeholder:theme-text-muted
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
              resize-none min-h-[48px] max-h-[120px] transition-colors"
            rows={1}
            disabled={isTyping}
          />
          <motion.button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="absolute end-2 bottom-2 p-2 rounded-lg
              bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
              text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>
        <p className="text-xs theme-text-muted mt-2 text-center">
          {t('chat.helpText')}
        </p>
      </div>
    </div>
  );
}
