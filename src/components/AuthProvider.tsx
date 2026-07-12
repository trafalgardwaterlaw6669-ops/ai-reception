import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout, getAccessToken } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoggingIn: boolean;
  login: () => Promise<void>;
  signOut: () => Promise<void>;
  loginAsDemo: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Check if we have a demo session saved
    const savedDemo = sessionStorage.getItem('demo_user_session');
    if (savedDemo) {
      const parsed = JSON.parse(savedDemo);
      setUser(parsed.user);
      setToken(parsed.token);
      setNeedsAuth(false);
      setIsInitializing(false);
      return;
    }

    const unsubscribe = initAuth(
      (user, token) => {
        setUser(user);
        setToken(token);
        setNeedsAuth(false);
        setIsInitializing(false);
      },
      () => {
        setNeedsAuth(true);
        setUser(null);
        setToken(null);
        setIsInitializing(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const login = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        console.warn('Sign-in popup was closed by the user.');
      } else {
        console.error('Login failed:', err);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loginAsDemo = () => {
    const mockUser = {
      uid: 'demo_doctor_smith',
      displayName: 'Dr. Smith (Demo)',
      email: 'smith@demo-clinic.com',
      photoURL: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&h=150&q=80',
    } as unknown as User;
    
    const mockToken = 'demo-access-token-12345';
    sessionStorage.setItem('demo_user_session', JSON.stringify({ user: mockUser, token: mockToken }));
    setUser(mockUser);
    setToken(mockToken);
    setNeedsAuth(false);
  };

  const signOut = async () => {
    sessionStorage.removeItem('demo_user_session');
    await logout();
    setNeedsAuth(true);
    setUser(null);
    setToken(null);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-6 border border-slate-200">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold text-blue-700">Dr</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Bienvenue</h2>
          <p className="text-slate-500 text-sm">Connectez-vous pour gérer votre clinique et synchroniser avec Google Tasks.</p>
          
          <button 
            onClick={login}
            disabled={isLoggingIn}
            className="w-full relative flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoggingIn ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Se connecter avec Google
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Ou</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button
            onClick={loginAsDemo}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            Accéder avec un Compte Démo (Sans Google Auth)
          </button>

          <p className="text-[11px] text-slate-400 leading-relaxed text-center">
            🔒 Google restreint la connexion sur les projets de bac à sable non vérifiés. Utilisez le **Compte Démo** pour contourner l'authentification et accéder immédiatement à l'ensemble du système.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoggingIn, login, signOut, loginAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
