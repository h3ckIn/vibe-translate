import { useState } from 'react';
import { Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '../store/useAuth';
import { useApp } from '../store/useApp';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const login = useAuth((s) => s.login);
  const setView = useApp((s) => s.setView);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setMessage({ type: 'error', text: '请填写用户名和密码' });
      return;
    }
    setLoading(true);
    setMessage(null);
    const result = await login(username, password);
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setView('workbench');
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-rule bg-paper shadow-soft p-8 animate-rise">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-500 grid place-items-center text-white shadow-soft">
              <Sparkles size={20} strokeWidth={1.8} />
            </div>
            <div>
              <div className="font-display text-2xl leading-none">Vibe Translate</div>
              <div className="text-[11px] text-ink/55 mt-0.5 tracking-wide uppercase">登录你的账户</div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-ink/70 mb-1.5">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入用户名"
                className="w-full h-11 px-4 rounded-xl border border-rule bg-canvas text-[13px] placeholder:text-ink/35 focus:border-brand-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-ink/70 mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full h-11 px-4 pr-11 rounded-xl border border-rule bg-canvas text-[13px] placeholder:text-ink/35 focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {message && (
              <div className={`rounded-xl p-3 text-[12.5px] ${message.type === 'error' ? 'bg-warn/10 text-warn' : 'bg-ok/10 text-ok'}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-brand-500 text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  登录中…
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  登录
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setView('register')}
              className="text-[12.5px] text-ink/65 hover:text-brand-700 underline underline-offset-4"
            >
              还没有账户？立即注册
            </button>
          </div>

          <p className="mt-4 text-[11px] text-ink/40 text-center leading-relaxed">
            所有数据仅保存在浏览器本地，不会上传到任何服务器。
          </p>
        </div>
      </div>
    </div>
  );
}
