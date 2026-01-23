import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DraggableElement } from './DraggableElement';
import {
  DollarSign,
  PieChart,
  BarChart3,
  Type,
  Image,
  Shapes,
  Trash2,
  Plus,
  Check,
  X,
  Edit3,
} from 'lucide-react';

interface SlideElement {
  id: string;
  type: 'text' | 'chart' | 'kpi' | 'image' | 'shape';
  content: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  style?: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
  };
}

interface SlideCanvasProps {
  isEditMode: boolean;
  slideType: string;
}

// Get initial elements based on slide type
const getInitialElements = (slideType: string): SlideElement[] => {
  const baseElements: SlideElement[] = [
    {
      id: 'title-1',
      type: 'text',
      position: { x: 32, y: 32 },
      content: slideType === 'executive' ? 'Executive Summary' :
               slideType === 'revenue' ? 'Revenue Analysis' :
               slideType === 'segment' ? 'Revenue by Segment' :
               slideType === 'margins' ? 'Profitability Analysis' :
               slideType === 'guidance' ? 'Forward Guidance' : 'Slide Title',
      style: { fontSize: 24, fontWeight: 'bold' },
    },
    {
      id: 'subtitle-1',
      type: 'text',
      position: { x: 32, y: 70 },
      content: 'FY 2024 Financial Performance Review',
      style: { fontSize: 14, color: '#6B7280' },
    },
  ];

  // Add type-specific elements
  if (slideType === 'executive') {
    return [
      ...baseElements,
      {
        id: 'kpi-1',
        type: 'kpi',
        position: { x: 32, y: 120 },
        content: JSON.stringify({ label: 'Revenue', value: '$1.44B', change: '+20%' }),
      },
      {
        id: 'kpi-2',
        type: 'kpi',
        position: { x: 200, y: 120 },
        content: JSON.stringify({ label: 'EBITDA', value: '$432M', change: '+20%' }),
      },
      {
        id: 'kpi-3',
        type: 'kpi',
        position: { x: 32, y: 220 },
        content: JSON.stringify({ label: 'Net Income', value: '$259M', change: '+20%' }),
      },
      {
        id: 'kpi-4',
        type: 'kpi',
        position: { x: 200, y: 220 },
        content: JSON.stringify({ label: 'EPS', value: '$2.59', change: '+20%' }),
      },
    ];
  }

  if (slideType === 'revenue' || slideType === 'margins') {
    return [
      ...baseElements,
      {
        id: 'chart-1',
        type: 'chart',
        position: { x: 32, y: 120 },
        content: slideType === 'revenue' ? 'Revenue Chart' : 'Margins Chart',
        size: { width: 400, height: 200 },
      },
    ];
  }

  return baseElements;
};

// Element palette items
const paletteItems = [
  { type: 'text' as const, icon: Type, label: 'Text' },
  { type: 'chart' as const, icon: BarChart3, label: 'Chart' },
  { type: 'kpi' as const, icon: PieChart, label: 'KPI Card' },
  { type: 'image' as const, icon: Image, label: 'Image' },
  { type: 'shape' as const, icon: Shapes, label: 'Shape' },
];

// Editable Text Component
interface EditableTextProps {
  content: string;
  style?: SlideElement['style'];
  isEditMode: boolean;
  onSave: (content: string) => void;
}

