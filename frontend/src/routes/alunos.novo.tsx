import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { CameraPreview, useCameraBase } from "@/components/camera-view";
import { api } from "@/lib/api";
import { RequireAuth } from "@/lib/auth";
import { capturePhoto } from "@/lib/camera";

export const Route = createFileRoute("/alunos/novo")({
  head: () => ({
    meta: [
      { title: "Cadastrar aluno — FaceAuth" },
      {
        name: "description",
        content: "Cadastre um aluno com nome, matrícula e foto tirada na hora pela câmera.",
      },
      { property: "og:title", content: "Cadastrar aluno — FaceAuth" },
      {
        property: "og:description",
        content: "Cadastre um aluno com nome, matrícula e foto tirada na hora pela câmera.",
      },
    ],
  }),
  component: () => <RequireAuth>{(token) => <NewStudent token={token} />}</RequireAuth>,
});

function NewStudent({ token }: { token: string }) {
  const base = useCameraBase();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function takePhoto() {
    try {
      const blob = await capturePhoto(base);
      setPhoto(blob);
      setPhotoPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!photo) {
      toast.error("Tire uma foto do aluno antes de cadastrar");
      return;
    }
    setSaving(true);
    try {
      const student = await api.createStudent(token, name, document, photo);
      toast.success(`${student.name} cadastrado`);
      await navigate({ to: "/alunos" });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-5 py-10 lg:grid-cols-2">
      <div>
        <h1 className="text-3xl">Cadastrar aluno</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm text-muted-foreground">Nome</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-md border border-input bg-card px-3 py-2.5 outline-none focus:border-primary"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-muted-foreground">Matrícula</span>
            <input
              value={document}
              onChange={(event) => setDocument(event.target.value)}
              required
              className="w-full rounded-md border border-input bg-card px-3 py-2.5 outline-none focus:border-primary"
            />
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => void takePhoto()}
              className="rounded-md border border-border px-5 py-2.5 transition-colors hover:bg-accent"
            >
              {photo ? "Tirar outra foto" : "Tirar foto"}
            </button>
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Foto capturada do aluno"
                className="h-20 w-20 rounded-md border border-border object-cover"
              />
            ) : (
              <span className="text-sm text-muted-foreground">Nenhuma foto ainda</span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-6 py-3 font-display text-xl tracking-wide text-primary-foreground transition-colors hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "Cadastrando…" : "Cadastrar"}
          </button>
        </form>
      </div>
      <CameraPreview base={base} className="aspect-[4/3] w-full" />
    </div>
  );
}
