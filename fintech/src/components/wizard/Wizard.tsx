import { useStartup } from '../../context/StartupContext';
import type { WizardStep } from '../../types/startup';
import { ProfileStep } from './steps/ProfileStep';
import { RevenueStep } from './steps/RevenueStep';
import { CostsStep } from './steps/CostsStep';
import { ProblemStep } from './steps/ProblemStep';
import { SolutionStep } from './steps/SolutionStep';
import { MarketStep } from './steps/MarketStep';
import { TractionStep } from './steps/TractionStep';
import { TeamStep } from './steps/TeamStep';
import { FundingStep } from './steps/FundingStep';
import { ReviewStep } from './steps/ReviewStep';
import {
  Building2,
  DollarSign,
  Calculator,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  Rocket,
  Users,
  Banknote,
  CheckCircle,
  ChevronLeft
} from 'lucide-react';

const STEPS: { id: WizardStep; label: string; icon: typeof Building2; section: 'business' | 'financial' | 'pitch' }[] = [
  { id: 'profile', label: 'Business Profile', icon: Building2, section: 'business' },
  { id: 'revenue', label: 'Revenue Model', icon: DollarSign, section: 'financial' },
  { id: 'costs', label: 'Costs & Team', icon: Calculator, section: 'financial' },
  { id: 'problem', label: 'Problem', icon: AlertCircle, section: 'pitch' },
  { id: 'solution', label: 'Solution', icon: Lightbulb, section: 'pitch' },
  { id: 'market', label: 'Market', icon: TrendingUp, section: 'pitch' },
  { id: 'traction', label: 'Traction', icon: Rocket, section: 'pitch' },
  { id: 'team', label: 'Team', icon: Users, section: 'pitch' },
  { id: 'funding', label: 'Funding Ask', icon: Banknote, section: 'pitch' },
  { id: 'review', label: 'Review & Export', icon: CheckCircle, section: 'business' },
];

export function Wizard() {
  const { wizardStep, setWizardStep, completedSteps, setActiveView, currentProject } = useStartup();

  const currentIndex = STEPS.findIndex(s => s.id === wizardStep);
  const currentStepData = STEPS[currentIndex];

  const goBack = () => {
    if (currentIndex === 0) {
      setActiveView('home');
    } else {
      setWizardStep(STEPS[currentIndex - 1].id);
    }
  };

  const goNext = () => {
    if (currentIndex < STEPS.length - 1) {
      setWizardStep(STEPS[currentIndex + 1].id);
    }
  };

  const isStepAccessible = (stepId: WizardStep) => {
    const stepIndex = STEPS.findIndex(s => s.id === stepId);
    // Can access if: it's completed, it's current, or it's the next step after current
    return completedSteps.includes(stepId) || stepIndex <= currentIndex || stepIndex === currentIndex + 1;
  };

  const renderStep = () => {
    switch (wizardStep) {
      case 'profile':
        return <ProfileStep onNext={goNext} />;
      case 'revenue':
        return <RevenueStep onNext={goNext} onBack={goBack} />;
      case 'costs':
        return <CostsStep onNext={goNext} onBack={goBack} />;
      case 'problem':
        return <ProblemStep onNext={goNext} onBack={goBack} />;
      case 'solution':
        return <SolutionStep onNext={goNext} onBack={goBack} />;
      case 'market':
        return <MarketStep onNext={goNext} onBack={goBack} />;
      case 'traction':
        return <TractionStep onNext={goNext} onBack={goBack} />;
      case 'team':
        return <TeamStep onNext={goNext} onBack={goBack} />;
      case 'funding':
        return <FundingStep onNext={goNext} onBack={goBack} />;
      case 'review':
        return <ReviewStep onBack={goBack} />;
      default:
        return <ProfileStep onNext={goNext} />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Sidebar - Step Navigation */}
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 p-4 flex flex-col">
        <button
          onClick={() => setActiveView('home')}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </button>

        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">
            {currentProject?.profile?.name || 'New Startup'}
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Setup Wizard</p>
        </div>

        {/* Progress sections */}
        <div className="space-y-6 flex-1">
          {/* Financial Model Section */}
          <div>
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Financial Model
            </h3>
            <div className="space-y-1">
              {STEPS.filter(s => s.section === 'business' || s.section === 'financial').slice(0, 3).map((step, index) => {
                const Icon = step.icon;
                const isActive = wizardStep === step.id;
                const isCompleted = completedSteps.includes(step.id);
                const accessible = isStepAccessible(step.id);

                return (
                  <button
                    key={step.id}
                    onClick={() => accessible && setWizardStep(step.id)}
                    disabled={!accessible}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : isCompleted
                        ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        : accessible
                        ? 'text-zinc-400 hover:bg-zinc-800'
                        : 'text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{step.label}</span>
                    {isCompleted && !isActive && (
                      <CheckCircle className="w-3 h-3 ml-auto text-green-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pitch Deck Section */}
          <div>
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Pitch Deck
            </h3>
            <div className="space-y-1">
              {STEPS.filter(s => s.section === 'pitch').map((step) => {
                const Icon = step.icon;
                const isActive = wizardStep === step.id;
                const isCompleted = completedSteps.includes(step.id);
                const accessible = isStepAccessible(step.id);

                return (
                  <button
                    key={step.id}
                    onClick={() => accessible && setWizardStep(step.id)}
                    disabled={!accessible}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : isCompleted
                        ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        : accessible
                        ? 'text-zinc-400 hover:bg-zinc-800'
                        : 'text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{step.label}</span>
                    {isCompleted && !isActive && (
                      <CheckCircle className="w-3 h-3 ml-auto text-green-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Review Section */}
          <div>
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Finalize
            </h3>
            <div className="space-y-1">
              {STEPS.filter(s => s.id === 'review').map((step) => {
                const Icon = step.icon;
                const isActive = wizardStep === step.id;
                const isCompleted = completedSteps.includes(step.id);
                const accessible = isStepAccessible(step.id);

                return (
                  <button
                    key={step.id}
                    onClick={() => accessible && setWizardStep(step.id)}
                    disabled={!accessible}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : isCompleted
                        ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        : accessible
                        ? 'text-zinc-400 hover:bg-zinc-800'
                        : 'text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-auto pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span>Progress</span>
            <span>{Math.round((completedSteps.length / (STEPS.length - 1)) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${(completedSteps.length / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto py-8 px-6">
          {/* Step Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              {currentStepData && <currentStepData.icon className="w-6 h-6 text-indigo-500" />}
              <h1 className="text-2xl font-bold">{currentStepData?.label}</h1>
            </div>
            <p className="text-zinc-400 text-sm">
              Step {currentIndex + 1} of {STEPS.length}
            </p>
          </div>

          {/* Step Content */}
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
