import { useState } from 'react';
import { useStartup } from '../../../context/StartupContext';
import { ArrowRight, ArrowLeft, HelpCircle } from 'lucide-react';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function RevenueStep({ onNext, onBack }: Props) {
  const { currentProject, updateProject } = useStartup();
  const profile = currentProject?.profile;
  const existingInputs = currentProject?.financialModel?.inputs?.revenue;

  const [formData, setFormData] = useState({
    pricePerUnit: existingInputs?.pricePerUnit || (profile?.businessModel === 'subscription' ? 29 : 99),
    pricingModel: existingInputs?.pricingModel || (profile?.businessModel === 'subscription' ? 'monthly' : 'one_time') as 'monthly' | 'annual' | 'one_time' | 'per_transaction',
    currentCustomers: existingInputs?.currentCustomers || 0,
    currentMRR: existingInputs?.currentMRR || 0,
    monthlyGrowthRate: existingInputs?.monthlyGrowthRate ? existingInputs.monthlyGrowthRate * 100 : 15,
    churnRate: existingInputs?.churnRate ? existingInputs.churnRate * 100 : 5,
    // For marketplace/commission models
    averageTransactionValue: existingInputs?.averageTransactionValue || 50,
    commissionRate: existingInputs?.commissionRate ? existingInputs.commissionRate * 100 : 10,
    transactionsPerCustomer: existingInputs?.transactionsPerCustomer || 2,
  });

  const isMarketplace = profile?.businessModel === 'commission';
  const isSubscription = profile?.businessModel === 'subscription' || profile?.businessModel === 'freemium';

  const handleSubmit = () => {
    // Store in project temporarily (will be used when generating financial model)
    const revenueInputs = {
      pricePerUnit: formData.pricePerUnit,
      pricingModel: formData.pricingModel,
      currentCustomers: formData.currentCustomers,
      currentMRR: formData.currentMRR,
      monthlyGrowthRate: formData.monthlyGrowthRate / 100,
      churnRate: formData.churnRate / 100,
      averageTransactionValue: formData.averageTransactionValue,
      commissionRate: formData.commissionRate / 100,
      transactionsPerCustomer: formData.transactionsPerCustomer,
    };

    // Store temporarily in project (we'll collect all inputs before generating)
    if (currentProject) {
      const updatedProject = {
        ...currentProject,
        _tempRevenueInputs: revenueInputs,
        updatedAt: Date.now(),
      };
      updateProject(updatedProject as any);
    }

    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Helper text */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex gap-3">
          <HelpCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-zinc-300">
              Based on your <span className="text-indigo-400 font-medium">{profile?.businessModel}</span> model,
              we'll help you project revenue for the next 3 years.
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Don't worry about being exact - you can adjust these later.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          {isMarketplace ? 'Average Transaction Value' : isSubscription ? 'Price per Month' : 'Price per Sale'}
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
          <input
            type="number"
            value={formData.pricePerUnit}
            onChange={(e) => setFormData({ ...formData, pricePerUnit: Number(e.target.value) })}
            className="w-full pl-8 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          {isSubscription && 'Monthly subscription price per customer'}
          {isMarketplace && 'Average value of each transaction on your platform'}
          {!isSubscription && !isMarketplace && 'Price you charge per product/service'}
        </p>
      </div>

      {/* Commission Rate (for marketplaces) */}
      {isMarketplace && (
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Commission Rate
          </label>
          <div className="relative">
            <input
              type="number"
              value={formData.commissionRate}
              onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
              className="w-full pr-8 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">%</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            The percentage you take from each transaction
          </p>
        </div>
      )}

      {/* Current State */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Current Customers
          </label>
          <input
            type="number"
            value={formData.currentCustomers}
            onChange={(e) => setFormData({ ...formData, currentCustomers: Number(e.target.value) })}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-zinc-500 mt-1">0 is fine if you're pre-launch</p>
        </div>

        {isSubscription && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Current MRR
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
              <input
                type="number"
                value={formData.currentMRR}
                onChange={(e) => setFormData({ ...formData, currentMRR: Number(e.target.value) })}
                className="w-full pl-8 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">Monthly Recurring Revenue</p>
          </div>
        )}
      </div>

      {/* Growth Assumptions */}
      <div className="border-t border-zinc-800 pt-6">
        <h3 className="text-sm font-medium text-zinc-300 mb-4">Growth Assumptions</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Monthly Growth Rate
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.monthlyGrowthRate}
                onChange={(e) => setFormData({ ...formData, monthlyGrowthRate: Number(e.target.value) })}
                className="w-full pr-8 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">%</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">15-20% is typical for early startups</p>
          </div>

          {isSubscription && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Monthly Churn Rate
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.churnRate}
                  onChange={(e) => setFormData({ ...formData, churnRate: Number(e.target.value) })}
                  className="w-full pr-8 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">%</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">3-7% is typical for SaaS</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick estimate preview */}
      <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
        <h4 className="text-sm font-medium text-indigo-300 mb-2">Quick Preview</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-white">
              {Math.round(formData.currentCustomers * Math.pow(1 + formData.monthlyGrowthRate / 100, 12))}
            </p>
            <p className="text-xs text-zinc-400">Customers (Year 1)</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">
              ${Math.round(formData.pricePerUnit * formData.currentCustomers * Math.pow(1 + formData.monthlyGrowthRate / 100, 12) * (isMarketplace ? formData.commissionRate / 100 : 1) / 1000)}K
            </p>
            <p className="text-xs text-zinc-400">MRR (Year 1)</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">
              ${Math.round(formData.pricePerUnit * formData.currentCustomers * Math.pow(1 + formData.monthlyGrowthRate / 100, 12) * 12 * (isMarketplace ? formData.commissionRate / 100 : 1) / 1000)}K
            </p>
            <p className="text-xs text-zinc-400">ARR (Year 1)</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-zinc-700 hover:bg-zinc-800 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
        >
          Continue to Costs
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
