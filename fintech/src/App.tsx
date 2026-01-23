import { StartupProvider, useStartup } from './context/StartupContext';
import { Home } from './components/Home';
import { Wizard } from './components/wizard/Wizard';
import { FinancialModelView } from './components/FinancialModelView';
import { PitchDeckView } from './components/PitchDeckView';
import './index.css';

function AppContent() {
  const { activeView } = useStartup();

  switch (activeView) {
    case 'home':
      return <Home />;
    case 'wizard':
      return <Wizard />;
    case 'financial':
      return <FinancialModelView />;
    case 'pitch':
      return <PitchDeckView />;
    default:
      return <Home />;
  }
}

function App() {
  return (
    <StartupProvider>
      <AppContent />
    </StartupProvider>
  );
}

export default App;
