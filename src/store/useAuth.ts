import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  role: 'user' | 'admin';
  createdAt: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

interface StoredUser extends User {
  passwordHash: string;
}

const USERS_KEY = 'vibe-translate:users';

function getUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function hashPassword(password: string): Promise<string> {
  try {
    const msg = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest('SHA-256', msg);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return btoa(password);
  }
}

function generateToken(): string {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      get isAuthenticated() {
        return !!get().user && !!get().token;
      },

      async login(username: string, password: string) {
        const users = getUsers();
        const user = users.find((u) => u.username === username);
        if (!user) {
          return { success: false, message: '用户名不存在，请先注册' };
        }
        const hash = await hashPassword(password);
        if (user.passwordHash !== hash) {
          return { success: false, message: '密码错误' };
        }
        const token = generateToken();
        set({
          user: { id: user.id, username: user.username, role: user.role, createdAt: user.createdAt },
          token,
        });
        return { success: true, message: '登录成功' };
      },

      async register(username: string, password: string) {
        if (!username.trim()) {
          return { success: false, message: '请输入用户名' };
        }
        if (password.length < 6) {
          return { success: false, message: '密码至少需要 6 个字符' };
        }
        const users = getUsers();
        if (users.some((u) => u.username === username)) {
          return { success: false, message: '该用户名已被注册' };
        }
        const newUser: StoredUser = {
          id: crypto.randomUUID(),
          username: username.trim(),
          role: 'user',
          createdAt: Date.now(),
          passwordHash: await hashPassword(password),
        };
        saveUsers([...users, newUser]);
        const token = generateToken();
        set({
          user: { id: newUser.id, username: newUser.username, role: newUser.role, createdAt: newUser.createdAt },
          token,
        });
        return { success: true, message: '注册成功，已自动登录' };
      },

      logout() {
        set({ user: null, token: null });
      },
    }),
    {
      name: 'vibe-translate:auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
