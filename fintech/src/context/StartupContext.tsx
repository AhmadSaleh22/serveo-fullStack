import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type {
  StartupProject,
  BusinessProfile,
  FinancialModel,
  PitchDeck,
  WizardStep,
  ClippedData,
  FinancialModelInputs,
  PitchDeckInputs,
} from '../types/startup';
import { generateFinancialProjections } from '../utils/financialCalculations';
import { generatePitchSlides } from '../utils/pitchDeckGenerator';

// ============ CONTEXT TYPE ============

interface StartupContextType {
  // Current project
  currentProject: StartupProject | null;
  projects: StartupProject[];

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Navigation
  activeView: 'home' | 'wizard' | 'financial' | 'pitch' | 'chat';
  setActiveView: (view: 'home' | 'wizard' | 'financial' | 'pitch' | 'chat') => void;

  // Wizard
  wizardStep: WizardStep;
  setWizardStep: (step: WizardStep) => void;
  completedSteps: WizardStep[];

  // Project actions
  createProject: (profile: BusinessProfile) => StartupProject;
  updateProject: (project: StartupProject) => void;
  deleteProject: (projectId: string) => void;
  selectProject: (projectId: string) => void;

  // Financial model
  generateFinancialModel: (inputs: FinancialModelInputs) => void;
  updateFinancialModel: (model: FinancialModel) => void;

  // Pitch deck
  generatePitchDeck: (inputs: PitchDeckInputs) => void;
  updatePitchDeck: (deck: PitchDeck) => void;

  // Clipped data
  clippedData: ClippedData[];
  addClippedData: (data: ClippedData) => void;
  removeClippedData: (id: string) => void;

  // Loading states
  isGenerating: boolean;
}

const StartupContext = createContext<StartupContextType | undefined>(undefined);

// ============ PROVIDER ============

export function StartupProvider({ children }: { children: ReactNode }) {
  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });

  // Projects
  const [projects, setProjects] = useState<StartupProject[]>([]);
  const [currentProject, setCurrentProject] = useState<StartupProject | null>(null);

  // Navigation
  const [activeView, setActiveView] = useState<'home' | 'wizard' | 'financial' | 'pitch' | 'chat'>('home');

  // Wizard
  const [wizardStep, setWizardStep] = useState<WizardStep>('profile');
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);

  // Clipped data
  const [clippedData, setClippedData] = useState<ClippedData[]>([]);

  // Loading
  const [isGenerating, setIsGenerating] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try Chrome storage first (for extension)
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['projects', 'currentProjectId', 'theme'], (result) => {
            if (result.projects) {
              setProjects(result.projects);
              if (result.currentProjectId) {
                const project = result.projects.find((p: StartupProject) => p.id === result.currentProjectId);
                if (project) setCurrentProject(project);
              }
            }
            if (result.theme) setTheme(result.theme);
          });
        } else {
          // Fallback to localStorage
          const stored = localStorage.getItem('startupkit_projects');
          if (stored) {
            const parsed = JSON.parse(stored);
            setProjects(parsed);
          }
        }
      } catch (e) {
        console.error('Failed to load data:', e);
      }
    };
    loadData();
  }, []);

  // Save to storage on changes
  useEffect(() => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({
          projects,
          currentProjectId: currentProject?.id,
          theme,
        });
      } else {
        localStorage.setItem('startupkit_projects', JSON.stringify(projects));
        localStorage.setItem('theme', theme);
      }
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }, [projects, currentProject, theme]);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // ============ ACTIONS ============

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const createProject = (profile: BusinessProfile): StartupProject => {
    const newProject: StartupProject = {
      id: crypto.randomUUID(),
      profile,
      clippedData: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProjects(prev => [...prev, newProject]);
    setCurrentProject(newProject);
    return newProject;
  };

  const updateProject = (project: StartupProject) => {
    const updated = { ...project, updatedAt: Date.now() };
    setProjects(prev => prev.map(p => p.id === project.id ? updated : p));
    if (currentProject?.id === project.id) {
      setCurrentProject(updated);
    }
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
    }
  };

  const selectProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
    }
  };

  const generateFinancialModel = (inputs: FinancialModelInputs) => {
    if (!currentProject) return;

    setIsGenerating(true);

    // Simulate AI generation delay
    setTimeout(() => {
      const projections = generateFinancialProjections(inputs);
      const model: FinancialModel = {
        id: crypto.randomUUID(),
        projectId: currentProject.id,
        inputs,
        projections: projections.monthly,
        summary: projections.summary,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updated = { ...currentProject, financialModel: model, updatedAt: Date.now() };
      updateProject(updated);
      setIsGenerating(false);
    }, 1500);
  };

  const updateFinancialModel = (model: FinancialModel) => {
    if (!currentProject) return;
    const updated = { ...currentProject, financialModel: model, updatedAt: Date.now() };
    updateProject(updated);
  };

  const generatePitchDeck = (inputs: PitchDeckInputs) => {
    if (!currentProject) return;

    setIsGenerating(true);

    setTimeout(() => {
      const slides = generatePitchSlides(inputs, currentProject.profile, currentProject.financialModel);
      const deck: PitchDeck = {
        id: crypto.randomUUID(),
        projectId: currentProject.id,
        inputs,
        slides,
        theme: 'modern',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updated = { ...currentProject, pitchDeck: deck, updatedAt: Date.now() };
      updateProject(updated);
      setIsGenerating(false);
    }, 1500);
  };

  const updatePitchDeck = (deck: PitchDeck) => {
    if (!currentProject) return;
    const updated = { ...currentProject, pitchDeck: deck, updatedAt: Date.now() };
    updateProject(updated);
  };

  const addClippedData = (data: ClippedData) => {
    setClippedData(prev => [...prev, data]);
    if (currentProject) {
      const updated = {
        ...currentProject,
        clippedData: [...currentProject.clippedData, data],
        updatedAt: Date.now(),
      };
      updateProject(updated);
    }
  };

  const removeClippedData = (id: string) => {
    setClippedData(prev => prev.filter(d => d.id !== id));
    if (currentProject) {
      const updated = {
        ...currentProject,
        clippedData: currentProject.clippedData.filter(d => d.id !== id),
        updatedAt: Date.now(),
      };
      updateProject(updated);
    }
  };

  const markStepCompleted = (step: WizardStep) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps(prev => [...prev, step]);
    }
  };

  const handleSetWizardStep = (step: WizardStep) => {
    // Mark current step as completed when moving forward
    const steps: WizardStep[] = ['profile', 'revenue', 'costs', 'problem', 'solution', 'market', 'traction', 'team', 'funding', 'review'];
    const currentIndex = steps.indexOf(wizardStep);
    const newIndex = steps.indexOf(step);
    if (newIndex > currentIndex) {
      markStepCompleted(wizardStep);
    }
    setWizardStep(step);
  };

  return (
    <StartupContext.Provider
      value={{
        currentProject,
        projects,
        theme,
        toggleTheme,
        activeView,
        setActiveView,
        wizardStep,
        setWizardStep: handleSetWizardStep,
        completedSteps,
        createProject,
        updateProject,
        deleteProject,
        selectProject,
        generateFinancialModel,
        updateFinancialModel,
        generatePitchDeck,
        updatePitchDeck,
        clippedData,
        addClippedData,
        removeClippedData,
        isGenerating,
      }}
    >
      {children}
    </StartupContext.Provider>
  );
}

// ============ HOOK ============

export function useStartup() {
  const context = useContext(StartupContext);
  if (!context) {
    throw new Error('useStartup must be used within a StartupProvider');
  }
  return context;
}
