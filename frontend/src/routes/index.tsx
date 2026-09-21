import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { CameraPreview, useCameraBase } from "@/components/camera-view";
import { api, type VerifyResult } from "@/lib/api";
import { capturePhoto } from "@/lib/camera";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Acesso — FaceAuth" },
      {
        name: "description",
        content: "Totem de entrada: verifica o rosto do aluno e libera o acesso à academia.",
      },
      { property: "og:title", content: "Acesso — FaceAuth" },
      {
        property: "og:description",
        content: "Totem de entrada: verifica o rosto do aluno e libera o acesso à academia.",
      },
    ],
  }),
  component: AccessScreen,
});

type Status =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "granted"; result: VerifyResult }
  | { kind: "denied"; result: VerifyResult }
  | { kind: "error"; message: string };

const AUTO_INTERVAL_MS = 4000;

function AccessScreen() {
  const base = useCameraBase();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [auto, setAuto] = useState(false);
  const busyRef = useRef(false);

  const verify = useCallback(async () => {
    if (busyRef.current || !base) return;
    busyRef.current = true;
    setStatus({ kind: "checking" });
    try {
      const photo = await capturePhoto(base);
      const result = await api.verify(photo);
      setStatus({ kind: result.access_granted ? "granted" : "denied", result });
    } catch (error) {
      setStatus({ kind: "error", message: (error as Error).message });
    } finally {
      busyRef.current = false;
    }
  }, [base]);

  useEffect(() => {
    if (!auto || !base) return;
    void verify();
    const id = window.setInterval(() => void verify(), AUTO_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [auto, base, verify]);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1.1fr_1fr]">
      <section>
        <CameraPreview base={base} className="aspect-[4/3] w-full" />
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            onClick={() => void verify()}
            disabled={!base || status.kind === "checking"}
            className="rounded-md bg-primary px-7 py-4 font-display text-2xl tracking-wide text-primary-foreground transition-colors hover:brightness-110 disabled:opacity-50"
          >
            {status.kind === "checking" ? "Verificando…" : "Verificar agora"}
          </button>
          <label className="flex items-center gap-3 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={auto}
              onChange={(event) => setAuto(event.target.checked)}
              className="h-5 w-5 accent-[var(--primary)]"
            />
            Verificação automática a cada {AUTO_INTERVAL_MS / 1000}s
          </label>
        </div>
      </section>

      <StatusPanel status={status} />
    </div>
  );
}

function StatusPanel({ status }: { status: Status }) {
  const shell =
    "flex min-h-[22rem] flex-col items-center justify-center rounded-lg border p-8 text-center";

  if (status.kind === "granted") {
    const name = status.result.user?.name ?? "Aluno";
    return (
      <div className={`${shell} border-success/60 bg-success/15`}>
        <p className="font-display text-6xl leading-none text-success sm:text-7xl">Liberado</p>
        <p className="mt-6 font-display text-4xl leading-tight sm:text-5xl">{name}</p>
        {status.result.user?.document ? (
          <p className="mt-3 text-lg text-muted-foreground">
            Matrícula {status.result.user.document}
          </p>
        ) : null}
      </div>
    );
  }

  if (status.kind === "denied") {
    return (
      <div className={`${shell} border-destructive/60 bg-destructive/15`}>
        <p className="font-display text-6xl leading-none text-destructive sm:text-7xl">Negado</p>
        <p className="mt-6 text-xl text-foreground">Rosto não reconhecido. Procure a recepção.</p>
      </div>
    );
  }

  if (status.kind === "error") {
    return (
      <div className={`${shell} border-border bg-card`}>
        <p className="font-display text-4xl text-primary">Sem leitura</p>
        <p className="mt-4 text-lg text-muted-foreground">{status.message}</p>
      </div>
    );
  }

  return (
    <div className={`${shell} border-border bg-card`}>
      <p className="font-display text-5xl text-muted-foreground">
        {status.kind === "checking" ? "Lendo rosto…" : "Aguardando"}
      </p>
      <p className="mt-4 text-lg text-muted-foreground">
        Fique de frente para a câmera e toque em verificar.
      </p>
    </div>
  );
}
