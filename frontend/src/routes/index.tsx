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
  | { kind: "granted"; result: VerifyResult }
  | { kind: "denied"; result: VerifyResult }
  | { kind: "error"; message: string };

const AUTO_INTERVAL_MS = 1000;
// Quantas leituras seguidas com rosto não reconhecido são necessárias antes
// de mostrar "Negado". Evita que um único frame com ângulo ruim já mostre
// a tela de negado, já que o loop automático continua tentando sozinho.
const DENY_STREAK_THRESHOLD = 3;

function AccessScreen() {
  const base = useCameraBase();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const busyRef = useRef(false);
  const denyStreakRef = useRef(0);

  const verify = useCallback(async () => {
    if (busyRef.current || !base) return;
    busyRef.current = true;
    try {
      const photo = await capturePhoto(base);
      const result = await api.verify(photo);

      if (!result.face_detected) {
        denyStreakRef.current = 0;
        setStatus({ kind: "idle" });
      } else if (result.access_granted) {
        denyStreakRef.current = 0;
        setStatus({ kind: "granted", result });
      } else {
        denyStreakRef.current += 1;
        if (denyStreakRef.current >= DENY_STREAK_THRESHOLD) {
          setStatus({ kind: "denied", result });
        }
      }
    } catch (error) {
      setStatus({ kind: "error", message: (error as Error).message });
    } finally {
      busyRef.current = false;
    }
  }, [base]);

  useEffect(() => {
    if (!base) return;
    void verify();
    const id = window.setInterval(() => void verify(), AUTO_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [base, verify]);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1.1fr_1fr]">
      <section>
        <CameraPreview base={base} className="aspect-[4/3] w-full" />
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
      <p className="font-display text-5xl text-muted-foreground">Aguardando</p>
      <p className="mt-4 text-lg text-muted-foreground">Fique de frente para a câmera.</p>
    </div>
  );
}