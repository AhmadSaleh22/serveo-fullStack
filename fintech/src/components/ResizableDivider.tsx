import { useState, useCallback, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizableDividerProps {
  onResize: (newWidth: number) => void;
  minWidth: number;
  maxWidth: number;
}

export function ResizableDivider({ onResize, minWidth, maxWidth }: ResizableDividerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newWidth = Math.min(maxWidth, Math.max(minWidth, e.clientX));
      onResize(newWidth);
    },
    [isDragging, minWidth, maxWidth, onResize]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`
        relative w-1 flex-shrink-0 cursor-col-resize group
        transition-colors duration-150
        ${isDragging ? 'bg-blue-500' : isHovering ? 'bg-blue-500/50' : 'theme-border bg-[var(--border-color)]'}
      `}
    >
      {/* Wider hit area for easier grabbing */}
      <div className="absolute inset-y-0 -inset-x-1.5 z-10" />

      {/* Visual grip indicator */}
      <div
        className={`
          absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          flex items-center justify-center
          w-4 h-10 rounded-full
          transition-all duration-150
          ${isDragging || isHovering
            ? 'bg-blue-500 opacity-100'
            : 'theme-bg-tertiary opacity-0 group-hover:opacity-100'}
        `}
      >
        <GripVertical className="w-3 h-3 text-white" />
      </div>

      {/* Glow effect when dragging */}
      {isDragging && (
        <div className="absolute inset-y-0 -inset-x-1 bg-blue-500/20 blur-sm" />
      )}
    </div>
  );
}
