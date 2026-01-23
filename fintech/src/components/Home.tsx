import { useStartup } from '../context/StartupContext';
import {
  Plus,
  FileSpreadsheet,
  Presentation,
  Trash2,
  ChevronRight,
  Moon,
  Sun,
  Rocket,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '../utils/financialCalculations';

export function Home() {
  const {
    projects,
    currentProject,
    selectProject,
    deleteProject,
    setActiveView,
    theme,
    toggleTheme,
  } = useStartup();

  const handleNewProject = () => {
    setActiveView('wizard');
  };

  const handleOpenProject = (projectId: string) => {
    selectProject(projectId);
    // If project has generated content, go to view. Otherwise, go to wizard.
    const project = projects.find(p => p.id === projectId);
    if (project?.financialModel || project?.pitchDeck) {
      setActiveView('financial');
    } else {
      setActiveView('wizard');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">StartupKit</h1>
              <p className="text-xs text-zinc-500">Financial Models & Pitch Decks</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-zinc-400" />
            ) : (
              <Moon className="w-5 h-5 text-zinc-400" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Turn Your Startup Idea Into
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text"> Investor-Ready </span>
            Documents
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Generate professional financial models and pitch decks in minutes.
            AI-powered, founder-friendly, and designed to help you raise funding.
          </p>
        </div>

        {/* New Project CTA */}
        <div className="flex justify-center mb-12">
          <button
            onClick={handleNewProject}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl font-medium text-lg flex items-center gap-3 transition-all shadow-lg shadow-indigo-500/25"
          >
            <Plus className="w-6 h-6" />
            Create New Project
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="font-semibold mb-2">Financial Models</h3>
            <p className="text-sm text-zinc-400">
              3-year projections with revenue, costs, and key metrics. Export to Excel.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <Presentation className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-semibold mb-2">Pitch Decks</h3>
            <p className="text-sm text-zinc-400">
              Professional 10-12 slide decks with all key sections. Export to PowerPoint.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="font-semibold mb-2">AI-Powered</h3>
            <p className="text-sm text-zinc-400">
              Smart suggestions for content, realistic projections, and investor-ready formatting.
            </p>
          </div>
        </div>

        {/* Projects List */}
        {projects.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Your Projects</h3>
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`bg-zinc-900 border rounded-xl p-4 transition-all cursor-pointer hover:border-zinc-600 ${
                    currentProject?.id === project.id ? 'border-indigo-500' : 'border-zinc-800'
                  }`}
                  onClick={() => handleOpenProject(project.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center">
                        <span className="text-xl">
                          {project.profile.industry === 'saas' && '💻'}
                          {project.profile.industry === 'ecommerce' && '🛒'}
                          {project.profile.industry === 'services' && '🔧'}
                          {project.profile.industry === 'marketplace' && '🏪'}
                          {project.profile.industry === 'fintech' && '💳'}
                          {project.profile.industry === 'healthtech' && '🏥'}
                          {project.profile.industry === 'edtech' && '📚'}
                          {project.profile.industry === 'hardware' && '🔌'}
                          {project.profile.industry === 'other' && '🚀'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{project.profile.name}</h4>
                        <p className="text-sm text-zinc-400">{project.profile.oneLiner}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Status badges */}
                      <div className="flex gap-2">
                        {project.financialModel && (
                          <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs flex items-center gap-1">
                            <FileSpreadsheet className="w-3 h-3" />
                            Financial Model
                          </span>
                        )}
                        {project.pitchDeck && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs flex items-center gap-1">
                            <Presentation className="w-3 h-3" />
                            Pitch Deck
                          </span>
                        )}
                        {!project.financialModel && !project.pitchDeck && (
                          <span className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-xs">
                            Draft
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.id);
                        }}
                        className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <ChevronRight className="w-5 h-5 text-zinc-500" />
                    </div>
                  </div>

                  {/* Quick stats if model exists */}
                  {project.financialModel && (
                    <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-zinc-500">Year 1 Revenue</p>
                        <p className="text-sm font-medium text-white">
                          {formatCurrency(project.financialModel.summary.year1Revenue, true)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Year 3 Revenue</p>
                        <p className="text-sm font-medium text-white">
                          {formatCurrency(project.financialModel.summary.year3Revenue, true)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Break Even</p>
                        <p className="text-sm font-medium text-white">
                          {project.financialModel.summary.breakEvenMonth
                            ? `Month ${project.financialModel.summary.breakEvenMonth}`
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Raising</p>
                        <p className="text-sm font-medium text-white">
                          {formatCurrency(project.financialModel.inputs.plannedRaise, true)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium text-zinc-300 mb-2">No projects yet</h3>
            <p className="text-sm text-zinc-500 mb-4">
              Create your first project to get started
            </p>
            <button
              onClick={handleNewProject}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm transition-colors"
            >
              Create Project
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6">
        <div className="max-w-5xl mx-auto px-6 text-center text-sm text-zinc-500">
          StartupKit - Helping founders raise funding
        </div>
      </footer>
    </div>
  );
}
