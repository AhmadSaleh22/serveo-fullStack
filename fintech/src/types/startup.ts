// Types for StartupKit - Startup founder inputs and data models

// ============ BUSINESS PROFILE ============

export type IndustryType =
  | 'saas'
  | 'ecommerce'
  | 'services'
  | 'marketplace'
  | 'hardware'
  | 'fintech'
  | 'healthtech'
  | 'edtech'
  | 'other';

export type StartupStage =
  | 'idea'
  | 'mvp'
  | 'early_traction'
  | 'growing'
  | 'scaling';

export type BusinessModel =
  | 'subscription'
  | 'one_time'
  | 'commission'
  | 'freemium'
  | 'advertising'
  | 'hybrid';

export interface BusinessProfile {
  id: string;
  name: string;
  oneLiner: string; // "Uber for X" style description
  industry: IndustryType;
  stage: StartupStage;
  businessModel: BusinessModel;
  foundedDate?: string;
  website?: string;
  createdAt: number;
  updatedAt: number;
}

// ============ FINANCIAL MODEL INPUTS ============

export interface RevenueInputs {
  // Pricing
  pricePerUnit: number; // Monthly price for SaaS, or per-item for others
  pricingModel: 'monthly' | 'annual' | 'one_time' | 'per_transaction';

  // Current state
  currentCustomers: number;
  currentMRR: number; // Monthly Recurring Revenue

  // Growth assumptions
  monthlyGrowthRate: number; // e.g., 0.15 for 15%
  churnRate: number; // e.g., 0.05 for 5% monthly churn

  // For marketplaces/commission models
  averageTransactionValue?: number;
  commissionRate?: number;
  transactionsPerCustomer?: number;
}

export interface CostCategory {
  id: string;
  name: string;
  type: 'fixed' | 'variable' | 'semi_variable';
  monthlyAmount: number;
  growthWithRevenue?: number; // e.g., 0.1 means grows 10% of revenue growth
}

export interface TeamMember {
  id: string;
  role: string;
  salary: number; // Annual
  startMonth: number; // Month number when they join (1-36)
  isFounder: boolean;
}

export interface CostInputs {
  categories: CostCategory[];
  team: TeamMember[];

  // Common costs with defaults
  hosting: number; // Monthly
  tools: number; // Monthly (SaaS tools)
  marketing: number; // Monthly
  legal: number; // Annual
  office: number; // Monthly (0 if remote)
}

export interface FinancialModelInputs {
  revenue: RevenueInputs;
  costs: CostInputs;

  // Funding
  initialCash: number;
  plannedRaise: number;

  // Projections config
  projectionMonths: 36; // 3 years
}

// ============ GENERATED FINANCIAL DATA ============

export interface MonthlyProjection {
  month: number; // 1-36
  label: string; // "Jan 2025"

  // Revenue
  customers: number;
  newCustomers: number;
  churnedCustomers: number;
  revenue: number;
  mrr: number;
  arr: number; // Annual run rate

  // Costs
  totalCosts: number;
  teamCosts: number;
  operatingCosts: number;
  marketingCosts: number;

  // Key metrics
  grossProfit: number;
  grossMargin: number;
  netIncome: number;
  burnRate: number;
  cashBalance: number;
  runway: number; // Months of runway
}

export interface FinancialModel {
  id: string;
  projectId: string;
  inputs: FinancialModelInputs;
  projections: MonthlyProjection[];

  // Summary metrics
  summary: {
    year1Revenue: number;
    year2Revenue: number;
    year3Revenue: number;
    year1Customers: number;
    year2Customers: number;
    year3Customers: number;
    breakEvenMonth: number | null;
    totalFundingNeeded: number;
    peakBurnRate: number;
  };

  createdAt: number;
  updatedAt: number;
}

// ============ PITCH DECK INPUTS ============

export interface ProblemStatement {
  mainProblem: string;
  painPoints: string[]; // 2-4 bullet points
  currentSolutions: string; // How people solve it today
  whyNow: string; // Why is now the right time
}

export interface SolutionStatement {
  mainSolution: string;
  keyFeatures: string[]; // 3-5 features
  uniqueValue: string; // What makes you different
  howItWorks: string; // Brief explanation
}

export interface MarketData {
  targetCustomer: string; // Who is your ideal customer
  tam: number; // Total Addressable Market
  sam: number; // Serviceable Addressable Market
  som: number; // Serviceable Obtainable Market
  marketGrowthRate: number;
  source?: string; // Where did you get these numbers
}

export interface TractionData {
  hasLaunched: boolean;
  users?: number;
  revenue?: number;
  growth?: string; // "20% MoM"
  waitlist?: number;
  partnerships?: string[];
  press?: string[];
  milestones: string[]; // Key achievements
}

export interface CompetitorInfo {
  name: string;
  description: string;
  weakness: string; // Why you're better
}

export interface CompetitiveAnalysis {
  competitors: CompetitorInfo[];
  yourAdvantage: string; // Your unfair advantage
  moat: string; // What's defensible
}

export interface TeamMemberInfo {
  name: string;
  role: string;
  background: string; // Brief bio
  linkedin?: string;
  image?: string;
}

export interface FundingAsk {
  amount: number;
  stage: 'pre_seed' | 'seed' | 'series_a';
  useOfFunds: {
    category: string;
    percentage: number;
    description: string;
  }[];
  timeline: string; // "18 months runway"
  milestones: string[]; // What you'll achieve with this funding
}

export interface PitchDeckInputs {
  problem: ProblemStatement;
  solution: SolutionStatement;
  market: MarketData;
  traction: TractionData;
  competition: CompetitiveAnalysis;
  team: TeamMemberInfo[];
  funding: FundingAsk;
}

// ============ GENERATED PITCH DECK ============

export type SlideType =
  | 'cover'
  | 'problem'
  | 'solution'
  | 'product'
  | 'market'
  | 'business_model'
  | 'traction'
  | 'competition'
  | 'team'
  | 'financials'
  | 'funding'
  | 'closing';

export interface PitchSlide {
  id: string;
  type: SlideType;
  title: string;
  content: {
    headline?: string;
    bullets?: string[];
    stats?: { label: string; value: string }[];
    image?: string;
    chart?: 'revenue' | 'growth' | 'market' | 'use_of_funds';
  };
  notes?: string; // Speaker notes
  order: number;
}

export interface PitchDeck {
  id: string;
  projectId: string;
  inputs: PitchDeckInputs;
  slides: PitchSlide[];
  theme: 'modern' | 'minimal' | 'bold' | 'classic';
  createdAt: number;
  updatedAt: number;
}

// ============ PROJECT (COMBINES EVERYTHING) ============

export interface StartupProject {
  id: string;
  profile: BusinessProfile;
  financialModel?: FinancialModel;
  pitchDeck?: PitchDeck;
  clippedData: ClippedData[];
  createdAt: number;
  updatedAt: number;
}

export interface ClippedData {
  id: string;
  type: 'text' | 'number' | 'link';
  content: string;
  sourceUrl: string;
  sourceTitle: string;
  category?: 'market_size' | 'competitor' | 'pricing' | 'statistic' | 'other';
  timestamp: number;
}

// ============ WIZARD STEPS ============

export type WizardStep =
  | 'profile'
  | 'revenue'
  | 'costs'
  | 'problem'
  | 'solution'
  | 'market'
  | 'traction'
  | 'team'
  | 'funding'
  | 'review';

export interface WizardState {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  projectData: Partial<StartupProject>;
}
