import { useState } from 'react';
import { useStartup } from '../../../context/StartupContext';
import { ArrowRight, ArrowLeft, Plus, Trash2, Sparkles } from 'lucide-react';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function ProblemStep({ onNext, onBack }: Props) {
  const { currentProject, updateProject } = useStartup();
  const existing = currentProject?.pitchDeck?.inputs?.problem;

  const [formData, setFormData] = useState({
    mainProblem: existing?.mainProblem || '',
    painPoints: existing?.painPoints || ['', ''],
    currentSolutions: existing?.currentSolutions || '',
    whyNow: existing?.whyNow || '',
  });

  const addPainPoint = () => {
    if (formData.painPoints.length < 4) {
      setFormData({ ...formData, painPoints: [...formData.painPoints, ''] });
    }
  };

  const updatePainPoint = (index: number, value: string) => {
    const updated = [...formData.painPoints];
    updated[index] = value;
    setFormData({ ...formData, painPoints: updated });
  };

  const removePainPoint = (index: number) => {
    if (formData.painPoints.length > 1) {
      setFormData({ ...formData, painPoints: formData.painPoints.filter((_, i) => i !== index) });
    }
  };

  const handleSubmit = () => {
    if (currentProject) {
      const updatedProject = {
        ...currentProject,
        _tempProblem: {
          mainProblem: formData.mainProblem,
          painPoints: formData.painPoints.filter(p => p.trim()),
          currentSolutions: formData.currentSolutions,
          whyNow: formData.whyNow,
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
          This will become your <span className="text-indigo-400 font-medium">Problem slide</span> -
          one of the most important slides in your deck. Investors need to feel the pain.
        </p>
      </div>

      {/* Main Problem */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          What's the main problem you're solving? *
        </label>
        <div className="relative">
          <textarea
            value={formData.mainProblem}
            onChange={(e) => setFormData({ ...formData, mainProblem: e.target.value })}
            placeholder="e.g., Small businesses waste 10+ hours/week on manual bookkeeping, leading to errors and missed tax deductions."
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
        <p className="text-xs text-zinc-500 mt-1">
          Be specific. Include numbers if you have them.
        </p>
      </div>

      {/* Pain Points */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-zinc-300">
            Key Pain Points
            <span className="text-zinc-500 font-normal ml-2">(2-4 bullet points)</span>
          </label>
          {formData.painPoints.length < 4 && (
            <button
              onClick={addPainPoint}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Point
            </button>
          )}
        </div>
        <div className="space-y-2">
          {formData.painPoints.map((point, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={point}
                onChange={(e) => updatePainPoint(index, e.target.value)}
                placeholder={`Pain point ${index + 1}`}
                className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {formData.painPoints.length > 1 && (
                <button
                  onClick={() => removePainPoint(index)}
                  className="p-2.5 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Solutions */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          How do people solve this today?
        </label>
        <textarea
          value={formData.currentSolutions}
          onChange={(e) => setFormData({ ...formData, currentSolutions: e.target.value })}
          placeholder="e.g., Manual spreadsheets, hiring expensive accountants, or using complex software not designed for small businesses."
          rows={2}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* Why Now */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Why is now the right time?
          <span className="text-zinc-500 font-normal ml-2">(Market timing)</span>
        </label>
        <textarea
          value={formData.whyNow}
          onChange={(e) => setFormData({ ...formData, whyNow: e.target.value })}
          placeholder="e.g., AI has finally made it possible to automate complex accounting tasks, and the gig economy has created millions of new small businesses."
          rows={2}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* Tips */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
        <h4 className="text-sm font-medium text-amber-300 mb-2">Tips for a Strong Problem Slide</h4>
        <ul className="text-xs text-zinc-400 space-y-1">
          <li>• Use specific numbers: "10 hours/week" not "a lot of time"</li>
          <li>• Show the cost of the problem: money lost, time wasted, opportunities missed</li>
          <li>• Make it relatable - investors should feel the pain</li>
          <li>• Avoid jargon - keep it simple</li>
        </ul>
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
          Continue to Solution
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
