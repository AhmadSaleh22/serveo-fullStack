import { useState } from 'react';
import { useStartup } from '../../../context/StartupContext';
import { ArrowRight, ArrowLeft, Plus, Trash2, Sparkles } from 'lucide-react';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function SolutionStep({ onNext, onBack }: Props) {
  const { currentProject, updateProject } = useStartup();
  const existing = currentProject?.pitchDeck?.inputs?.solution;

  const [formData, setFormData] = useState({
    mainSolution: existing?.mainSolution || '',
    keyFeatures: existing?.keyFeatures || ['', '', ''],
    uniqueValue: existing?.uniqueValue || '',
    howItWorks: existing?.howItWorks || '',
  });

  const addFeature = () => {
    if (formData.keyFeatures.length < 5) {
      setFormData({ ...formData, keyFeatures: [...formData.keyFeatures, ''] });
    }
  };

  const updateFeature = (index: number, value: string) => {
    const updated = [...formData.keyFeatures];
    updated[index] = value;
    setFormData({ ...formData, keyFeatures: updated });
  };

  const removeFeature = (index: number) => {
    if (formData.keyFeatures.length > 2) {
      setFormData({ ...formData, keyFeatures: formData.keyFeatures.filter((_, i) => i !== index) });
    }
  };

  const handleSubmit = () => {
    if (currentProject) {
      const updatedProject = {
        ...currentProject,
        _tempSolution: {
          mainSolution: formData.mainSolution,
          keyFeatures: formData.keyFeatures.filter(f => f.trim()),
          uniqueValue: formData.uniqueValue,
          howItWorks: formData.howItWorks,
        },
        updatedAt: Date.now(),
      };
      updateProject(updatedProject as any);
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Context */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <p className="text-sm text-zinc-300">
          Your <span className="text-indigo-400 font-medium">Solution slide</span> should directly address
          the problem you just described. Make it clear and compelling.
        </p>
      </div>

      {/* Main Solution */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          What's your solution? *
        </label>
        <div className="relative">
          <textarea
            value={formData.mainSolution}
            onChange={(e) => setFormData({ ...formData, mainSolution: e.target.value })}
            placeholder="e.g., An AI-powered bookkeeping assistant that automatically categorizes transactions, generates reports, and finds tax deductions."
            rows={3}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <button
            type="button"
            className="absolute right-2 bottom-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-xs flex items-center gap-1 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            Improve
          </button>
        </div>
      </div>

      {/* Key Features */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-zinc-300">
            Key Features
            <span className="text-zinc-500 font-normal ml-2">(3-5 features)</span>
          </label>
          {formData.keyFeatures.length < 5 && (
            <button
              onClick={addFeature}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Feature
            </button>
          )}
        </div>
        <div className="space-y-2">
          {formData.keyFeatures.map((feature, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={feature}
                onChange={(e) => updateFeature(index, e.target.value)}
                placeholder={`Feature ${index + 1}: e.g., "Automatic receipt scanning"`}
                className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {formData.keyFeatures.length > 2 && (
                <button
                  onClick={() => removeFeature(index)}
                  className="p-2.5 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Unique Value Proposition */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          What makes you different? *
          <span className="text-zinc-500 font-normal ml-2">(Your unique value proposition)</span>
        </label>
        <textarea
          value={formData.uniqueValue}
          onChange={(e) => setFormData({ ...formData, uniqueValue: e.target.value })}
          placeholder="e.g., Unlike generic accounting software, we're built specifically for solopreneurs - simple enough to use in 5 minutes, smart enough to save hours."
          rows={2}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* How it Works */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          How does it work?
          <span className="text-zinc-500 font-normal ml-2">(Simple explanation)</span>
        </label>
        <textarea
          value={formData.howItWorks}
          onChange={(e) => setFormData({ ...formData, howItWorks: e.target.value })}
          placeholder="e.g., 1) Connect your bank account 2) AI categorizes all transactions 3) Get monthly reports and tax estimates automatically"
          rows={3}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        <p className="text-xs text-zinc-500 mt-1">
          Think: How would you explain this to your mom in 30 seconds?
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
          Continue to Market
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
