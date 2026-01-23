import type {
  PitchDeckInputs,
  PitchSlide,
  BusinessProfile,
  FinancialModel,
} from '../types/startup';
import { formatCurrency } from './financialCalculations';

export function generatePitchSlides(
  inputs: PitchDeckInputs,
  profile: BusinessProfile,
  financialModel?: FinancialModel
): PitchSlide[] {
  const slides: PitchSlide[] = [];

  // 1. Cover Slide
  slides.push({
    id: crypto.randomUUID(),
    type: 'cover',
    title: profile.name,
    content: {
      headline: profile.oneLiner,
      stats: [
        { label: 'Industry', value: formatIndustry(profile.industry) },
        { label: 'Stage', value: formatStage(profile.stage) },
      ],
    },
    order: 1,
  });

  // 2. Problem Slide
  slides.push({
    id: crypto.randomUUID(),
    type: 'problem',
    title: 'The Problem',
    content: {
      headline: inputs.problem.mainProblem,
      bullets: [
        ...inputs.problem.painPoints,
        `Current solutions: ${inputs.problem.currentSolutions}`,
      ],
    },
    notes: inputs.problem.whyNow,
    order: 2,
  });

  // 3. Solution Slide
  slides.push({
    id: crypto.randomUUID(),
    type: 'solution',
    title: 'Our Solution',
    content: {
      headline: inputs.solution.mainSolution,
      bullets: inputs.solution.keyFeatures,
    },
    notes: inputs.solution.howItWorks,
    order: 3,
  });

  // 4. Product Slide (How it works)
  slides.push({
    id: crypto.randomUUID(),
    type: 'product',
    title: 'How It Works',
    content: {
      headline: inputs.solution.uniqueValue,
      bullets: [inputs.solution.howItWorks],
    },
    order: 4,
  });

  // 5. Market Slide
  slides.push({
    id: crypto.randomUUID(),
    type: 'market',
    title: 'Market Opportunity',
    content: {
      headline: `${formatCurrency(inputs.market.tam, true)} Total Market`,
      stats: [
        { label: 'TAM', value: formatCurrency(inputs.market.tam, true) },
        { label: 'SAM', value: formatCurrency(inputs.market.sam, true) },
        { label: 'SOM', value: formatCurrency(inputs.market.som, true) },
        { label: 'Growth', value: `${(inputs.market.marketGrowthRate * 100).toFixed(0)}% YoY` },
      ],
      bullets: [
        `Target Customer: ${inputs.market.targetCustomer}`,
      ],
      chart: 'market',
    },
    notes: inputs.market.source,
    order: 5,
  });

  // 6. Business Model Slide
  slides.push({
    id: crypto.randomUUID(),
    type: 'business_model',
    title: 'Business Model',
    content: {
      headline: formatBusinessModel(profile.businessModel),
      stats: financialModel ? [
        { label: 'Year 1 Revenue', value: formatCurrency(financialModel.summary.year1Revenue, true) },
        { label: 'Year 3 Revenue', value: formatCurrency(financialModel.summary.year3Revenue, true) },
        { label: 'Break Even', value: financialModel.summary.breakEvenMonth ? `Month ${financialModel.summary.breakEvenMonth}` : 'TBD' },
      ] : [],
    },
    order: 6,
  });

  // 7. Traction Slide
  if (inputs.traction.hasLaunched || inputs.traction.waitlist) {
    slides.push({
      id: crypto.randomUUID(),
      type: 'traction',
      title: 'Traction',
      content: {
        stats: [
          ...(inputs.traction.users ? [{ label: 'Users', value: inputs.traction.users.toLocaleString() }] : []),
          ...(inputs.traction.revenue ? [{ label: 'Revenue', value: formatCurrency(inputs.traction.revenue, true) }] : []),
          ...(inputs.traction.waitlist ? [{ label: 'Waitlist', value: inputs.traction.waitlist.toLocaleString() }] : []),
          ...(inputs.traction.growth ? [{ label: 'Growth', value: inputs.traction.growth }] : []),
        ],
        bullets: inputs.traction.milestones,
        chart: 'growth',
      },
      order: 7,
    });
  }

  // 8. Competition Slide
  slides.push({
    id: crypto.randomUUID(),
    type: 'competition',
    title: 'Competitive Landscape',
    content: {
      headline: inputs.competition.yourAdvantage,
      bullets: [
        ...inputs.competition.competitors.map(c => `${c.name}: ${c.weakness}`),
        `Our Moat: ${inputs.competition.moat}`,
      ],
    },
    order: 8,
  });

  // 9. Team Slide
  slides.push({
    id: crypto.randomUUID(),
    type: 'team',
    title: 'The Team',
    content: {
      stats: inputs.team.map(member => ({
        label: member.role,
        value: member.name,
      })),
      bullets: inputs.team.map(member => `${member.name} - ${member.background}`),
    },
    order: 9,
  });

  // 10. Financials Slide
  if (financialModel) {
    slides.push({
      id: crypto.randomUUID(),
      type: 'financials',
      title: 'Financial Projections',
      content: {
        stats: [
          { label: 'Year 1', value: formatCurrency(financialModel.summary.year1Revenue, true) },
          { label: 'Year 2', value: formatCurrency(financialModel.summary.year2Revenue, true) },
          { label: 'Year 3', value: formatCurrency(financialModel.summary.year3Revenue, true) },
        ],
        chart: 'revenue',
      },
      order: 10,
    });
  }

  // 11. Funding Ask Slide
  slides.push({
    id: crypto.randomUUID(),
    type: 'funding',
    title: 'The Ask',
    content: {
      headline: `Raising ${formatCurrency(inputs.funding.amount, true)} ${formatFundingStage(inputs.funding.stage)}`,
      stats: inputs.funding.useOfFunds.map(item => ({
        label: item.category,
        value: `${item.percentage}%`,
      })),
      bullets: [
        `Timeline: ${inputs.funding.timeline}`,
        ...inputs.funding.milestones.map(m => `→ ${m}`),
      ],
      chart: 'use_of_funds',
    },
    order: 11,
  });

  // 12. Closing Slide
  slides.push({
    id: crypto.randomUUID(),
    type: 'closing',
    title: 'Thank You',
    content: {
      headline: profile.oneLiner,
      bullets: [
        profile.website || '',
        inputs.team[0]?.linkedin || '',
      ].filter(Boolean),
    },
    order: 12,
  });

  return slides;
}

