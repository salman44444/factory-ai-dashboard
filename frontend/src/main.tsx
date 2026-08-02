import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import LandingPage from './pages/LandingPage.tsx'

type View = 'landing' | 'dashboard';

function Root() {
  const [view, setView] = useState<View>('landing');

  if (view === 'dashboard') {
    return <App onBack={() => setView('landing')} />;
  }
  return <LandingPage onLaunch={() => setView('dashboard')} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

