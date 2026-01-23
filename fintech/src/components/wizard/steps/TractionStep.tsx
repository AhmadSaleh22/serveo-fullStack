import { useState } from 'react';
import { useStartup } from '../../../context/StartupContext';
import { ArrowRight, ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function TractionStep({ onNext, onBack }: Props) {
  const { currentProject, updateProject } = useStartup();
  const existing = currentProject?.pitchDeck?.inputs?.traction;

  const [formData, setFormData] = useState({
    hasLaunched: existing?.hasLaunched ?? false,
    users: existing?.users || 0,
    revenue: existing?.revenue || 0,
    growth: existing?.growth || '',
    waitlist: existing?.waitlist || 0,
    milestones: existing?.milestones || [''],
  });

  const addMilestone = () => {
    if (formData.milestones.length < 5) {
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

  const handleSubmit = () => {
    if (currentProject) {
      const updatedProject = {
        ...currentProject,
        _tempTraction: {
          hasLaunched: formData.hasLaunched,
          users: formData.users || undefined,
          revenue: formData.revenue || undefined,
          growth: formData.growth || undefined,
          waitlist: formData.waitlist || undefined,
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
      {/* Launch Status */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          Have you launched?
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, hasLaunched: true })}
            className={`px-4 py-3 rounded-lg border text-center transition-all ${
              formData.hasLaunched
                ? 'border-indigo-500 bg-indigo-500/20 text-white'
                : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            Yes, we're live
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, hasLaunched: false })}
            className={`px-4 py-3 rounded-lg border text-center transition-all ${
              !formData.hasLaunched
                ? 'border-indigo-500 bg-indigo-500/20 text-white'
                : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            Not yet (pre-launch)
          </button>
        </div>
      </div>

      {/* Metrics - shown if launched */}
      {formData.hasLaunched && (
        <div className="space-y-4 border-t border-zinc-800 pt-6">
          <h3 className="text-sm font-medium text-zinc-300">Your Metrics</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Total Users/Customers</label>
              <input
                type="number"
                value={formData.users || ''}
                onChange={(e) => setFormData({ ...formData, users: Number(e.target.value) })}
                placeholder="e.g., 500"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Monthly Revenue</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                <input
                  type="number"
                  value={formData.revenue || ''}
                  onChange={(e) => setFormData({ ...formData, revenue: Number(e.target.value) })}
                  placeholder="e.g., 5000"
                  className="w-full pl-7 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Growth Rate</label>
            <input
              type="text"
              value={formData.growth}
              onChange={(e) => setFormData({ ...formData, growth: e.target.value })}
              placeholder="e.g., 20% MoM or 3x in 6 months"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Pre-launch metrics */}
      {!formData.hasLaunched && (
        <div className="space-y-4 border-t border-zinc-800 pt-6">
          <h3 className="text-sm font-medium text-zinc-300">Pre-launch Traction</h3>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Waitlist Size</label>
            <input
              type="number"
              value={formData.waitlist || ''}
              onChange={(e) => setFormData({ ...formData, waitlist: Number(e.target.value) })}
              placeholder="e.g., 1000"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Milestones */}
      <div className="border-t border-zinc-800 pt-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-zinc-300">
            Key Milestones / Achievements
          </label>
          {formData.milestones.length < 5 && (
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
                    ? "e.g., Completed MVP in 3 months"
                    : index === 1
                    ? "e.g., Featured in TechCrunch"
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
        <p className="text-xs text-zinc-500 mt-2">
          Include: product milestones, press coverage, partnerships, awards, key hires
        </p>
      </div>

      {/* Tips for pre-launch */}
      {!formData.hasLaunched && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-amber-300 mb-2">Pre-launch? That's OK!</h4>
          <p className="text-xs text-zinc-400">
            Focus on showing progress: customer interviews conducted, LOIs signed, partnerships in discussion,
            prototype demos, or technical achievements. Investors invest in momentum.
          </p>
        </div>
      )}

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
          Continue to Team
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
