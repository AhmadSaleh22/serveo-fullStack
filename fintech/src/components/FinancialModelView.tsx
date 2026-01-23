import { useState } from 'react';
import { useStartup } from '../context/StartupContext';
import {
  ArrowLeft,
  Download,
  Table,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Loader2,
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/financialCalculations';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import * as XLSX from 'xlsx';

export function FinancialModelView() {
  const { currentProject, setActiveView } = useStartup();
  const [activeTab, setActiveTab] = useState<'overview' | 'monthly' | 'charts'>('overview');
  const [exporting, setExporting] = useState(false);

  const model = currentProject?.financialModel;

  if (!model) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">No financial model generated yet</p>
          <button
            onClick={() => setActiveView('wizard')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Go to Wizard
          </button>
        </div>
      </div>
    );
  }

  const exportToExcel = async () => {
    setExporting(true);

    try {
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['Financial Model Summary'],
        [''],
        ['Company', currentProject?.profile.name],
        ['Generated', new Date().toLocaleDateString()],
        [''],
        ['Key Metrics', ''],
        ['Year 1 Revenue', model.summary.year1Revenue],
        ['Year 2 Revenue', model.summary.year2Revenue],
        ['Year 3 Revenue', model.summary.year3Revenue],
        ['Year 1 Customers', model.summary.year1Customers],
        ['Year 2 Customers', model.summary.year2Customers],
        ['Year 3 Customers', model.summary.year3Customers],
        ['Break Even Month', model.summary.breakEvenMonth || 'N/A'],
        ['Peak Burn Rate', model.summary.peakBurnRate],
        ['Total Funding Needed', model.summary.totalFundingNeeded],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      // Monthly projections sheet
      const monthlyHeaders = [
        'Month',
        'Label',
        'Customers',
        'New Customers',
        'Churned',
        'Revenue',
        'MRR',
        'ARR',
        'Total Costs',
        'Team Costs',
        'Operating Costs',
        'Marketing',
        'Gross Profit',
        'Gross Margin',
        'Net Income',
        'Burn Rate',
        'Cash Balance',
        'Runway (months)',
      ];

      const monthlyData = [
        monthlyHeaders,
        ...model.projections.map((p) => [
          p.month,
          p.label,
          p.customers,
          p.newCustomers,
          p.churnedCustomers,
          p.revenue,
          p.mrr,
          p.arr,
          p.totalCosts,
          p.teamCosts,
          p.operatingCosts,
          p.marketingCosts,
          p.grossProfit,
          p.grossMargin,
          p.netIncome,
          p.burnRate,
          p.cashBalance,
          p.runway,
        ]),
      ];
      const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
      XLSX.utils.book_append_sheet(wb, monthlySheet, 'Monthly Projections');

      // Annual summary sheet
      const year1 = model.projections.slice(0, 12);
      const year2 = model.projections.slice(12, 24);
      const year3 = model.projections.slice(24, 36);

      const annualData = [
        ['Metric', 'Year 1', 'Year 2', 'Year 3'],
        [
          'Revenue',
          year1.reduce((s, p) => s + p.revenue, 0),
          year2.reduce((s, p) => s + p.revenue, 0),
          year3.reduce((s, p) => s + p.revenue, 0),
        ],
        [
          'Customers (End)',
          year1[11]?.customers || 0,
          year2[11]?.customers || 0,
          year3[11]?.customers || 0,
        ],
        [
          'Total Costs',
          year1.reduce((s, p) => s + p.totalCosts, 0),
          year2.reduce((s, p) => s + p.totalCosts, 0),
          year3.reduce((s, p) => s + p.totalCosts, 0),
        ],
        [
          'Net Income',
          year1.reduce((s, p) => s + p.netIncome, 0),
          year2.reduce((s, p) => s + p.netIncome, 0),
          year3.reduce((s, p) => s + p.netIncome, 0),
        ],
      ];
      const annualSheet = XLSX.utils.aoa_to_sheet(annualData);
      XLSX.utils.book_append_sheet(wb, annualSheet, 'Annual Summary');

      // Download
      XLSX.writeFile(wb, `${currentProject?.profile.name}_Financial_Model.xlsx`);
    } catch (error) {
      console.error('Export failed:', error);
    }

    setExporting(false);
  };

  // Prepare chart data
  const chartData = model.projections.map((p) => ({
    month: p.label,
    revenue: p.revenue,
    costs: p.totalCosts,
    netIncome: p.netIncome,
    customers: p.customers,
    cashBalance: p.cashBalance,
  }));

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveView('home')}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-lg">{currentProject?.profile.name}</h1>
              <p className="text-xs text-zinc-500">Financial Model</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('pitch')}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              View Pitch Deck
            </button>
            <button
              onClick={exportToExcel}
              disabled={exporting}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export to Excel
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'monthly', label: 'Monthly Data', icon: Table },
              { id: 'charts', label: 'Charts', icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-sm flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs">Year 3 Revenue</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(model.summary.year3Revenue, true)}</p>
                <p className="text-xs text-green-400 mt-1">
                  {formatPercent((model.summary.year3Revenue - model.summary.year1Revenue) / model.summary.year1Revenue)} from Year 1
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-xs">Year 3 Customers</span>
                </div>
                <p className="text-2xl font-bold">{model.summary.year3Customers.toLocaleString()}</p>
                <p className="text-xs text-green-400 mt-1">
                  {formatPercent((model.summary.year3Customers - model.summary.year1Customers) / model.summary.year1Customers)} growth
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs">Break Even</span>
                </div>
                <p className="text-2xl font-bold">
                  {model.summary.breakEvenMonth ? `Month ${model.summary.breakEvenMonth}` : 'N/A'}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {model.summary.breakEvenMonth
                    ? `${Math.ceil(model.summary.breakEvenMonth / 12)} year${model.summary.breakEvenMonth > 12 ? 's' : ''}`
                    : 'Not in 3-year projection'}
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-xs">Peak Burn Rate</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(model.summary.peakBurnRate, true)}</p>
                <p className="text-xs text-zinc-500 mt-1">per month</p>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-medium mb-4">Revenue vs Costs</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="month"
                      stroke="#9CA3AF"
                      tick={{ fontSize: 10 }}
                      interval={2}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181B',
                        border: '1px solid #3F3F46',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stackId="1"
                      stroke="#6366F1"
                      fill="#6366F1"
                      fillOpacity={0.3}
                      name="Revenue"
                    />
                    <Area
                      type="monotone"
                      dataKey="costs"
                      stackId="2"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.3}
                      name="Costs"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Annual Summary */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-medium mb-4">Annual Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="text-left py-3 text-zinc-400 font-medium">Metric</th>
                      <th className="text-right py-3 text-zinc-400 font-medium">Year 1</th>
                      <th className="text-right py-3 text-zinc-400 font-medium">Year 2</th>
                      <th className="text-right py-3 text-zinc-400 font-medium">Year 3</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-800">
                      <td className="py-3">Revenue</td>
                      <td className="text-right">{formatCurrency(model.summary.year1Revenue)}</td>
                      <td className="text-right">{formatCurrency(model.summary.year2Revenue)}</td>
                      <td className="text-right">{formatCurrency(model.summary.year3Revenue)}</td>
                    </tr>
                    <tr className="border-b border-zinc-800">
                      <td className="py-3">Customers</td>
                      <td className="text-right">{model.summary.year1Customers.toLocaleString()}</td>
                      <td className="text-right">{model.summary.year2Customers.toLocaleString()}</td>
                      <td className="text-right">{model.summary.year3Customers.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b border-zinc-800">
                      <td className="py-3">MRR (End of Year)</td>
                      <td className="text-right">{formatCurrency(model.projections[11]?.mrr || 0)}</td>
                      <td className="text-right">{formatCurrency(model.projections[23]?.mrr || 0)}</td>
                      <td className="text-right">{formatCurrency(model.projections[35]?.mrr || 0)}</td>
                    </tr>
                    <tr>
                      <td className="py-3">Cash Balance (End)</td>
                      <td className="text-right">{formatCurrency(model.projections[11]?.cashBalance || 0)}</td>
                      <td className="text-right">{formatCurrency(model.projections[23]?.cashBalance || 0)}</td>
                      <td className="text-right">{formatCurrency(model.projections[35]?.cashBalance || 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-800">
                  <tr>
                    <th className="text-left px-4 py-3 text-zinc-400 font-medium sticky left-0 bg-zinc-800">Month</th>
                    <th className="text-right px-4 py-3 text-zinc-400 font-medium">Customers</th>
                    <th className="text-right px-4 py-3 text-zinc-400 font-medium">Revenue</th>
                    <th className="text-right px-4 py-3 text-zinc-400 font-medium">MRR</th>
                    <th className="text-right px-4 py-3 text-zinc-400 font-medium">Costs</th>
                    <th className="text-right px-4 py-3 text-zinc-400 font-medium">Net Income</th>
                    <th className="text-right px-4 py-3 text-zinc-400 font-medium">Cash</th>
                    <th className="text-right px-4 py-3 text-zinc-400 font-medium">Runway</th>
                  </tr>
                </thead>
                <tbody>
                  {model.projections.map((p, index) => (
                    <tr key={p.month} className={index % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-900/50'}>
                      <td className="px-4 py-2 sticky left-0 bg-inherit font-medium">{p.label}</td>
                      <td className="text-right px-4 py-2">{p.customers.toLocaleString()}</td>
                      <td className="text-right px-4 py-2">{formatCurrency(p.revenue)}</td>
                      <td className="text-right px-4 py-2">{formatCurrency(p.mrr)}</td>
                      <td className="text-right px-4 py-2">{formatCurrency(p.totalCosts)}</td>
                      <td className={`text-right px-4 py-2 ${p.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(p.netIncome)}
                      </td>
                      <td className="text-right px-4 py-2">{formatCurrency(p.cashBalance)}</td>
                      <td className="text-right px-4 py-2">{p.runway}mo</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="grid grid-cols-2 gap-6">
            {/* Customer Growth */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-medium mb-4">Customer Growth</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 10 }} interval={5} />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181B',
                        border: '1px solid #3F3F46',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="customers"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={false}
                      name="Customers"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cash Balance */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-medium mb-4">Cash Balance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 10 }} interval={5} />
                    <YAxis
                      stroke="#9CA3AF"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181B',
                        border: '1px solid #3F3F46',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area
                      type="monotone"
                      dataKey="cashBalance"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.3}
                      name="Cash Balance"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Net Income */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 col-span-2">
              <h3 className="font-medium mb-4">Monthly Net Income</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 10 }} interval={2} />
                    <YAxis
                      stroke="#9CA3AF"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181B',
                        border: '1px solid #3F3F46',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area
                      type="monotone"
                      dataKey="netIncome"
                      stroke="#6366F1"
                      fill="#6366F1"
                      fillOpacity={0.3}
                      name="Net Income"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
