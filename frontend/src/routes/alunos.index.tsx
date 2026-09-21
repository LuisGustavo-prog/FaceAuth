import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useCameraBase } from "@/components/camera-view";
import { api, type Student } from "@/lib/api";
import { RequireAuth } from "@/lib/auth";
import { capturePhoto } from "@/lib/camera";

export const Route = createFileRoute("/alunos/")({
  head: () => ({
    meta: [
      { title: "Alunos — FaceAuth" },
      {
        name: "description",
        content: "Todos os alunos cadastrados, com opção de editar dados, trocar foto ou remover.",
      },
      { property: "og:title", content: "Alunos — FaceAuth" },
      {
        property: "og:description",
        content: "Todos os alunos cadastrados, com opção de editar dados, trocar foto ou remover.",
      },
    ],
  }),
  component: () => <RequireAuth>{(token) => <StudentList token={token} />}</RequireAuth>,
});

function StudentList({ token }: { token: string }) {
  const base = useCameraBase();
  const [students, setStudents] = useState<Student[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Student | null>(null);

  async function load() {
    try {
      setStudents(await api.listStudents(token));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function remove(student: Student) {
    if (!window.confirm(`Remover ${student.name}?`)) return;
    try {
      await api.deleteStudent(token, student.id);
      toast.success("Aluno removido");
      void load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Alunos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {students ? `${students.length} cadastrados` : "Carregando…"}
          </p>
        </div>
        <Link
          to="/alunos/novo"
          className="rounded-md bg-primary px-5 py-2.5 font-display text-lg text-primary-foreground transition-colors hover:brightness-110"
        >
          Cadastrar aluno
        </Link>
      </div>

      {error ? <p className="mt-6 text-sm text-destructive">{error}</p> : null}

      <div className="mt-6 divide-y divide-border border-y border-border">
        {students?.map((student) => (
          <div
            key={student.id}
            className="flex flex-wrap items-center justify-between gap-3 py-4"
          >
            <div>
              <p className="font-display text-xl">{student.name}</p>
              <p className="text-sm text-muted-foreground">
                Matrícula {student.document} · desde{" "}
                {new Date(student.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              <button
                onClick={() => setEditing(student)}
                className="rounded-md border border-border px-4 py-2 transition-colors hover:bg-accent"
              >
                Editar
              </button>
              <button
                onClick={() => void remove(student)}
                className="rounded-md border border-destructive/60 px-4 py-2 text-destructive transition-colors hover:bg-destructive/15"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
        {students && students.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground">Nenhum aluno cadastrado ainda.</p>
        ) : null}
      </div>

      {editing ? (
        <EditStudent
          token={token}
          cameraBase={base}
          student={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

function EditStudent({
  token,
  cameraBase,
  student,
  onClose,
  onSaved,
}: {
  token: string;
  cameraBase: string;
  student: Student;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(student.name);
  const [document, setDocument] = useState(student.document);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);

  async function takePhoto() {
    try {
      setPhoto(await capturePhoto(cameraBase));
      toast.success("Nova foto capturada");
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.updateStudent(token, student.id, { name, document, photo });
      toast.success("Aluno atualizado");
      onSaved();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <form
        onSubmit={save}
        className="w-full max-w-md rounded-lg border border-border bg-card p-6"
      >
        <h2 className="text-2xl">Editar aluno</h2>
        <label className="mt-5 block space-y-1.5">
          <span className="text-sm text-muted-foreground">Nome</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 outline-none focus:border-primary"
          />
        </label>
        <label className="mt-4 block space-y-1.5">
          <span className="text-sm text-muted-foreground">Matrícula</span>
          <input
            value={document}
            onChange={(event) => setDocument(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 outline-none focus:border-primary"
          />
        </label>
        <button
          type="button"
          onClick={() => void takePhoto()}
          className="mt-4 rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-accent"
        >
          {photo ? "Foto nova pronta · tirar outra" : "Trocar foto pela câmera"}
        </button>
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
