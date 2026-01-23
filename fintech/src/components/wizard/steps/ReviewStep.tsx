import { useState } from 'react';
import { useStartup } from '../../../context/StartupContext';
import {
  ArrowLeft,
  FileSpreadsheet,
  Presentation,
  Download,
  CheckCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '../../../utils/financialCalculations';

interface Props {
  onBack: () => void;
}

export function ReviewStep({ onBack }: Props) {
  const { currentProject, generateFinancialModel, generatePitchDeck, isGenerating, setActiveView } = useStartup();
  const [generating, setGenerating] = useState<'financial' | 'pitch' | null>(null);
  const [generated, setGenerated] = useState<{ financial: boolean; pitch: boolean }>({
    financial: !!currentProject?.financialModel,
    pitch: !!currentProject?.pitchDeck,
  });

  const profile = currentProject?.profile;
  const tempData = currentProject as any;

  const handleGenerateFinancial = async () => {
    if (!currentProject) return;

    setGenerating('financial');

    // Compile all the inputs
    const financialInputs = {
      revenue: tempData._tempRevenueInputs || {
        pricePerUnit: 29,
        pricingModel: 'monthly' as const,
        currentCustomers: 0,
        currentMRR: 0,
        monthlyGrowthRate: 0.15,
        churnRate: 0.05,
      },
      costs: tempData._tempCostInputs || {
        team: [],
        categories: [],
        hosting: 100,
        tools: 200,
        marketing: 500,
        legal: 2000,
        office: 0,
      },
      initialCash: tempData._tempFunding?.initialCash || 10000,
      plannedRaise: tempData._tempFunding?.plannedRaise || 500000,
      projectionMonths: 36 as const,
    };

    generateFinancialModel(financialInputs);

    // Simulate generation time
    setTimeout(() => {
      setGenerating(null);
      setGenerated(prev => ({ ...prev, financial: true }));
    }, 2000);
  };

  const handleGeneratePitch = async () => {
    if (!currentProject) return;

    setGenerating('pitch');

    // Compile pitch inputs
    const pitchInputs = {
      problem: tempData._tempProblem || {
        mainProblem: '',
        painPoints: [],
        currentSolutions: '',
        whyNow: '',
      },
      solution: tempData._tempSolution || {
        mainSolution: '',
        keyFeatures: [],
        uniqueValue: '',
        howItWorks: '',
      },
      market: tempData._tempMarket || {
        targetCustomer: '',
        tam: 0,
        sam: 0,
        som: 0,
        marketGrowthRate: 0.15,
      },
      traction: tempData._tempTraction || {
        hasLaunched: false,
        milestones: [],
      },
      competition: {
        competitors: [],
        yourAdvantage: tempData._tempSolution?.uniqueValue || '',
        moat: '',
      },
      team: tempData._tempTeam || [],
      funding: {
        amount: tempData._tempFunding?.plannedRaise || 500000,
        stage: tempData._tempFunding?.stage || 'pre_seed',
        useOfFunds: tempData._tempFunding?.useOfFunds || [],
        timeline: tempData._tempFunding?.timeline || '18 months',
        milestones: tempData._tempFunding?.milestones || [],
      },
    };

    generatePitchDeck(pitchInputs);

    setTimeout(() => {
      setGenerating(null);
      setGenerated(prev => ({ ...prev, pitch: true }));
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{profile?.name}</h2>
            <p className="text-sm text-zinc-400">{profile?.oneLiner}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
          <div>
            <p className="text-xs text-zinc-500">Industry</p>
            <p className="text-sm text-white capitalize">{profile?.industry}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Stage</p>
            <p className="text-sm text-white capitalize">{profile?.stage?.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Raising</p>
            <p className="text-sm text-white">{formatCurrency(tempData._tempFunding?.plannedRaise || 500000, true)}</p>
          </div>
        </div>
      </div>

      {/* Generate Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Generate Your Documents</h3>

        {/* Financial Model */}
        <div className={`border rounded-lg p-4 transition-all ${
          generated.financial ? 'border-green-500/50 bg-green-500/10' : 'border-zinc-800 bg-zinc-900'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              generated.financial ? 'bg-green-500/20' : 'bg-indigo-500/20'
            }`}>
              {generated.financial ? (
                <CheckCircle className="w-6 h-6 text-green-400" />
              ) : (
                <FileSpreadsheet className="w-6 h-6 text-indigo-400" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-white">Financial Model</h4>
              <p className="text-sm text-zinc-400 mt-1">
                3-year projections with revenue, costs, and key metrics. Export to Excel.
              </p>
              {generated.financial && currentProject?.financialModel && (
                <div className="mt-3 grid grid-cols-3 gap-4 text-center bg-zinc-800/50 rounded-lg p-3">
                  <div>
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(currentProject.financialModel.summary.year1Revenue, true)}
                    </p>
                    <p className="text-xs text-zinc-500">Year 1 Revenue</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(currentProject.financialModel.summary.year3Revenue, true)}
                    </p>
                    <p className="text-xs text-zinc-500">Year 3 Revenue</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">
                      {currentProject.financialModel.summary.breakEvenMonth || 'N/A'}
                    </p>
                    <p className="text-xs text-zinc-500">Break Even Month</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {generated.financial ? (
                <button
                  onClick={() => setActiveView('financial')}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              ) : (
                <button
                  onClick={handleGenerateFinancial}
                  disabled={generating !== null}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg text-sm flex items-center gap-2 transition-colors"
                >
                  {generating === 'financial' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pitch Deck */}
        <div className={`border rounded-lg p-4 transition-all ${
          generated.pitch ? 'border-green-500/50 bg-green-500/10' : 'border-zinc-800 bg-zinc-900'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              generated.pitch ? 'bg-green-500/20' : 'bg-indigo-500/20'
            }`}>
              {generated.pitch ? (
                <CheckCircle className="w-6 h-6 text-green-400" />
              ) : (
                <Presentation className="w-6 h-6 text-indigo-400" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-white">Pitch Deck</h4>
              <p className="text-sm text-zinc-400 mt-1">
                10-12 slide investor deck with all key sections. Export to PowerPoint.
              </p>
              {generated.pitch && currentProject?.pitchDeck && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {currentProject.pitchDeck.slides.slice(0, 6).map((slide) => (
                    <span key={slide.id} className="px-2 py-1 bg-zinc-800/50 rounded text-xs text-zinc-400">
                      {slide.title}
                    </span>
                  ))}
                  {currentProject.pitchDeck.slides.length > 6 && (
                    <span className="px-2 py-1 bg-zinc-800/50 rounded text-xs text-zinc-400">
                      +{currentProject.pitchDeck.slides.length - 6} more
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {generated.pitch ? (
                <button
                  onClick={() => setActiveView('pitch')}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              ) : (
                <button
                  onClick={handleGeneratePitch}
                  disabled={generating !== null}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg text-sm flex items-center gap-2 transition-colors"
                >
                  {generating === 'pitch' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generate Both */}
      {!generated.financial && !generated.pitch && (
        <button
          onClick={() => {
            handleGenerateFinancial();
            setTimeout(() => handleGeneratePitch(), 2500);
          }}
          disabled={generating !== null}
          className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
        >
          <Sparkles className="w-5 h-5" />
          Generate Both Documents
        </button>
      )}

      {/* Success state */}
      {generated.financial && generated.pitch && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <h4 className="text-lg font-medium text-white">All Documents Ready!</h4>
          <p className="text-sm text-zinc-400 mt-1">
            Your financial model and pitch deck have been generated. You can view, edit, and export them anytime.
          </p>
          <div className="flex gap-3 justify-center mt-4">
            <button
              onClick={() => setActiveView('financial')}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
            >
              View Financial Model
            </button>
            <button
              onClick={() => setActiveView('pitch')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm transition-colors"
            >
              View Pitch Deck
            </button>
          </div>
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
      </div>
    </div>
  );
}
