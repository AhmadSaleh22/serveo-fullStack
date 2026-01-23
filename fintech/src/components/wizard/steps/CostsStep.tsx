import { useState } from 'react';
import { useStartup } from '../../../context/StartupContext';
import { ArrowRight, ArrowLeft, Plus, Trash2, Users } from 'lucide-react';
import type { TeamMember, CostCategory } from '../../../types/startup';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const DEFAULT_ROLES = [
  { role: 'Founder/CEO', salary: 60000, isFounder: true },
  { role: 'CTO/Tech Lead', salary: 80000, isFounder: true },
  { role: 'Developer', salary: 70000, isFounder: false },
  { role: 'Designer', salary: 60000, isFounder: false },
  { role: 'Marketing', salary: 55000, isFounder: false },
  { role: 'Sales', salary: 50000, isFounder: false },
];

export function CostsStep({ onNext, onBack }: Props) {
  const { currentProject, updateProject } = useStartup();
  const existingCosts = currentProject?.financialModel?.inputs?.costs;

  const [team, setTeam] = useState<TeamMember[]>(
    existingCosts?.team || [
      { id: '1', role: 'Founder', salary: 0, startMonth: 1, isFounder: true },
    ]
  );

  const [costs, setCosts] = useState({
    hosting: existingCosts?.hosting || 100,
    tools: existingCosts?.tools || 200,
    marketing: existingCosts?.marketing || 500,
    legal: existingCosts?.legal || 2000,
    office: existingCosts?.office || 0,
  });

  const [funding, setFunding] = useState({
    initialCash: (currentProject as any)?._tempFunding?.initialCash || 10000,
    plannedRaise: (currentProject as any)?._tempFunding?.plannedRaise || 500000,
  });

  const addTeamMember = () => {
    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      role: '',
      salary: 60000,
      startMonth: 1,
      isFounder: false,
    };
    setTeam([...team, newMember]);
  };

  const updateTeamMember = (id: string, updates: Partial<TeamMember>) => {
    setTeam(team.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const removeTeamMember = (id: string) => {
    setTeam(team.filter(m => m.id !== id));
  };

  const calculateMonthlyBurn = () => {
    const teamCost = team.reduce((sum, m) => sum + m.salary / 12, 0);
    const opsCost = costs.hosting + costs.tools + costs.marketing + costs.office + costs.legal / 12;
    return teamCost + opsCost;
  };

  const handleSubmit = () => {
    const costInputs = {
      team,
      categories: [] as CostCategory[],
      hosting: costs.hosting,
      tools: costs.tools,
      marketing: costs.marketing,
      legal: costs.legal,
      office: costs.office,
    };

    if (currentProject) {
      const updatedProject = {
        ...currentProject,
        _tempCostInputs: costInputs,
        _tempFunding: funding,
        updatedAt: Date.now(),
      };
      updateProject(updatedProject as any);
    }

    onNext();
  };

  const monthlyBurn = calculateMonthlyBurn();
  const runway = funding.plannedRaise > 0 ? Math.floor((funding.initialCash + funding.plannedRaise) / monthlyBurn) : 0;

  return (
    <div className="space-y-6">
      {/* Team Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-medium">Team</h3>
          </div>
          <button
            onClick={addTeamMember}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm flex items-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>

        <div className="space-y-3">
          {team.map((member, index) => (
            <div key={member.id} className="flex gap-3 items-start bg-zinc-900 p-4 rounded-lg border border-zinc-800">
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Role</label>
                  <select
                    value={member.role}
                    onChange={(e) => {
                      const preset = DEFAULT_ROLES.find(r => r.role === e.target.value);
                      updateTeamMember(member.id, {
                        role: e.target.value,
                        salary: preset?.salary || member.salary,
                        isFounder: preset?.isFounder || false,
                      });
                    }}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select role...</option>
                    {DEFAULT_ROLES.map(r => (
                      <option key={r.role} value={r.role}>{r.role}</option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Annual Salary</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                    <input
                      type="number"
                      value={member.salary}
                      onChange={(e) => updateTeamMember(member.id, { salary: Number(e.target.value) })}
                      className="w-full pl-7 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Start Month</label>
                  <select
                    value={member.startMonth}
                    onChange={(e) => updateTeamMember(member.id, { startMonth: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[...Array(24)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>Month {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              {team.length > 1 && (
                <button
                  onClick={() => removeTeamMember(member.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Operating Costs */}
      <div className="border-t border-zinc-800 pt-6">
        <h3 className="text-lg font-medium mb-4">Monthly Operating Costs</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-300 mb-2">Hosting/Infrastructure</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
              <input
                type="number"
                value={costs.hosting}
                onChange={(e) => setCosts({ ...costs, hosting: Number(e.target.value) })}
                className="w-full pl-7 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-2">Software/Tools</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
              <input
                type="number"
                value={costs.tools}
                onChange={(e) => setCosts({ ...costs, tools: Number(e.target.value) })}
                className="w-full pl-7 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-2">Marketing/Ads</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
              <input
                type="number"
                value={costs.marketing}
                onChange={(e) => setCosts({ ...costs, marketing: Number(e.target.value) })}
                className="w-full pl-7 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-2">Legal/Accounting (Annual)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
              <input
                type="number"
                value={costs.legal}
                onChange={(e) => setCosts({ ...costs, legal: Number(e.target.value) })}
                className="w-full pl-7 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Funding */}
      <div className="border-t border-zinc-800 pt-6">
        <h3 className="text-lg font-medium mb-4">Funding</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-300 mb-2">Cash on Hand</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
              <input
                type="number"
                value={funding.initialCash}
                onChange={(e) => setFunding({ ...funding, initialCash: Number(e.target.value) })}
                className="w-full pl-7 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-2">Planned Raise Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
              <input
                type="number"
                value={funding.plannedRaise}
                onChange={(e) => setFunding({ ...funding, plannedRaise: Number(e.target.value) })}
                className="w-full pl-7 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
        <h4 className="text-sm font-medium text-indigo-300 mb-3">Burn Rate Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-white">${Math.round(monthlyBurn).toLocaleString()}</p>
            <p className="text-xs text-zinc-400">Monthly Burn</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">${Math.round(monthlyBurn * 12).toLocaleString()}</p>
            <p className="text-xs text-zinc-400">Annual Burn</p>
          </div>
          <div>
            <p className={`text-xl font-bold ${runway >= 18 ? 'text-green-400' : runway >= 12 ? 'text-yellow-400' : 'text-red-400'}`}>
              {runway} months
            </p>
            <p className="text-xs text-zinc-400">Runway (after raise)</p>
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
          Continue to Pitch Deck
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
