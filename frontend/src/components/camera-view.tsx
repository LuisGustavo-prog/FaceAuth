import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import { CAMERA_OFFLINE_MESSAGE, getCameraUrl, streamUrl } from "@/lib/camera";

export function useCameraBase() {
  const [base, setBase] = useState<string>("");
  useEffect(() => {
    setBase(getCameraUrl());
  }, []);
  return base;
}

export function CameraPreview({ base, className = "" }: { base: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [base]);

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-border bg-black ${className}`}
    >
      {base && !failed ? (
        <img
          src={streamUrl(base)}
          alt="Transmissão da câmera da entrada"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full min-h-56 flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-sm text-muted-foreground">{CAMERA_OFFLINE_MESSAGE}</p>
          <Link to="/camera" className="text-sm text-primary underline">
            Conferir endereço da câmera
          </Link>
        </div>
      )}
      {base && !failed ? (
        <span className="absolute left-3 top-3 rounded bg-black/60 px-2 py-1 font-display text-xs tracking-wide text-primary">
          ao vivo
        </span>
      ) : null}
    </div>
  );
}
