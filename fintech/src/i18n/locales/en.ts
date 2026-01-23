export const en = {
  // Common
  common: {
    search: 'Search...',
    settings: 'Settings',
    close: 'Close',
    navigate: 'Navigate',
    select: 'Select',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    remove: 'Remove',
    loading: 'Loading...',
    noResults: 'No results found',
  },

  // App
  app: {
    name: 'FinAnalytics',
    switchToRTL: 'Switch to RTL mode',
    switchToLTR: 'Switch to LTR mode',
    switchToDark: 'Switch to dark mode',
    switchToLight: 'Switch to light mode',
  },

  // Chat
  chat: {
    title: 'Financial Co-pilot',
    subtitle: 'AI-powered analysis',
    resetConversation: 'Reset conversation',
    placeholder: 'Ask about financials, forecasts, or metrics...',
    helpText: 'Press Enter to send, Shift+Enter for new line',
    analyzing: 'Analyzing financial data...',
    keyMetrics: 'Key Metrics:',
    yoy: 'YoY',
    deepDive: 'Deep Dive',
    sourcesCited: '{{count}} source cited',
    sourcesCited_plural: '{{count}} sources cited',
    welcomeMessage: 'Welcome to your Financial AI Co-pilot. I can help you analyze financial statements, build forecasts, and provide insights on company performance. What would you like to explore today?',
  },

  // Workspace
  workspace: {
    tabs: {
      dataGrid: 'Data Grid',
      charts: 'Charts',
      presentation: 'Presentation',
    },
    commands: 'Commands',
    revenueBreakdown: 'Revenue Breakdown by Segment',
    pieChartPlaceholder: 'Pie Chart Placeholder',
  },

  // Quick Stats
  stats: {
    revenue: 'Revenue',
    ebitda: 'EBITDA',
    netIncome: 'Net Income',
    eps: 'EPS',
  },

  // Financial Data Grid
  grid: {
    title: '3-Statement Forecast Model',
    valuesInMillions: 'Values in $M',
    doubleClickToEdit: 'Double-click cells to edit',
    hoverForFormulas: 'Hover cells for formulas',
    lineItem: 'Line Item',
    filtered: 'Filtered: {{value}}',
    override: '{{count}} override',
    override_plural: '{{count}} overrides',
    clearAllOverrides: 'Clear all overrides',
    deepDiveLabel: 'Deep Dive: {{label}}',
    comparing: 'Comparing',
    compare: 'Compare',
    editing: 'Editing',
    editMode: 'Edit Mode',
    collapse: 'Collapse',
    expand: 'Expand',
    actual: 'A = Actual',
    estimated: 'E = Estimated',
    aiGenerated: 'AI Generated',
    userModified: 'User Modified',
    verified: 'Verified',
    rightClickForHistory: 'Right-click for history',
    formula: 'Formula',
    components: 'Components:',
    revertToOriginal: 'Revert to original',
    items: '({{count}} items)',
  },

  // Financial Labels
  financial: {
    // Revenue Section
    revenue: 'Revenue',
    totalRevenue: 'Total Revenue',
    productRevenue: 'Product Revenue',
    serviceRevenue: 'Service Revenue',

    // Costs & Expenses
    costsAndExpenses: 'Costs & Expenses',
    costOfGoodsSold: 'Cost of Goods Sold',
    grossProfit: 'Gross Profit',
    grossMargin: 'Gross Margin %',
    rdExpense: 'R&D Expense',
    sgaExpense: 'SG&A Expense',

    // EBITDA & Operating Income
    ebitdaAndOperating: 'EBITDA & Operating Income',
    ebitda: 'EBITDA',
    ebitdaMargin: 'EBITDA Margin %',
    da: 'D&A',
    operatingIncome: 'Operating Income',
    operatingMargin: 'Operating Margin %',

    // Net Income
    netIncomeSection: 'Net Income',
    interestExpense: 'Interest Expense',
    otherIncome: 'Other Income/(Expense)',
    preTaxIncome: 'Pre-Tax Income',
    taxExpense: 'Tax Expense',
    netIncome: 'Net Income',
    netMargin: 'Net Margin %',
    epsDiluted: 'EPS (Diluted)',
  },

  // Formulas
  formulas: {
    grossProfit: 'Revenue - COGS',
    ebitda: 'Gross Profit - R&D - SG&A',
    operatingIncome: 'EBITDA - D&A',
    preTaxIncome: 'Operating Income + Interest + Other',
    netIncome: 'Pre-Tax Income - Taxes',
    grossMargin: '(Gross Profit / Revenue) × 100',
    ebitdaMargin: '(EBITDA / Revenue) × 100',
    operatingMargin: '(Operating Income / Revenue) × 100',
    netMargin: '(Net Income / Revenue) × 100',
  },

  // Formula Components
  formulaComponents: {
    totalRevenue: 'Total Revenue',
    costOfGoodsSold: 'Cost of Goods Sold',
    grossProfit: 'Gross Profit',
    rdExpense: 'R&D Expense',
    sgaExpense: 'SG&A Expense',
    ebitda: 'EBITDA',
    depreciation: 'Depreciation & Amortization',
    operatingIncome: 'Operating Income',
    interestExpense: 'Interest Expense',
    otherIncome: 'Other Income',
    preTaxIncome: 'Pre-Tax Income',
    taxExpense: 'Tax Expense',
    netIncome: 'Net Income',
  },

  // Command Palette
  commands: {
    searchPlaceholder: 'Type a command or search...',
    noCommandsFound: 'No commands found for "{{query}}"',
    generateForecast: '/generate-forecast',
    generateForecastDesc: 'Generate a 5-year financial forecast model',
    addScenario: '/add-scenario',
    addScenarioDesc: 'Add bull/bear case scenario to model',
    analyzeMargins: '/analyze-margins',
    analyzeMarginsDesc: 'Deep dive into margin analysis',
    exportModel: '/export-model',
    exportModelDesc: 'Export financial model to Excel',
    createPresentation: '/create-presentation',
    createPresentationDesc: 'Generate investor presentation deck',
    quickValuation: '/quick-valuation',
    quickValuationDesc: 'Run DCF and comparable analysis',
  },

  // Sensitivity Chart
  sensitivity: {
    title: 'Sensitivity Analysis',
    subtitle: 'Revenue forecast scenarios',
    clickToFilter: 'Click chart to filter grid',
    learnMore: 'Learn more about sensitivity analysis',
    bullCase: 'Bull Case',
    baseCase: 'Base Case',
    bearCase: 'Bear Case',
    bullGrowth: 'Bull: +25% growth',
    baseGrowth: 'Base: +20% growth',
    bearGrowth: 'Bear: +10% growth',
  },

  // Presentation
  presentation: {
    title: 'Investor Presentation',
    slideCount: 'Generated from financial model • {{count}} slides',
    editLayout: 'Edit Layout',
    exitEdit: 'Exit Edit',
    present: 'Present',
    exportPPTX: 'Export PPTX',
    exporting: 'Exporting {{progress}}%',
    downloaded: 'Downloaded!',
    failed: 'Failed',
    slides: 'Slides',
    addSlide: 'Add slide',
    dragToReorder: 'Drag to reorder • Click to edit',
    dragToMove: 'Drag to move elements',
    doubleClickToEdit: 'Double-click to edit text',
    deleteToRemove: 'Delete to remove',

    // Slide Titles
    executiveSummary: 'Executive Summary',
    financialPerformance: 'FY 2024 Financial Performance Review',
    revenueAnalysis: 'Revenue Analysis',
    revenueTrajectory: '4-Year Revenue Trajectory',
    revenueBySegment: 'Revenue by Segment',
    productServiceMix: 'Product vs Service Mix',
    profitabilityAnalysis: 'Profitability Analysis',
    marginPerformance: 'Margin Performance FY 2024E',
    forwardGuidance: 'Forward Guidance',
    outlook: 'FY 2025-2026 Outlook',

    // Slide Content
    fy2024Revenue: '2024E Revenue',
    yoyGrowth: 'YoY Growth',
    cagr3y: 'CAGR (3Y)',
    productRevenue: 'Product Revenue',
    serviceRevenue: 'Service Revenue',
    grossMargin: 'Gross Margin',
    ebitdaMargin: 'EBITDA Margin',
    netMargin: 'Net Margin',
  },

  // Source Drawer
  sources: {
    title: 'Source Details',
    document: 'Document',
    date: 'Date',
    relevantExcerpt: 'Relevant Excerpt',
    viewOriginal: 'View Original Document',
    types: {
      annualReport: 'Annual Report',
      secFiling: 'SEC Filing',
      earningsCall: 'Earnings Call',
      analystReport: 'Analyst Report',
      internalDocument: 'Internal Document',
    },
  },

  // Scenario Comparison
  scenarios: {
    title: 'Scenario Comparison',
    comparing: 'Comparing {{left}} vs {{right}}',
    exitCompare: 'Exit Compare',
    metric: 'Metric',
    aiBaseCase: 'AI Base Case',
    userAdjusted: 'User Adjusted',
    bullCase: 'Bull Case',
    bearCase: 'Bear Case',
    aiBaseCaseDesc: 'AI-generated baseline forecast based on historical trends',
    userAdjustedDesc: 'User-modified scenario with custom assumptions',
    bullCaseDesc: '+25% growth scenario with optimistic assumptions',
    bearCaseDesc: '+10% growth scenario with conservative assumptions',
  },

  // Cell History
  cellHistory: {
    title: 'Cell History',
    changeHistory: 'Change History',
    currentValue: 'Current Value',
    changesRecorded: '{{count}} change recorded',
    changesRecorded_plural: '{{count}} changes recorded',
    actions: {
      aiGenerated: 'AI Generated',
      userOverride: 'User Override',
      systemRecalculated: 'System Recalculated',
      imported: 'Imported',
      formulaUpdated: 'Formula Updated',
    },
  },

  // New Slide
  newSlide: 'New Slide',
};
