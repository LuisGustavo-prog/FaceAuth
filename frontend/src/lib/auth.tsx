import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Link } from "@tanstack/react-router";

import { api } from "./api";

const STORAGE_KEY = "faceauth.token";

type Session = {
  token: string;
  username: string;
  expiresAt: number | null;
};

type AuthState = {
  token: string | null;
  username: string | null;
  ready: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

function parseToken(token: string, fallbackUsername?: string): Session | null {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as {
      sub?: string;
      exp?: number;
    };

    const username = payload.sub ?? fallbackUsername;
    if (!username) return null;

    return {
      token,
      username,
      expiresAt: typeof payload.exp === "number" ? payload.exp * 1000 : null,
    };
  } catch {
    return null;
  }
}

function isExpired(session: Session): boolean {
  return session.expiresAt !== null && session.expiresAt <= Date.now();
}

function readStoredSession(): Session | null {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const session = parseToken(stored);
    if (!session || isExpired(session)) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function storeToken(token: string | null) {
  try {
    if (token) window.sessionStorage.setItem(STORAGE_KEY, token);
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readStoredSession());
    setReady(true);
  }, []);

  const signOut = useCallback(() => {
    storeToken(null);
    setSession(null);
  }, []);

  useEffect(() => {
    if (!session || session.expiresAt === null) return;

    const remaining = session.expiresAt - Date.now();
    if (remaining <= 0) {
      signOut();
      return;
    }

    const timer = window.setTimeout(signOut, Math.min(remaining, 2 ** 31 - 1));
    return () => window.clearTimeout(timer);
  }, [session, signOut]);

  const signIn = useCallback(async (user: string, password: string) => {
    const result = await api.login(user, password);
    const next = parseToken(result.access_token, user) ?? {
      token: result.access_token,
      username: user,
      expiresAt: null,
    };

    storeToken(next.token);
    setSession(next);
  }, []);

  const value = useMemo(
    () => ({
      token: session?.token ?? null,
      username: session?.username ?? null,
      ready,
      signIn,
      signOut,
    }),
    [session, ready, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return context;
}

/** Guarda de tela: o token fica em sessionStorage, então sobrevive ao reload da aba. */
export function RequireAuth({ children }: { children: (token: string) => ReactNode }) {
  const { token, ready } = useAuth();

  if (!ready) return null;

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h2 className="text-2xl">Área restrita</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Entre com uma conta de administrador para continuar. A sessão vale enquanto esta aba
          estiver aberta.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex rounded-md bg-primary px-5 py-2.5 font-display text-lg text-primary-foreground transition-colors hover:brightness-110"
        >
          Ir para o login
        </Link>
      </div>
    );
  }

  return <>{children(token)}</>;
}
