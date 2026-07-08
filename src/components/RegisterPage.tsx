import { useState } from 'react';
import { Eye, EyeOff, UserPlus, Sparkles } from 'lucide-react';
import { useAuth } from '../store/useAuth';
import { useApp } from '../store/useApp';

export function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const register = useAuth((s) => s.register);
  const setView = useApp((s) => s.setView);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !confirmPassword) {
      setMessage({ type: 'error', text: '请填写所有字段' });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的密码不一致' });
      return;
    }
    setLoading(true);
    setMessage(null);
    const result = await register(username, password);
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
              <div className="text-[11px] text-ink/55 mt-0.5 tracking-wide uppercase">创建新账户</div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-ink/70 mb-1.5">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="设置用户名"
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
                  placeholder="至少 6 个字符"
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

            <div>
              <label className="block text-[12px] font-semibold text-ink/70 mb-1.5">确认密码</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                className="w-full h-11 px-4 rounded-xl border border-rule bg-canvas text-[13px] placeholder:text-ink/35 focus:border-brand-500"
              />
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
                  注册中…
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  注册
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setView('login')}
              className="text-[12.5px] text-ink/65 hover:text-brand-700 underline underline-offset-4"
            >
              已有账户？立即登录
            </button>
          </div>

          <p className="mt-4 text-[11px] text-ink/40 text-center leading-relaxed">
            注册后可保存个人术语库、翻译记忆和任务历史，所有数据仅保存在浏览器本地。
          </p>
        </div>
      </div>
    </div>
  );
}
