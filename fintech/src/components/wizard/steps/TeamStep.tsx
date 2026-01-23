import { useState } from 'react';
import { useStartup } from '../../../context/StartupContext';
import { ArrowRight, ArrowLeft, Plus, Trash2, User } from 'lucide-react';
import type { TeamMemberInfo } from '../../../types/startup';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function TeamStep({ onNext, onBack }: Props) {
  const { currentProject, updateProject } = useStartup();
  const existing = currentProject?.pitchDeck?.inputs?.team;

  const [team, setTeam] = useState<TeamMemberInfo[]>(
    existing || [
      { name: '', role: 'CEO / Founder', background: '', linkedin: '' },
    ]
  );

  const addMember = () => {
    if (team.length < 5) {
      setTeam([...team, { name: '', role: '', background: '', linkedin: '' }]);
    }
  };

  const updateMember = (index: number, updates: Partial<TeamMemberInfo>) => {
    const updated = [...team];
    updated[index] = { ...updated[index], ...updates };
    setTeam(updated);
  };

  const removeMember = (index: number) => {
    if (team.length > 1) {
      setTeam(team.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    if (currentProject) {
      const updatedProject = {
        ...currentProject,
        _tempTeam: team.filter(m => m.name.trim()),
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
          Investors bet on <span className="text-indigo-400 font-medium">people</span> as much as ideas.
          Highlight relevant experience and why you're the right team to solve this problem.
        </p>
      </div>

      {/* Team Members */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Founding Team</h3>
          {team.length < 5 && (
            <button
              onClick={addMember}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </button>
          )}
        </div>

        <div className="space-y-4">
          {team.map((member, index) => (
            <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-start gap-4">
                {/* Avatar placeholder */}
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-8 h-8 text-zinc-600" />
                </div>

                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Name *</label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => updateMember(index, { name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Role *</label>
                      <input
                        type="text"
                        value={member.role}
                        onChange={(e) => updateMember(index, { role: e.target.value })}
                        placeholder="CEO / Co-founder"
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Background *</label>
                    <input
                      type="text"
                      value={member.background}
                      onChange={(e) => updateMember(index, { background: e.target.value })}
                      placeholder="Ex-Google, 10 years in fintech, Stanford MBA"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      Include: past companies, relevant experience, education highlights
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={member.linkedin}
                      onChange={(e) => updateMember(index, { linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/johndoe"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {team.length > 1 && (
                  <button
                    onClick={() => removeMember(index)}
                    className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
        <h4 className="text-sm font-medium text-amber-300 mb-2">Tips for Team Slide</h4>
        <ul className="text-xs text-zinc-400 space-y-1">
          <li>• Lead with impressive credentials (FAANG, top schools, successful exits)</li>
          <li>• Show domain expertise - why are YOU the right team for THIS problem?</li>
          <li>• Highlight complementary skills (technical + business)</li>
          <li>• If solo founder, mention key advisors or planned hires</li>
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
          Continue to Funding Ask
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
