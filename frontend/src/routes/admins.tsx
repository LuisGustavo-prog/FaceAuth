import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, type Admin } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admins")({
  head: () => ({
    meta: [
      { title: "Administradores — FaceAuth" },
      {
        name: "description",
        content: "Contas da equipe que gerenciam os alunos e a entrada da academia.",
      },
      { property: "og:title", content: "Administradores — FaceAuth" },
      {
        property: "og:description",
        content: "Contas da equipe que gerenciam os alunos e a entrada da academia.",
      },
    ],
  }),
  component: AdminsScreen,
});

function AdminsScreen() {
  const { token, ready } = useAuth();

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-3xl">Administradores</h1>
      {!ready ? null : token ? <AdminManager token={token} /> : <FirstAdminSetup />}
    </div>
  );
}

function AdminManager({ token }: { token: string }) {
  const [admins, setAdmins] = useState<Admin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Admin | null>(null);

  async function load() {
    try {
      setAdmins(await api.listAdmins(token));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      await api.createAdmin(token, username, password);
      toast.success("Administrador criado");
      setUsername("");
      setPassword("");
      void load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function remove(admin: Admin) {
    if (!window.confirm(`Remover o administrador ${admin.username}?`)) return;
    try {
      await api.deleteAdmin(token, admin.id);
      toast.success("Administrador removido");
      void load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <div className="mt-6 divide-y divide-border border-y border-border">
        {admins?.map((admin) => (
          <div key={admin.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="font-display text-xl">{admin.username}</p>
              <p className="text-sm text-muted-foreground">
                desde {new Date(admin.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              <button
                onClick={() => setEditing(admin)}
                className="rounded-md border border-border px-4 py-2 transition-colors hover:bg-accent"
              >
                Editar
              </button>
              <button
                onClick={() => void remove(admin)}
                className="rounded-md border border-destructive/60 px-4 py-2 text-destructive transition-colors hover:bg-destructive/15"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={create} className="mt-8 max-w-sm space-y-3">
        <h2 className="text-2xl">Novo administrador</h2>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Usuário"
          required
          className="w-full rounded-md border border-input bg-card px-3 py-2.5 outline-none focus:border-primary"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Senha"
          required
          className="w-full rounded-md border border-input bg-card px-3 py-2.5 outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-primary px-5 py-2.5 font-display text-lg text-primary-foreground transition-colors hover:brightness-110 disabled:opacity-50"
        >
          {creating ? "Criando…" : "Criar"}
        </button>
      </form>

      {editing ? (
        <EditAdmin
          token={token}
          admin={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      ) : null}
    </>
  );
}

function EditAdmin({
  token,
  admin,
  onClose,
  onSaved,
}: {
  token: string;
  admin: Admin;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [username, setUsername] = useState(admin.username);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.updateAdmin(token, admin.id, {
        username,
        ...(password ? { password } : {}),
      });
      toast.success("Administrador atualizado");
      onSaved();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <form onSubmit={save} className="w-full max-w-md rounded-lg border border-border bg-card p-6">
        <h2 className="text-2xl">Editar administrador</h2>
        <label className="mt-5 block space-y-1.5">
          <span className="text-sm text-muted-foreground">Usuário</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 outline-none focus:border-primary"
          />
        </label>
        <label className="mt-4 block space-y-1.5">
          <span className="text-sm text-muted-foreground">Nova senha (opcional)</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 outline-none focus:border-primary"
          />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-5 py-2 text-sm text-primary-foreground transition-colors hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FirstAdminSetup() {
  const { signIn } = useAuth();
  const [setupKey, setSetupKey] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.createFirstAdmin(setupKey, username, password);
      toast.success("Primeiro administrador criado");
      await signIn(username, password);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 max-w-sm">
      <p className="text-sm text-muted-foreground">
        Você não está logado. Se o sistema ainda não tem nenhum administrador, crie o primeiro aqui
        usando a chave de instalação (o mesmo valor configurado no servidor como ADMIN_SETUP_KEY).
        Se já existe algum administrador, entre pelo login normal.
      </p>
      <form onSubmit={create} className="mt-6 space-y-3">
        <h2 className="text-2xl">Primeiro administrador</h2>
        <input
          value={setupKey}
          onChange={(event) => setSetupKey(event.target.value)}
          placeholder="Chave de instalação"
          required
          className="w-full rounded-md border border-input bg-card px-3 py-2.5 outline-none focus:border-primary"
        />
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Usuário"
          required
          className="w-full rounded-md border border-input bg-card px-3 py-2.5 outline-none focus:border-primary"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Senha"
          required
          className="w-full rounded-md border border-input bg-card px-3 py-2.5 outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-5 py-2.5 font-display text-lg text-primary-foreground transition-colors hover:brightness-110 disabled:opacity-50"
        >
          {saving ? "Criando…" : "Criar e entrar"}
        </button>
      </form>
    </div>
  );
}