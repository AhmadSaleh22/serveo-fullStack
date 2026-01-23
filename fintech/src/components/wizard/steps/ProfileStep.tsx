import { useState } from 'react';
import { useStartup } from '../../../context/StartupContext';
import type { BusinessProfile, IndustryType, StartupStage, BusinessModel } from '../../../types/startup';
import { ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  onNext: () => void;
}

const INDUSTRIES: { value: IndustryType; label: string; emoji: string }[] = [
  { value: 'saas', label: 'SaaS', emoji: '💻' },
  { value: 'ecommerce', label: 'E-commerce', emoji: '🛒' },
  { value: 'services', label: 'Services', emoji: '🔧' },
  { value: 'marketplace', label: 'Marketplace', emoji: '🏪' },
  { value: 'fintech', label: 'Fintech', emoji: '💳' },
  { value: 'healthtech', label: 'Healthtech', emoji: '🏥' },
  { value: 'edtech', label: 'Edtech', emoji: '📚' },
  { value: 'hardware', label: 'Hardware', emoji: '🔌' },
  { value: 'other', label: 'Other', emoji: '🚀' },
];

const STAGES: { value: StartupStage; label: string; description: string }[] = [
  { value: 'idea', label: 'Idea Stage', description: "You have a concept but haven't started building" },
  { value: 'mvp', label: 'MVP', description: 'You have a basic working product' },
  { value: 'early_traction', label: 'Early Traction', description: 'You have some users/customers' },
  { value: 'growing', label: 'Growing', description: "You're actively growing with revenue" },
  { value: 'scaling', label: 'Scaling', description: "You're scaling operations significantly" },
];

const BUSINESS_MODELS: { value: BusinessModel; label: string; description: string }[] = [
  { value: 'subscription', label: 'Subscription', description: 'Recurring monthly/annual payments' },
  { value: 'one_time', label: 'One-time Purchase', description: 'Single payment for product/service' },
  { value: 'commission', label: 'Commission', description: 'Take a cut of transactions' },
  { value: 'freemium', label: 'Freemium', description: 'Free tier with paid upgrades' },
  { value: 'advertising', label: 'Advertising', description: 'Revenue from ads' },
  { value: 'hybrid', label: 'Hybrid', description: 'Combination of models' },
];

export function ProfileStep({ onNext }: Props) {
  const { currentProject, createProject, updateProject } = useStartup();

  const [formData, setFormData] = useState<Partial<BusinessProfile>>({
    name: currentProject?.profile?.name || '',
    oneLiner: currentProject?.profile?.oneLiner || '',
    industry: currentProject?.profile?.industry || 'saas',
    stage: currentProject?.profile?.stage || 'idea',
    businessModel: currentProject?.profile?.businessModel || 'subscription',
    website: currentProject?.profile?.website || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Startup name is required';
    }
    if (!formData.oneLiner?.trim()) {
      newErrors.oneLiner = 'One-liner description is required';
    } else if (formData.oneLiner.length > 100) {
      newErrors.oneLiner = 'Keep it under 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const profile: BusinessProfile = {
      id: currentProject?.profile?.id || crypto.randomUUID(),
      name: formData.name!,
      oneLiner: formData.oneLiner!,
      industry: formData.industry!,
      stage: formData.stage!,
      businessModel: formData.businessModel!,
      website: formData.website,
      createdAt: currentProject?.profile?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    if (currentProject) {
      updateProject({ ...currentProject, profile, updatedAt: Date.now() });
    } else {
      createProject(profile);
    }

    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Startup Name */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Startup Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Acme Inc"
          className={`w-full px-4 py-3 bg-zinc-900 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.name ? 'border-red-500' : 'border-zinc-700'
          }`}
        />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* One-liner */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          One-liner Description *
          <span className="text-zinc-500 font-normal ml-2">What do you do?</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.oneLiner}
            onChange={(e) => setFormData({ ...formData, oneLiner: e.target.value })}
            placeholder='e.g., "Airbnb for parking spots" or "AI-powered accounting for SMBs"'
            className={`w-full px-4 py-3 bg-zinc-900 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.oneLiner ? 'border-red-500' : 'border-zinc-700'
            }`}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-xs flex items-center gap-1 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            Suggest
          </button>
        </div>
        {errors.oneLiner && <p className="text-red-400 text-xs mt-1">{errors.oneLiner}</p>}
        <p className="text-zinc-500 text-xs mt-1">
          {formData.oneLiner?.length || 0}/100 characters
        </p>
      </div>

      {/* Industry */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Industry
        </label>
        <div className="grid grid-cols-3 gap-2">
          {INDUSTRIES.map((industry) => (
            <button
              key={industry.value}
              type="button"
              onClick={() => setFormData({ ...formData, industry: industry.value })}
              className={`px-4 py-3 rounded-lg border text-sm transition-all ${
                formData.industry === industry.value
                  ? 'border-indigo-500 bg-indigo-500/20 text-white'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <span className="mr-2">{industry.emoji}</span>
              {industry.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stage */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Current Stage
        </label>
        <div className="space-y-2">
          {STAGES.map((stage) => (
            <button
              key={stage.value}
              type="button"
              onClick={() => setFormData({ ...formData, stage: stage.value })}
              className={`w-full px-4 py-3 rounded-lg border text-left transition-all ${
                formData.stage === stage.value
                  ? 'border-indigo-500 bg-indigo-500/20'
                  : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
              }`}
            >
              <div className="font-medium text-white">{stage.label}</div>
              <div className="text-xs text-zinc-400">{stage.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Business Model */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Business Model
        </label>
        <div className="grid grid-cols-2 gap-2">
          {BUSINESS_MODELS.map((model) => (
            <button
              key={model.value}
              type="button"
              onClick={() => setFormData({ ...formData, businessModel: model.value })}
              className={`px-4 py-3 rounded-lg border text-left transition-all ${
                formData.businessModel === model.value
                  ? 'border-indigo-500 bg-indigo-500/20'
                  : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
              }`}
            >
              <div className="font-medium text-white text-sm">{model.label}</div>
              <div className="text-xs text-zinc-400">{model.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Website (optional) */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Website
          <span className="text-zinc-500 font-normal ml-2">(optional)</span>
        </label>
        <input
          type="url"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          placeholder="https://yoursite.com"
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Submit */}
      <div className="pt-4">
        <button
          onClick={handleSubmit}
          className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
        >
          Continue to Revenue Model
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
