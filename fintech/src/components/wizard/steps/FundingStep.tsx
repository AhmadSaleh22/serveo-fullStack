import { useState } from 'react';
import { useStartup } from '../../../context/StartupContext';
import { ArrowRight, ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

interface UseOfFunds {
  category: string;
  percentage: number;
  description: string;
}

const FUNDING_STAGES = [
  { value: 'pre_seed', label: 'Pre-Seed', range: '$50K - $500K' },
  { value: 'seed', label: 'Seed', range: '$500K - $3M' },
  { value: 'series_a', label: 'Series A', range: '$3M - $15M' },
];

const DEFAULT_USE_OF_FUNDS: UseOfFunds[] = [
  { category: 'Engineering', percentage: 40, description: 'Product development and technical hires' },
  { category: 'Marketing', percentage: 30, description: 'Customer acquisition and brand building' },
  { category: 'Operations', percentage: 20, description: 'Infrastructure and tools' },
  { category: 'G&A', percentage: 10, description: 'Legal, accounting, and admin' },
];

export function FundingStep({ onNext, onBack }: Props) {
  const { currentProject, updateProject } = useStartup();
  const existing = currentProject?.pitchDeck?.inputs?.funding;
  const plannedRaise = (currentProject as any)?._tempFunding?.plannedRaise || 500000;

  const [formData, setFormData] = useState({
    amount: existing?.amount || plannedRaise,
    stage: existing?.stage || 'pre_seed' as 'pre_seed' | 'seed' | 'series_a',
    useOfFunds: existing?.useOfFunds || DEFAULT_USE_OF_FUNDS,
    timeline: existing?.timeline || '18 months runway',
    milestones: existing?.milestones || ['', ''],
  });

  const updateUseOfFunds = (index: number, updates: Partial<UseOfFunds>) => {
    const updated = [...formData.useOfFunds];
    updated[index] = { ...updated[index], ...updates };
    setFormData({ ...formData, useOfFunds: updated });
  };

  const addMilestone = () => {
    if (formData.milestones.length < 4) {
      setFormData({ ...formData, milestones: [...formData.milestones, ''] });
    }
  };

  const updateMilestone = (index: number, value: string) => {
    const updated = [...formData.milestones];
    updated[index] = value;
    setFormData({ ...formData, milestones: updated });
  };

  const removeMilestone = (index: number) => {
    if (formData.milestones.length > 1) {
      setFormData({ ...formData, milestones: formData.milestones.filter((_, i) => i !== index) });
    }
  };

  const totalPercentage = formData.useOfFunds.reduce((sum, item) => sum + item.percentage, 0);

  const handleSubmit = () => {
    if (currentProject) {
      const updatedProject = {
        ...currentProject,
        _tempFunding: {
          ...((currentProject as any)._tempFunding || {}),
          amount: formData.amount,
          stage: formData.stage,
          useOfFunds: formData.useOfFunds,
          timeline: formData.timeline,
          milestones: formData.milestones.filter(m => m.trim()),
        },
        updatedAt: Date.now(),
      };
      updateProject(updatedProject as any);
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Funding Stage */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          Funding Stage
        </label>
        <div className="grid grid-cols-3 gap-3">
          {FUNDING_STAGES.map((stage) => (
            <button
              key={stage.value}
              type="button"
              onClick={() => setFormData({ ...formData, stage: stage.value as any })}
              className={`px-4 py-3 rounded-lg border text-center transition-all ${
                formData.stage === stage.value
                  ? 'border-indigo-500 bg-indigo-500/20 text-white'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <div className="font-medium">{stage.label}</div>
              <div className="text-xs text-zinc-500">{stage.range}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Raise Amount
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            className="w-full pl-8 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Typical {FUNDING_STAGES.find(s => s.value === formData.stage)?.label} range: {FUNDING_STAGES.find(s => s.value === formData.stage)?.range}
        </p>
      </div>

      {/* Use of Funds */}
      <div className="border-t border-zinc-800 pt-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-zinc-300">
            Use of Funds
          </label>
          <span className={`text-xs ${totalPercentage === 100 ? 'text-green-400' : 'text-amber-400'}`}>
            Total: {totalPercentage}%
          </span>
        </div>

        <div className="space-y-3">
          {formData.useOfFunds.map((item, index) => (
            <div key={index} className="flex gap-3 items-center">
              <input
                type="text"
                value={item.category}
                onChange={(e) => updateUseOfFunds(index, { category: e.target.value })}
                placeholder="Category"
                className="w-32 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="relative w-20">
                <input
                  type="number"
                  value={item.percentage}
                  onChange={(e) => updateUseOfFunds(index, { percentage: Number(e.target.value) })}
                  className="w-full pr-6 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">%</span>
              </div>
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateUseOfFunds(index, { description: e.target.value })}
                placeholder="What will you use it for?"
                className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
        </div>

        {/* Visual breakdown */}
        <div className="mt-4 h-3 bg-zinc-800 rounded-full overflow-hidden flex">
          {formData.useOfFunds.map((item, index) => (
            <div
              key={index}
              className="h-full transition-all"
              style={{
                width: `${item.percentage}%`,
                backgroundColor: ['#6366F1', '#8B5CF6', '#A855F7', '#D946EF'][index % 4],
              }}
              title={`${item.category}: ${item.percentage}%`}
            />
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Runway / Timeline
        </label>
        <input
          type="text"
          value={formData.timeline}
          onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
          placeholder="e.g., 18 months runway to Series A"
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Milestones */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-zinc-300">
            Key Milestones with this Funding
          </label>
          {formData.milestones.length < 4 && (
            <button
              onClick={addMilestone}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          )}
        </div>
        <div className="space-y-2">
          {formData.milestones.map((milestone, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={milestone}
                onChange={(e) => updateMilestone(index, e.target.value)}
                placeholder={
                  index === 0
                    ? "e.g., Reach 10,000 users"
                    : index === 1
                    ? "e.g., Achieve $100K MRR"
                    : "Another milestone..."
                }
                className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {formData.milestones.length > 1 && (
                <button
                  onClick={() => removeMilestone(index)}
                  className="p-2.5 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          What will you achieve with this funding? Be specific and measurable.
        </p>
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
          Review & Generate
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
