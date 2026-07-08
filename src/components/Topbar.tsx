import { useApp } from '../store/useApp';
import { useAuth } from '../store/useAuth';
import { BookOpen, Captions, Database, History, Layers, LogIn, LogOut, Sparkles, User } from 'lucide-react';

const TABS: { id: any; label: string; icon: any }[] = [
  { id: 'workbench', label: '工作台', icon: Sparkles },
  { id: 'subtitle', label: '实时字幕', icon: Captions },
  { id: 'memory', label: '翻译记忆', icon: Layers },
  { id: 'corpus', label: '语料库', icon: Database },
  { id: 'glossary', label: '术语库', icon: BookOpen },
  { id: 'tasks', label: '任务中心', icon: History },
];

export function Topbar() {
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);
  const logout = useAuth((s) => s.logout);
  const isAuthenticated = !!user && !!token;
  return (
    <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur border-b border-rule">
      <div className="mx-auto max-w-[1480px] px-6 h-16 flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500 grid place-items-center text-white shadow-soft">
            <Sparkles size={18} strokeWidth={1.8} />
          </div>
          <div>
            <div className="font-display text-[18px] leading-none">Vibe Translate</div>
            <div className="text-[11px] text-ink/55 mt-0.5 tracking-wide uppercase">PPT / PDF · TM · Live Subtitle</div>
          </div>
        </div>
        <nav className="flex items-center gap-1 ml-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = view === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={
                  'flex items-center gap-1.5 px-3 h-9 rounded-full text-[13px] font-medium transition ' +
                  (active
                    ? 'bg-ink text-paper'
                    : 'text-ink/70 hover:text-ink hover:bg-ink/5')
                }
              >
                <Icon size={15} strokeWidth={1.8} />
                {t.label}
              </button>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-[12px] text-ink/55">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-brand-50 text-brand-700">
                <User size={14} />
                <span className="font-medium">{user?.username}</span>
              </div>
              <button
                onClick={logout}
                className="px-3 h-8 rounded-full border border-rule text-ink/65 hover:text-warn hover:border-warn/50 transition"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setView('login')}
              className="px-3 h-8 rounded-full border border-brand-500 text-brand-700 hover:bg-brand-50 transition"
            >
              <LogIn size={14} />
              登录
            </button>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulseDot" />
            服务正常 · 浏览器内运行
          </span>
          <a
            href="https://vercel.com"
            target="_blank"
            rel="noreferrer"
            className="px-3 h-8 inline-flex items-center rounded-full border border-rule hover:border-ink/40"
          >
            部署到 Vercel ↗
          </a>
        </div>
      </div>
    </header>
  );
}
