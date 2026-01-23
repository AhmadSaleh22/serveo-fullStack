import type { FinancialModelInputs, MonthlyProjection } from '../types/startup';

interface ProjectionResult {
  monthly: MonthlyProjection[];
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
}

export function generateFinancialProjections(inputs: FinancialModelInputs): ProjectionResult {
  const { revenue, costs, initialCash, plannedRaise } = inputs;
  const months: MonthlyProjection[] = [];

  let customers = revenue.currentCustomers;
  let cashBalance = initialCash + plannedRaise;
  let breakEvenMonth: number | null = null;
  let peakBurnRate = 0;

  // Get month label
  const getMonthLabel = (monthNum: number): string => {
    const startDate = new Date();
    const date = new Date(startDate.getFullYear(), startDate.getMonth() + monthNum - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Calculate team costs for a given month
  const getTeamCosts = (month: number): number => {
    return costs.team
      .filter(member => member.startMonth <= month)
      .reduce((sum, member) => sum + member.salary / 12, 0);
  };

  // Calculate operating costs
  const getOperatingCosts = (): number => {
    return costs.hosting + costs.tools + costs.office + (costs.legal / 12);
  };

  // Calculate variable costs based on revenue
  const getVariableCosts = (currentRevenue: number): number => {
    return costs.categories
      .filter(c => c.type === 'variable')
      .reduce((sum, c) => sum + (currentRevenue * (c.growthWithRevenue || 0.1)), 0);
  };

  for (let month = 1; month <= 36; month++) {
    // Calculate new customers (growth with some variance)
    const growthMultiplier = 1 + revenue.monthlyGrowthRate;
    const newCustomers = month === 1 ? Math.ceil(customers * revenue.monthlyGrowthRate) : Math.ceil(customers * revenue.monthlyGrowthRate * (0.9 + Math.random() * 0.2));

    // Calculate churned customers
    const churnedCustomers = Math.floor(customers * revenue.churnRate);

    // Update customer count
    customers = Math.max(0, customers + newCustomers - churnedCustomers);

    // Calculate revenue
    let monthlyRevenue = 0;
    if (revenue.pricingModel === 'monthly' || revenue.pricingModel === 'annual') {
      monthlyRevenue = customers * revenue.pricePerUnit;
    } else if (revenue.pricingModel === 'per_transaction') {
      const transactions = customers * (revenue.transactionsPerCustomer || 2);
      monthlyRevenue = transactions * (revenue.averageTransactionValue || 50) * (revenue.commissionRate || 0.1);
    } else {
      monthlyRevenue = newCustomers * revenue.pricePerUnit;
    }

    // Calculate costs
    const teamCosts = getTeamCosts(month);
    const operatingCosts = getOperatingCosts();
    const marketingCosts = costs.marketing * (1 + (month - 1) * 0.05); // Marketing grows 5% monthly
    const variableCosts = getVariableCosts(monthlyRevenue);
    const totalCosts = teamCosts + operatingCosts + marketingCosts + variableCosts;

    // Calculate metrics
    const grossProfit = monthlyRevenue - variableCosts;
    const grossMargin = monthlyRevenue > 0 ? grossProfit / monthlyRevenue : 0;
    const netIncome = monthlyRevenue - totalCosts;
    const burnRate = netIncome < 0 ? Math.abs(netIncome) : 0;

    // Update peak burn rate
    if (burnRate > peakBurnRate) {
      peakBurnRate = burnRate;
    }

    // Update cash balance
    cashBalance += netIncome;

    // Calculate runway
    const runway = burnRate > 0 ? Math.floor(cashBalance / burnRate) : 999;

    // Check for break-even
    if (breakEvenMonth === null && netIncome >= 0) {
      breakEvenMonth = month;
    }

    months.push({
      month,
      label: getMonthLabel(month),
      customers,
      newCustomers,
      churnedCustomers,
      revenue: monthlyRevenue,
      mrr: monthlyRevenue,
      arr: monthlyRevenue * 12,
      totalCosts,
      teamCosts,
      operatingCosts: operatingCosts + variableCosts,
      marketingCosts,
      grossProfit,
      grossMargin,
      netIncome,
      burnRate,
      cashBalance: Math.max(0, cashBalance),
      runway,
    });
  }

  // Calculate summary
  const year1Revenue = months.slice(0, 12).reduce((sum, m) => sum + m.revenue, 0);
  const year2Revenue = months.slice(12, 24).reduce((sum, m) => sum + m.revenue, 0);
  const year3Revenue = months.slice(24, 36).reduce((sum, m) => sum + m.revenue, 0);

  const year1Customers = months[11]?.customers || 0;
  const year2Customers = months[23]?.customers || 0;
  const year3Customers = months[35]?.customers || 0;

  // Calculate total funding needed (minimum cash balance point)
  const minCashBalance = Math.min(...months.map(m => m.cashBalance));
  const totalFundingNeeded = minCashBalance < 0 ? Math.abs(minCashBalance) + 50000 : 0;

  return {
    monthly: months,
    summary: {
      year1Revenue,
      year2Revenue,
      year3Revenue,
      year1Customers,
      year2Customers,
      year3Customers,
      breakEvenMonth,
      totalFundingNeeded: totalFundingNeeded || plannedRaise,
      peakBurnRate,
    },
  };
}

// Format currency
export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Format percentage
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// Get growth rate between two values
export function getGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 1 : 0;
  return (current - previous) / previous;
}
