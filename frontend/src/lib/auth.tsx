import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { api } from "./api";

type AuthState = {
  token: string | null;
  username: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const signIn = useCallback(async (user: string, password: string) => {
    const result = await api.login(user, password);
    setToken(result.access_token);
    setUsername(user);
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setUsername(null);
  }, []);

  const value = useMemo(
    () => ({ token, username, signIn, signOut }),
    [token, username, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return context;
}

/** Guarda de tela: o token vive só em memória, então recarregar desloga. */
export function RequireAuth({ children }: { children: (token: string) => ReactNode }) {
  const { token } = useAuth();

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h2 className="text-2xl">Área restrita</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Entre com uma conta de administrador para continuar. A sessão vale só enquanto a página
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
