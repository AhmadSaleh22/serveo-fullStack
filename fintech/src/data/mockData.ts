import type { FinancialSection, ChatMessage, SensitivityDataPoint, FinancialMetric, SourceCitation } from '../types/financial';

export const financialSections: FinancialSection[] = [
  {
    id: 'revenue',
    title: 'Revenue',
    isCollapsible: true,
    rows: [
      {
        id: 'total-revenue',
        label: 'Total Revenue',
        isHeader: true,
        isBold: true,
        values: { '2023A': 1200, '2024E': 1440, '2025E': 1728, '2026E': 2074 },
        growth: { '2023A': null, '2024E': 20, '2025E': 20, '2026E': 20 },
      },
      {
        id: 'product-revenue',
        label: 'Product Revenue',
        indent: 1,
        values: { '2023A': 840, '2024E': 1008, '2025E': 1210, '2026E': 1452 },
        growth: { '2023A': null, '2024E': 20, '2025E': 20, '2026E': 20 },
      },
      {
        id: 'service-revenue',
        label: 'Service Revenue',
        indent: 1,
        values: { '2023A': 360, '2024E': 432, '2025E': 518, '2026E': 622 },
        growth: { '2023A': null, '2024E': 20, '2025E': 20, '2026E': 20 },
      },
    ],
  },
  {
    id: 'costs',
    title: 'Costs & Expenses',
    isCollapsible: true,
    rows: [
      {
        id: 'cogs',
        label: 'Cost of Goods Sold',
        isHeader: true,
        values: { '2023A': -420, '2024E': -504, '2025E': -605, '2026E': -726 },
        growth: { '2023A': null, '2024E': 20, '2025E': 20, '2026E': 20 },
      },
      {
        id: 'gross-profit',
        label: 'Gross Profit',
        isBold: true,
        isSubtotal: true,
        values: { '2023A': 780, '2024E': 936, '2025E': 1123, '2026E': 1348 },
        growth: { '2023A': null, '2024E': 20, '2025E': 20, '2026E': 20 },
      },
      {
        id: 'gross-margin',
        label: 'Gross Margin %',
        indent: 1,
        values: { '2023A': 65.0, '2024E': 65.0, '2025E': 65.0, '2026E': 65.0 },
      },
      {
        id: 'rd-expense',
        label: 'R&D Expense',
        indent: 1,
        values: { '2023A': -180, '2024E': -216, '2025E': -259, '2026E': -311 },
        growth: { '2023A': null, '2024E': 20, '2025E': 20, '2026E': 20 },
      },
      {
        id: 'sga-expense',
        label: 'SG&A Expense',
        indent: 1,
        values: { '2023A': -240, '2024E': -288, '2025E': -346, '2026E': -415 },
        growth: { '2023A': null, '2024E': 20, '2025E': 20, '2026E': 20 },
      },
    ],
  },
  {
    id: 'ebitda',
    title: 'EBITDA & Operating Income',
    isCollapsible: true,
    rows: [
      {
        id: 'ebitda',
        label: 'EBITDA',
        isHeader: true,
        isBold: true,
        values: { '2023A': 360, '2024E': 432, '2025E': 518, '2026E': 622 },
        growth: { '2023A': null, '2024E': 20, '2025E': 20, '2026E': 20 },
      },
      {
        id: 'ebitda-margin',
        label: 'EBITDA Margin %',
        indent: 1,
        values: { '2023A': 30.0, '2024E': 30.0, '2025E': 30.0, '2026E': 30.0 },
      },
      {
        id: 'da',
        label: 'D&A',
        indent: 1,
        values: { '2023A': -60, '2024E': -72, '2025E': -86, '2026E': -104 },
      },
      {
        id: 'operating-income',
        label: 'Operating Income',
        isBold: true,
        isSubtotal: true,
        values: { '2023A': 300, '2024E': 360, '2025E': 432, '2026E': 518 },
        growth: { '2023A': null, '2024E': 20, '2025E': 20, '2026E': 20 },
      },
      {
        id: 'operating-margin',
        label: 'Operating Margin %',
        indent: 1,
        values: { '2023A': 25.0, '2024E': 25.0, '2025E': 25.0, '2026E': 25.0 },
      },
    ],
  },
  {
    id: 'net-income',
    title: 'Net Income',
    isCollapsible: true,
    rows: [
      {
        id: 'interest-expense',
        label: 'Interest Expense',
        values: { '2023A': -24, '2024E': -29, '2025E': -35, '2026E': -42 },
      },
      {
        id: 'other-income',
        label: 'Other Income/(Expense)',
        values: { '2023A': 12, '2024E': 14, '2025E': 17, '2026E': 21 },
      },
      {
        id: 'pretax-income',
        label: 'Pre-Tax Income',
        isBold: true,
        values: { '2023A': 288, '2024E': 346, '2025E': 415, '2026E': 498 },
        growth: { '2023A': null, '2024E': 20, '2025E': 20, '2026E': 20 },
      },
      {
        id: 'tax-expense',
        label: 'Tax Expense',
        indent: 1,
        values: { '2023A': -72, '2024E': -86, '2025E': -104, '2026E': -124 },
      },
      {
        id: 'net-income',
        label: 'Net Income',
        isHeader: true,
        isBold: true,
        values: { '2023A': 216, '2024E': 259, '2025E': 311, '2026E': 373 },
        growth: { '2023A': null, '2024E': 20, '2025E': 20, '2026E': 20 },
      },
      {
        id: 'net-margin',
        label: 'Net Margin %',
        indent: 1,
        values: { '2023A': 18.0, '2024E': 18.0, '2025E': 18.0, '2026E': 18.0 },
      },
      {
        id: 'eps',
        label: 'EPS (Diluted)',
        indent: 1,
        values: { '2023A': 2.16, '2024E': 2.59, '2025E': 3.11, '2026E': 3.73 },
        growth: { '2023A': null, '2024E': 20, '2025E': 20, '2026E': 20 },
      },
    ],
  },
];