function EditableText({ content, style, isEditMode, onSave }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleDoubleClick = () => {
    if (!isEditMode) return;
    setIsEditing(true);
    setEditValue(content);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="relative">
        <textarea
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="w-full min-w-[200px] px-2 py-1 theme-bg-primary border-2 border-blue-500 rounded focus:outline-none resize-none"
          style={{
            fontSize: style?.fontSize || 14,
            fontWeight: style?.fontWeight || 'normal',
          }}
          rows={Math.max(1, editValue.split('\n').length)}
        />
        <div className="absolute -bottom-8 end-0 flex gap-1">
          <button
            type="button"
            onClick={handleSave}
            className="p-1 bg-emerald-500 text-white rounded"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1 bg-red-500 text-white rounded"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`theme-bg-tertiary rounded-lg p-4 border theme-border min-w-[200px] ${
        isEditMode ? 'cursor-text hover:border-blue-500' : ''
      }`}
    >
      <p
        style={{
          fontSize: style?.fontSize || 14,
          fontWeight: style?.fontWeight || 'normal',
          color: style?.color,
        }}
        className="theme-text-primary whitespace-pre-wrap"
      >
        {content}
      </p>
      {isEditMode && (
        <div className="absolute top-1 end-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit3 className="w-3 h-3 theme-text-muted" />
        </div>
      )}
    </div>
  );
}

// KPI Card Component
interface KPICardProps {
  data: { label: string; value: string; change: string };
  isEditMode: boolean;
  onSave: (data: { label: string; value: string; change: string }) => void;
}

function KPICard({ data, isEditMode, onSave }: KPICardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);

  const handleDoubleClick = () => {
    if (!isEditMode) return;
    setIsEditing(true);
    setEditData(data);
  };

  const handleSave = () => {
    onSave(editData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="theme-bg-tertiary rounded-lg p-4 border-2 border-blue-500 w-40 space-y-2">
        <input
          type="text"
          value={editData.label}
          onChange={(e) => setEditData({ ...editData, label: e.target.value })}
          className="w-full px-2 py-1 text-xs theme-bg-primary border theme-border rounded"
          placeholder="Label"
        />
        <input
          type="text"
          value={editData.value}
          onChange={(e) => setEditData({ ...editData, value: e.target.value })}
          className="w-full px-2 py-1 text-lg font-bold font-mono theme-bg-primary border theme-border rounded"
          placeholder="Value"
        />
        <input
          type="text"
          value={editData.change}
          onChange={(e) => setEditData({ ...editData, change: e.target.value })}
          className="w-full px-2 py-1 text-xs theme-bg-primary border theme-border rounded"
          placeholder="Change"
        />
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 p-1 bg-emerald-500 text-white rounded text-xs"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="flex-1 p-1 bg-red-500 text-white rounded text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`theme-bg-tertiary rounded-lg p-4 border theme-border w-40 ${
        isEditMode ? 'cursor-pointer hover:border-blue-500' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <DollarSign className="w-4 h-4 text-blue-500" />
        </div>
        <span className="text-xs theme-text-muted">{data.label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold theme-text-primary font-mono">{data.value}</span>
        <span className="text-xs text-emerald-500 font-medium">{data.change}</span>
      </div>
    </div>
  );
}

// Chart Placeholder Component
interface ChartPlaceholderProps {
  title: string;
  size?: { width: number; height: number };
}

function ChartPlaceholder({ title, size }: ChartPlaceholderProps) {
  return (
    <div
      className="theme-bg-tertiary rounded-lg p-4 border theme-border flex items-center justify-center"
      style={{
        width: size?.width || 300,
        height: size?.height || 150,
      }}
    >
      <div className="flex items-center gap-2 theme-text-muted">
        <BarChart3 className="w-8 h-8" />
        <span className="text-sm">{title}</span>
      </div>
    </div>
  );
}

export function SlideCanvas({ isEditMode, slideType }: SlideCanvasProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<SlideElement[]>(() => getInitialElements(slideType));
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const handlePositionChange = useCallback((id: string, position: { x: number; y: number }) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, position } : el))
    );
  }, []);

  const handleContentChange = useCallback((id: string, content: string) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, content } : el))
    );
  }, []);

  const handleDeleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedElement(null);
  }, []);

  const handleAddElement = useCallback((type: SlideElement['type']) => {
    const newElement: SlideElement = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 100, y: 300 },
      content: type === 'text' ? 'New Text Element' :
               type === 'kpi' ? JSON.stringify({ label: 'Metric', value: '$0', change: '+0%' }) :
               type === 'chart' ? 'New Chart' :
               type === 'image' ? 'Image Placeholder' :
               'Shape',
      size: type === 'chart' ? { width: 300, height: 150 } : undefined,
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedElement(newElement.id);
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedElement && isEditMode) {
        e.preventDefault();
        handleDeleteElement(selectedElement);
      }
    }
  }, [selectedElement, isEditMode, handleDeleteElement]);

  const renderElement = (element: SlideElement) => {
    const isSelected = selectedElement === element.id;

    switch (element.type) {
      case 'text':
        return (
          <div className="relative group">
            <EditableText
              content={element.content}
              style={element.style}
              isEditMode={isEditMode}
              onSave={(content) => handleContentChange(element.id, content)}
            />
            {isEditMode && isSelected && (
              <button
                type="button"
                onClick={() => handleDeleteElement(element.id)}
                className="absolute -top-2 -end-2 p-1 bg-red-500 text-white rounded-full shadow-lg z-10"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        );

      case 'kpi':
        const kpiData = (() => {
          try {
            return JSON.parse(element.content);
          } catch {
            return { label: 'Metric', value: '$0', change: '+0%' };
          }
        })();
        return (
          <div className="relative group">
            <KPICard
              data={kpiData}
              isEditMode={isEditMode}
              onSave={(data) => handleContentChange(element.id, JSON.stringify(data))}
            />
            {isEditMode && isSelected && (
              <button
                type="button"
                onClick={() => handleDeleteElement(element.id)}
                className="absolute -top-2 -end-2 p-1 bg-red-500 text-white rounded-full shadow-lg z-10"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        );

      case 'chart':
        return (
          <div className="relative group">
            <ChartPlaceholder title={element.content} size={element.size} />
            {isEditMode && isSelected && (
              <button
                type="button"
                onClick={() => handleDeleteElement(element.id)}
                className="absolute -top-2 -end-2 p-1 bg-red-500 text-white rounded-full shadow-lg z-10"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="relative group">
            <div className="theme-bg-tertiary rounded-lg p-8 border border-dashed theme-border flex flex-col items-center justify-center gap-2 w-48 h-32">
              <Image className="w-8 h-8 theme-text-muted" />
              <span className="text-xs theme-text-muted">Drop image here</span>
            </div>
            {isEditMode && isSelected && (
              <button
                type="button"
                onClick={() => handleDeleteElement(element.id)}
                className="absolute -top-2 -end-2 p-1 bg-red-500 text-white rounded-full shadow-lg z-10"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        );

      case 'shape':
        return (
          <div className="relative group">
            <div className="w-24 h-24 bg-blue-500/20 border-2 border-blue-500 rounded-lg" />
            {isEditMode && isSelected && (
              <button
                type="button"
                onClick={() => handleDeleteElement(element.id)}
                className="absolute -top-2 -end-2 p-1 bg-red-500 text-white rounded-full shadow-lg z-10"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="relative w-full h-full"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Canvas Grid Overlay (visible in edit mode) */}
      {isEditMode && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(59, 130, 246, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(59, 130, 246, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
      )}

      {/* Element Palette (visible in edit mode) */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-4 start-4 z-30 theme-bg-secondary rounded-lg border theme-border shadow-lg p-2"
          >
            <p className="text-[10px] theme-text-muted uppercase tracking-wider mb-2 px-1">
              Add Elements
            </p>
            <div className="flex flex-col gap-1">
              {paletteItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleAddElement(item.type)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded theme-bg-hover theme-text-secondary hover:theme-text-primary hover:bg-blue-500/10 transition-colors text-xs"
                    title={`Add ${item.label}`}
                  >
                    <Plus className="w-3 h-3 text-blue-500" />
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas Container */}
      <div
        ref={constraintsRef}
        className="relative w-full h-full overflow-hidden"
        onClick={() => setSelectedElement(null)}
      >
        {/* Slide Elements */}
        {elements.map((element) => (
          <div
            key={element.id}
            className="absolute"
            style={{
              left: 0,
              top: 0,
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isEditMode) {
                setSelectedElement(element.id);
              }
            }}
          >
            <DraggableElement
              id={element.id}
              constraintsRef={constraintsRef}
              isEditMode={isEditMode}
              initialPosition={element.position}
              onPositionChange={handlePositionChange}
            >
              {renderElement(element)}
            </DraggableElement>
          </div>
        ))}
      </div>

      {/* Edit Mode Instructions */}
      {isEditMode && (
        <div className="absolute bottom-4 start-1/2 -translate-x-1/2 z-30">
          <div className="theme-bg-secondary/90 backdrop-blur rounded-lg border theme-border shadow-lg px-4 py-2">
            <p className="text-xs theme-text-muted">
              <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">Drag</kbd> to move •{' '}
              <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">Double-click</kbd> to edit •{' '}
              <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">Delete</kbd> to remove
            </p>
          </div>
        </div>
      )}

      {/* Selected Element Info */}
      {isEditMode && selectedElement && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 end-4 z-30 theme-bg-secondary rounded-lg border theme-border shadow-lg px-3 py-2"
        >
          <p className="text-xs theme-text-muted">
            Selected: <span className="font-mono text-blue-500">{selectedElement}</span>
          </p>
        </motion.div>
      )}
    </div>
  );
}
