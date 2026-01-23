import { motion, useDragControls } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { useRef, useState } from 'react';

interface DraggableElementProps {
  id: string;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  onPositionChange?: (id: string, position: { x: number; y: number }) => void;
  constraintsRef: React.RefObject<HTMLDivElement | null>;
  isEditMode: boolean;
}

export function DraggableElement({
  id,
  children,
  initialPosition = { x: 0, y: 0 },
  onPositionChange,
  constraintsRef,
  isEditMode,
}: DraggableElementProps) {
  const dragControls = useDragControls();
  const [position, setPosition] = useState(initialPosition);
  const elementRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const newPosition = {
      x: position.x + info.offset.x,
      y: position.y + info.offset.y,
    };
    setPosition(newPosition);
    onPositionChange?.(id, newPosition);
  };

  if (!isEditMode) {
    return (
      <div
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={elementRef}
      drag
      dragControls={dragControls}
      dragConstraints={constraintsRef}
      dragElastic={0.1}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      initial={{ x: position.x, y: position.y }}
      animate={{ x: position.x, y: position.y }}
      whileDrag={{ scale: 1.02, zIndex: 50 }}
      className="relative group cursor-move"
    >
      {/* Drag Handle */}
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="absolute -start-6 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 theme-bg-tertiary rounded border theme-border"
      >
        <GripVertical className="w-3 h-3 theme-text-muted" />
      </div>

      {/* Selection Border */}
      <div className="absolute inset-0 border-2 border-dashed border-blue-500/50 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity -m-1" />

      {/* Resize Handles (visual only for mockup) */}
      <div className="absolute -end-1 -bottom-1 w-3 h-3 bg-blue-500 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-se-resize" />
      <div className="absolute -start-1 -bottom-1 w-3 h-3 bg-blue-500 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-sw-resize" />
      <div className="absolute -end-1 -top-1 w-3 h-3 bg-blue-500 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-ne-resize" />
      <div className="absolute -start-1 -top-1 w-3 h-3 bg-blue-500 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-nw-resize" />

      {children}
    </motion.div>
  );
}