// Helper formatters
function formatIndustry(industry: string): string {
  const map: Record<string, string> = {
    saas: 'SaaS',
    ecommerce: 'E-commerce',
    services: 'Services',
    marketplace: 'Marketplace',
    hardware: 'Hardware',
    fintech: 'Fintech',
    healthtech: 'Healthtech',
    edtech: 'Edtech',
    other: 'Other',
  };
  return map[industry] || industry;
}

function formatStage(stage: string): string {
  const map: Record<string, string> = {
    idea: 'Idea Stage',
    mvp: 'MVP',
    early_traction: 'Early Traction',
    growing: 'Growing',
    scaling: 'Scaling',
  };
  return map[stage] || stage;
}

function formatBusinessModel(model: string): string {
  const map: Record<string, string> = {
    subscription: 'Subscription Revenue',
    one_time: 'One-time Purchases',
    commission: 'Commission/Marketplace',
    freemium: 'Freemium Model',
    advertising: 'Advertising Revenue',
    hybrid: 'Hybrid Model',
  };
  return map[model] || model;
}

function formatFundingStage(stage: string): string {
  const map: Record<string, string> = {
    pre_seed: 'Pre-Seed',
    seed: 'Seed',
    series_a: 'Series A',
  };
  return map[stage] || stage;
}