export const sensitivityData: SensitivityDataPoint[] = [
  { label: '2024E', base: 1440, bull: 1584, bear: 1296 },
  { label: '2025E', base: 1728, bull: 1987, bear: 1469 },
  { label: '2026E', base: 2074, bull: 2489, bear: 1659 },
  { label: '2027E', base: 2489, bull: 3112, bear: 1866 },
];

export const sampleMetrics: FinancialMetric[] = [
  { id: 'total-revenue', label: 'Revenue', value: 1200, formattedValue: '$1,200M', unit: 'currency' },
  { id: 'ebitda', label: 'EBITDA', value: 360, formattedValue: '$360M', change: 20, unit: 'currency' },
  { id: 'net-income', label: 'Net Income', value: 216, formattedValue: '$216M', change: 18, unit: 'currency' },
  { id: 'gross-profit', label: 'Gross Profit', value: 780, formattedValue: '$780M', change: 20, unit: 'currency' },
];

export const sampleCitations: SourceCitation[] = [
  {
    id: 'cite-1',
    documentName: 'AAPL Q3 2024 Earnings Report',
    pageNumber: 7,
    date: '2024-08-01',
    excerpt: 'Total net sales increased 5% year-over-year to $85.8 billion, driven primarily by iPhone revenue growth of 8% to $39.3 billion.',
    url: 'https://investor.apple.com/sec-filings',
    type: 'sec_filing',
  },
  {
    id: 'cite-2',
    documentName: 'Goldman Sachs Equity Research - Tech Sector',
    pageNumber: 12,
    date: '2024-09-15',
    excerpt: 'We project continued margin expansion for leading SaaS companies, with EBITDA margins reaching 30-35% by 2026.',
    url: 'https://research.gs.com',
    type: 'analyst_report',
  },
  {
    id: 'cite-3',
    documentName: 'Q3 2024 Earnings Call Transcript',
    date: '2024-08-01',
    excerpt: 'CEO stated: "We are seeing strong momentum in our enterprise segment, with deal sizes increasing 20% quarter-over-quarter."',
    type: 'earnings_call',
  },
  {
    id: 'cite-4',
    documentName: 'Annual Report 2023',
    pageNumber: 45,
    date: '2024-02-28',
    excerpt: 'Operating expenses as a percentage of revenue decreased from 72% to 70%, reflecting improved operational efficiency.',
    type: 'annual_report',
  },
];

export const initialMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Welcome to your Financial AI Co-pilot. I can help you analyze financial statements, build forecasts, and provide insights on company performance. What would you like to explore today?',
    timestamp: new Date(Date.now() - 300000),
    metrics: [],
  },
  {
    id: '2',
    role: 'user',
    content: 'Show me a 3-statement forecast for a SaaS company with $1.2B in revenue.',
    timestamp: new Date(Date.now() - 240000),
  },
  {
    id: '3',
    role: 'assistant',
    content: 'I\'ve built a 3-statement forecast model for a SaaS company. Key highlights:\n\nThe company shows strong fundamentals with $1,200M Revenue in 2023, growing at 20% annually. EBITDA stands at $360M representing a 30% margin, while Net Income of $216M translates to an 18% net margin.\n\nThe forecast assumes:\n- Consistent 20% revenue growth through 2026\n- Stable gross margins at 65%\n- Operating leverage improving slightly\n\nYou can explore the detailed breakdown in the workspace.',
    timestamp: new Date(Date.now() - 180000),
    metrics: sampleMetrics,
  },
];

export const years = ['2023A', '2024E', '2025E', '2026E'];
