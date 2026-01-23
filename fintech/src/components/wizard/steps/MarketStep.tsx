import { useState } from 'react';
import { useStartup } from '../../../context/StartupContext';
import { ArrowRight, ArrowLeft, HelpCircle, Sparkles } from 'lucide-react';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function MarketStep({ onNext, onBack }: Props) {
  const { currentProject, updateProject } = useStartup();
  const existing = currentProject?.pitchDeck?.inputs?.market;

  const [formData, setFormData] = useState({
    targetCustomer: existing?.targetCustomer || '',
    tam: existing?.tam || 0,
    sam: existing?.sam || 0,
    som: existing?.som || 0,
    marketGrowthRate: existing?.marketGrowthRate ? existing.marketGrowthRate * 100 : 15,
    source: existing?.source || '',
  });

  const handleSubmit = () => {
    if (currentProject) {
      const updatedProject = {
        ...currentProject,
        _tempMarket: {
          targetCustomer: formData.targetCustomer,
          tam: formData.tam,
          sam: formData.sam,
          som: formData.som,
          marketGrowthRate: formData.marketGrowthRate / 100,
          source: formData.source,
        },
        updatedAt: Date.now(),
      };
      updateProject(updatedProject as any);
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Target Customer */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Who is your target customer? *
        </label>
        <textarea
          value={formData.targetCustomer}
          onChange={(e) => setFormData({ ...formData, targetCustomer: e.target.value })}
          placeholder="e.g., Solo entrepreneurs and freelancers earning $50K-$200K/year who don't have time for bookkeeping but can't afford a full-time accountant."
          rows={2}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* TAM/SAM/SOM Explanation */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex gap-3">
          <HelpCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-zinc-300 font-medium mb-2">Market Size Explained</p>
            <ul className="text-xs text-zinc-400 space-y-1">
              <li><span className="text-indigo-400">TAM</span> = Total Addressable Market (everyone who could use your product)</li>
              <li><span className="text-indigo-400">SAM</span> = Serviceable Addressable Market (your reachable segment)</li>
              <li><span className="text-indigo-400">SOM</span> = Serviceable Obtainable Market (realistic capture in 3-5 years)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Market Sizes */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            TAM
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
            <input
              type="number"
              value={formData.tam || ''}
              onChange={(e) => setFormData({ ...formData, tam: Number(e.target.value) })}
              placeholder="50B"
              className="w-full pl-7 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <p className="text-xs text-zinc-500 mt-1">Total market</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            SAM
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
            <input
              type="number"
              value={formData.sam || ''}
              onChange={(e) => setFormData({ ...formData, sam: Number(e.target.value) })}
              placeholder="5B"
              className="w-full pl-7 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <p className="text-xs text-zinc-500 mt-1">Your segment</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            SOM
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
            <input
              type="number"
              value={formData.som || ''}
              onChange={(e) => setFormData({ ...formData, som: Number(e.target.value) })}
              placeholder="100M"
              className="w-full pl-7 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <p className="text-xs text-zinc-500 mt-1">Your target</p>
        </div>
      </div>

      {/* AI Research Button */}
      <button
        type="button"
        className="w-full px-4 py-3 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-300 hover:bg-indigo-500/30 transition-colors flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Research Market Size with AI
      </button>

      {/* Market Growth */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Market Growth Rate (Annual)
        </label>
        <div className="relative">
          <input
            type="number"
            value={formData.marketGrowthRate}
            onChange={(e) => setFormData({ ...formData, marketGrowthRate: Number(e.target.value) })}
            className="w-full pr-8 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">%</span>
        </div>
      </div>

      {/* Source */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Source
          <span className="text-zinc-500 font-normal ml-2">(Where did you get these numbers?)</span>
        </label>
        <input
          type="text"
          value={formData.source}
          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
          placeholder="e.g., Statista 2024, Grand View Research, Internal analysis"
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
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
          Continue to Traction
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
