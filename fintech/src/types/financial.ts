export interface FinancialMetric {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  change?: number;
  unit?: 'currency' | 'percentage' | 'ratio' | 'multiple';
}

export interface FinancialRowData {
  id: string;
  label: string;
  isHeader?: boolean;
  isSubtotal?: boolean;
  isBold?: boolean;
  indent?: number;
  values: {
    [year: string]: number | null;
  };
  growth?: {
    [year: string]: number | null;
  };
  citations?: string[]; // Citation IDs for this row
}

export interface FinancialSection {
  id: string;
  title: string;
  rows: FinancialRowData[];
  isCollapsible?: boolean;
}

// Source Citation Types
export interface SourceCitation {
  id: string;
  documentName: string;
  pageNumber?: number;
  date: string;
  excerpt: string;
  url?: string;
  type: 'annual_report' | 'sec_filing' | 'earnings_call' | 'analyst_report' | 'internal';
}

// Cell Override Types for Edit Mode
export interface CellOverride {
  rowId: string;
  year: string;
  originalValue: number | null;
  overrideValue: number;
  timestamp: Date;
  userId?: string;
}

// Chart Filter Types for Drill-Down
export interface ChartFilter {
  type: 'year' | 'scenario' | 'segment';
  value: string;
  source: 'chart-click' | 'manual';
}

// Slide Builder Types
export interface SlideData {
  id: string;
  title: string;
  order: number;
  type: 'executive' | 'revenue' | 'segment' | 'margins' | 'guidance' | 'custom';
  elements?: SlideElement[];
}

export interface SlideElement {
  id: string;
  type: 'chart' | 'text' | 'kpi' | 'table';
  position: { x: number; y: number };
  size: { width: number; height: number };
  data?: unknown;
}

// WebSocket Simulation Types
export interface WebSocketMessage {
  id: string;
  type: 'chunk' | 'complete' | 'error';
  content: string;
  timestamp: number;
}

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketState {
  status: WebSocketStatus;
  lastMessageTime: number | null;
}

// Enhanced ChatMessage with streaming and citations
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metrics?: FinancialMetric[];
  citations?: SourceCitation[];
  isLoading?: boolean;
  isStreaming?: boolean;
  streamedContent?: string;
}

export interface SensitivityDataPoint {
  label: string;
  base: number;
  bull: number;
  bear: number;
}

export type Direction = 'ltr' | 'rtl';
export type Theme = 'light' | 'dark';
export type WorkspaceTab = 'grid' | 'chart' | 'ppt';

// Scenario Comparison Types
export type ScenarioType = 'base' | 'user' | 'bull' | 'bear';

export interface ScenarioData {
  id: string;
  name: string;
  type: ScenarioType;
  description: string;
  values: {
    [rowId: string]: {
      [year: string]: number | null;
    };
  };
  createdAt: Date;
  isAIGenerated: boolean;
}

// Audit Trail Types
export type AuditActionType =
  | 'ai_generated'
  | 'user_override'
  | 'system_recalculated'
  | 'imported'
  | 'formula_updated';

export interface AuditEntry {
  id: string;
  rowId: string;
  year: string;
  action: AuditActionType;
  previousValue: number | null;
  newValue: number | null;
  timestamp: Date;
  userId?: string;
  userName?: string;
  source?: string;
  note?: string;
}

export interface CellAuditHistory {
  cellKey: string; // Format: rowId-year
  entries: AuditEntry[];
}

// Data Status Types
export type DataStatus = 'draft' | 'ai_generated' | 'verified' | 'user_modified';

export interface CellMetadata {
  cellKey: string;
  status: DataStatus;
  citationIds?: string[];
  lastModified?: Date;
  modifiedBy?: string;
}

// Inline Chart Data for Chat
export interface SparklineData {
  values: number[];
  labels?: string[];
  type: 'line' | 'bar' | 'area';
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}
