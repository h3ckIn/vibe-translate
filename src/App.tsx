import { useEffect } from 'react';
import { useApp } from './store/useApp';
import { useAuth } from './store/useAuth';
import { Topbar } from './components/Topbar';
import { Sidebar } from './components/Sidebar';
import { TranslationPanel } from './components/TranslationPanel';
import { Workbench } from './components/Workbench';
import { MemoryPage } from './components/MemoryPage';
import { CorpusPage } from './components/CorpusPage';
import { GlossaryPage } from './components/GlossaryPage';
import { TasksPage } from './components/TasksPage';
import { SubtitlePage } from './components/SubtitlePage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';

export default function App() {
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);
  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    if (!isAuthenticated && view !== 'login' && view !== 'register') {
      setView('login');
    }
  }, [isAuthenticated, view, setView]);

  if (view === 'login') return <LoginPage />;
  if (view === 'register') return <RegisterPage />;

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col text-ink">
      <Topbar />
      <main className="flex-1 mx-auto w-full max-w-[1480px] px-6 pb-16">
        {view === 'workbench' && <Workbench />}
        {view === 'memory' && <MemoryPage />}
        {view === 'corpus' && <CorpusPage />}
        {view === 'glossary' && <GlossaryPage />}
        {view === 'tasks' && <TasksPage />}
        {view === 'subtitle' && <SubtitlePage />}
      </main>
      <footer className="text-center text-xs text-ink/40 pb-6">
        Vibe Translate · Crafted with Vibe Coding · 2026
      </footer>
    </div>
  );
}

export { Sidebar, TranslationPanel };
