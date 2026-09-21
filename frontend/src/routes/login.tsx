import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";

import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login do administrador — FaceAuth" },
      {
        name: "description",
        content: "Entrada da equipe para gerenciar alunos e administradores da academia.",
      },
      { property: "og:title", content: "Login do administrador — FaceAuth" },
      {
        property: "og:description",
        content: "Entrada da equipe para gerenciar alunos e administradores da academia.",
      },
    ],
  }),
  component: LoginScreen,
});

function LoginScreen() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(username, password);
      await navigate({ to: "/alunos" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-16">
      <h1 className="text-3xl">Entrar</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        A sessão fica só nesta aba: ao recarregar a página você sai.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Field label="Usuário">
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
            className="w-full rounded-md border border-input bg-card px-3 py-2.5 outline-none focus:border-primary"
          />
        </Field>
        <Field label="Senha">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className="w-full rounded-md border border-input bg-card px-3 py-2.5 outline-none focus:border-primary"
          />
        </Field>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-3 font-display text-xl tracking-wide text-primary-foreground transition-colors hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        Sistema novo, sem nenhum administrador ainda?{" "}
        <Link to="/admins" className="text-primary underline">
          criar o primeiro administrador
        </Link>
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
