export const ar = {
  // Common
  common: {
    search: 'بحث...',
    settings: 'الإعدادات',
    close: 'إغلاق',
    navigate: 'تنقل',
    select: 'اختيار',
    cancel: 'إلغاء',
    save: 'حفظ',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    remove: 'إزالة',
    loading: 'جاري التحميل...',
    noResults: 'لا توجد نتائج',
  },

  // App
  app: {
    name: 'فين أناليتكس',
    switchToRTL: 'التبديل إلى وضع RTL',
    switchToLTR: 'التبديل إلى وضع LTR',
    switchToDark: 'التبديل إلى الوضع الداكن',
    switchToLight: 'التبديل إلى الوضع الفاتح',
  },

  // Chat
  chat: {
    title: 'المساعد المالي',
    subtitle: 'تحليل مدعوم بالذكاء الاصطناعي',
    resetConversation: 'إعادة تعيين المحادثة',
    placeholder: 'اسأل عن البيانات المالية أو التوقعات أو المقاييس...',
    helpText: 'اضغط Enter للإرسال، Shift+Enter لسطر جديد',
    analyzing: 'جاري تحليل البيانات المالية...',
    keyMetrics: 'المقاييس الرئيسية:',
    yoy: 'سنوي',
    deepDive: 'تحليل معمق',
    sourcesCited: 'مصدر واحد مُستشهد به',
    sourcesCited_plural: '{{count}} مصادر مُستشهد بها',
    welcomeMessage: 'مرحباً بك في المساعد المالي الذكي. يمكنني مساعدتك في تحليل القوائم المالية وبناء التوقعات وتقديم رؤى حول أداء الشركة. ماذا تريد أن تستكشف اليوم؟',
  },

  // Workspace
  workspace: {
    tabs: {
      dataGrid: 'جدول البيانات',
      charts: 'الرسوم البيانية',
      presentation: 'العرض التقديمي',
    },
    commands: 'الأوامر',
    revenueBreakdown: 'توزيع الإيرادات حسب القطاع',
    pieChartPlaceholder: 'مخطط دائري',
  },

  // Quick Stats
  stats: {
    revenue: 'الإيرادات',
    ebitda: 'الأرباح قبل الفوائد والضرائب والإهلاك',
    netIncome: 'صافي الدخل',
    eps: 'ربحية السهم',
  },

  // Financial Data Grid
  grid: {
    title: 'نموذج التوقعات المالية الثلاثية',
    valuesInMillions: 'القيم بالمليون دولار',
    doubleClickToEdit: 'انقر مرتين للتعديل',
    hoverForFormulas: 'مرر الماوس لعرض المعادلات',
    lineItem: 'البند',
    filtered: 'مُصفى: {{value}}',
    override: 'تعديل واحد',
    override_plural: '{{count}} تعديلات',
    clearAllOverrides: 'مسح جميع التعديلات',
    deepDiveLabel: 'تحليل معمق: {{label}}',
    comparing: 'مقارنة',
    compare: 'مقارنة',
    editing: 'تحرير',
    editMode: 'وضع التحرير',
    collapse: 'طي',
    expand: 'توسيع',
    actual: 'A = فعلي',
    estimated: 'E = تقديري',
    aiGenerated: 'مُنشأ بالذكاء الاصطناعي',
    userModified: 'معدل من المستخدم',
    verified: 'موثق',
    rightClickForHistory: 'انقر بزر الماوس الأيمن للسجل',
    formula: 'المعادلة',
    components: 'المكونات:',
    revertToOriginal: 'العودة للقيمة الأصلية',
    items: '({{count}} عناصر)',
  },

  // Financial Labels
  financial: {
    // Revenue Section
    revenue: 'الإيرادات',
    totalRevenue: 'إجمالي الإيرادات',
    productRevenue: 'إيرادات المنتجات',
    serviceRevenue: 'إيرادات الخدمات',

    // Costs & Expenses
    costsAndExpenses: 'التكاليف والمصروفات',
    costOfGoodsSold: 'تكلفة البضاعة المباعة',
    grossProfit: 'إجمالي الربح',
    grossMargin: 'هامش الربح الإجمالي %',
    rdExpense: 'مصروفات البحث والتطوير',
    sgaExpense: 'مصروفات البيع والإدارة',

    // EBITDA & Operating Income
    ebitdaAndOperating: 'الأرباح قبل الفوائد والضرائب والإهلاك والدخل التشغيلي',
    ebitda: 'الأرباح قبل الفوائد والضرائب والإهلاك',
    ebitdaMargin: 'هامش EBITDA %',
    da: 'الإهلاك والإطفاء',
    operatingIncome: 'الدخل التشغيلي',
    operatingMargin: 'هامش التشغيل %',

    // Net Income
    netIncomeSection: 'صافي الدخل',
    interestExpense: 'مصروفات الفوائد',
    otherIncome: 'إيرادات/(مصروفات) أخرى',
    preTaxIncome: 'الدخل قبل الضرائب',
    taxExpense: 'مصروف الضرائب',
    netIncome: 'صافي الدخل',
    netMargin: 'هامش صافي الربح %',
    epsDiluted: 'ربحية السهم (مخففة)',
  },

  // Formulas
  formulas: {
    grossProfit: 'الإيرادات - تكلفة البضاعة المباعة',
    ebitda: 'إجمالي الربح - البحث والتطوير - مصروفات البيع والإدارة',
    operatingIncome: 'EBITDA - الإهلاك والإطفاء',
    preTaxIncome: 'الدخل التشغيلي + الفوائد + أخرى',
    netIncome: 'الدخل قبل الضرائب - الضرائب',
    grossMargin: '(إجمالي الربح / الإيرادات) × 100',
    ebitdaMargin: '(EBITDA / الإيرادات) × 100',
    operatingMargin: '(الدخل التشغيلي / الإيرادات) × 100',
    netMargin: '(صافي الدخل / الإيرادات) × 100',
  },

  // Formula Components
  formulaComponents: {
    totalRevenue: 'إجمالي الإيرادات',
    costOfGoodsSold: 'تكلفة البضاعة المباعة',
    grossProfit: 'إجمالي الربح',
    rdExpense: 'مصروفات البحث والتطوير',
    sgaExpense: 'مصروفات البيع والإدارة',
    ebitda: 'EBITDA',
    depreciation: 'الإهلاك والإطفاء',
    operatingIncome: 'الدخل التشغيلي',
    interestExpense: 'مصروفات الفوائد',
    otherIncome: 'إيرادات أخرى',
    preTaxIncome: 'الدخل قبل الضرائب',
    taxExpense: 'مصروف الضرائب',
    netIncome: 'صافي الدخل',
  },

  // Command Palette
  commands: {
    searchPlaceholder: 'اكتب أمراً أو ابحث...',
    noCommandsFound: 'لا توجد أوامر لـ "{{query}}"',
    generateForecast: '/إنشاء-توقعات',
    generateForecastDesc: 'إنشاء نموذج توقعات مالية لـ 5 سنوات',
    addScenario: '/إضافة-سيناريو',
    addScenarioDesc: 'إضافة سيناريو متفائل/متشائم للنموذج',
    analyzeMargins: '/تحليل-الهوامش',
    analyzeMarginsDesc: 'تحليل معمق للهوامش',
    exportModel: '/تصدير-النموذج',
    exportModelDesc: 'تصدير النموذج المالي إلى Excel',
    createPresentation: '/إنشاء-عرض',
    createPresentationDesc: 'إنشاء عرض تقديمي للمستثمرين',
    quickValuation: '/تقييم-سريع',
    quickValuationDesc: 'تشغيل تحليل DCF والمقارنات',
  },

  // Sensitivity Chart
  sensitivity: {
    title: 'تحليل الحساسية',
    subtitle: 'سيناريوهات توقعات الإيرادات',
    clickToFilter: 'انقر على الرسم البياني لتصفية الجدول',
    learnMore: 'معرفة المزيد عن تحليل الحساسية',
    bullCase: 'السيناريو المتفائل',
    baseCase: 'السيناريو الأساسي',
    bearCase: 'السيناريو المتشائم',
    bullGrowth: 'متفائل: +25% نمو',
    baseGrowth: 'أساسي: +20% نمو',
    bearGrowth: 'متشائم: +10% نمو',
  },

  // Presentation
  presentation: {
    title: 'عرض المستثمرين',
    slideCount: 'مُنشأ من النموذج المالي • {{count}} شرائح',
    editLayout: 'تعديل التخطيط',
    exitEdit: 'إنهاء التعديل',
    present: 'عرض',
    exportPPTX: 'تصدير PPTX',
    exporting: 'جاري التصدير {{progress}}%',
    downloaded: 'تم التحميل!',
    failed: 'فشل',
    slides: 'الشرائح',
    addSlide: 'إضافة شريحة',
    dragToReorder: 'اسحب لإعادة الترتيب • انقر للتعديل',
    dragToMove: 'اسحب لتحريك العناصر',
    doubleClickToEdit: 'انقر مرتين لتعديل النص',
    deleteToRemove: 'Delete للإزالة',

    // Slide Titles
    executiveSummary: 'الملخص التنفيذي',
    financialPerformance: 'مراجعة الأداء المالي للسنة المالية 2024',
    revenueAnalysis: 'تحليل الإيرادات',
    revenueTrajectory: 'مسار الإيرادات لـ 4 سنوات',
    revenueBySegment: 'الإيرادات حسب القطاع',
    productServiceMix: 'توزيع المنتجات مقابل الخدمات',
    profitabilityAnalysis: 'تحليل الربحية',
    marginPerformance: 'أداء الهوامش للسنة المالية 2024E',
    forwardGuidance: 'التوجيهات المستقبلية',
    outlook: 'توقعات السنة المالية 2025-2026',

    // Slide Content
    fy2024Revenue: 'إيرادات 2024E',
    yoyGrowth: 'النمو السنوي',
    cagr3y: 'معدل النمو السنوي المركب (3 سنوات)',
    productRevenue: 'إيرادات المنتجات',
    serviceRevenue: 'إيرادات الخدمات',
    grossMargin: 'هامش الربح الإجمالي',
    ebitdaMargin: 'هامش EBITDA',
    netMargin: 'هامش صافي الربح',
  },

  // Source Drawer
  sources: {
    title: 'تفاصيل المصدر',
    document: 'المستند',
    date: 'التاريخ',
    relevantExcerpt: 'المقتطف ذو الصلة',
    viewOriginal: 'عرض المستند الأصلي',
    types: {
      annualReport: 'التقرير السنوي',
      secFiling: 'إيداع SEC',
      earningsCall: 'مكالمة الأرباح',
      analystReport: 'تقرير المحلل',
      internalDocument: 'مستند داخلي',
    },
  },

  // Scenario Comparison
  scenarios: {
    title: 'مقارنة السيناريوهات',
    comparing: 'مقارنة {{left}} مع {{right}}',
    exitCompare: 'إنهاء المقارنة',
    metric: 'المقياس',
    aiBaseCase: 'السيناريو الأساسي AI',
    userAdjusted: 'معدل من المستخدم',
    bullCase: 'السيناريو المتفائل',
    bearCase: 'السيناريو المتشائم',
    aiBaseCaseDesc: 'توقعات أساسية مُنشأة بالذكاء الاصطناعي بناءً على الاتجاهات التاريخية',
    userAdjustedDesc: 'سيناريو معدل من المستخدم مع افتراضات مخصصة',
    bullCaseDesc: 'سيناريو نمو +25% مع افتراضات متفائلة',
    bearCaseDesc: 'سيناريو نمو +10% مع افتراضات محافظة',
  },

  // Cell History
  cellHistory: {
    title: 'سجل الخلية',
    changeHistory: 'سجل التغييرات',
    currentValue: 'القيمة الحالية',
    changesRecorded: 'تغيير واحد مسجل',
    changesRecorded_plural: '{{count}} تغييرات مسجلة',
    actions: {
      aiGenerated: 'مُنشأ بالذكاء الاصطناعي',
      userOverride: 'تعديل المستخدم',
      systemRecalculated: 'أُعيد حسابه من النظام',
      imported: 'مستورد',
      formulaUpdated: 'تحديث المعادلة',
    },
  },

  // New Slide
  newSlide: 'شريحة جديدة',
};
