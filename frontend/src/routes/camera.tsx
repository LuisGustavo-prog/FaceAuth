import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CameraPreview } from "@/components/camera-view";
import { capturePhoto, DEFAULT_CAMERA_URL, getCameraUrl, setCameraUrl } from "@/lib/camera";

export const Route = createFileRoute("/camera")({
  head: () => ({
    meta: [
      { title: "Câmera da entrada — FaceAuth" },
      {
        name: "description",
        content: "Endereço do celular com IP Webcam usado como câmera da entrada da academia.",
      },
      { property: "og:title", content: "Câmera da entrada — FaceAuth" },
      {
        property: "og:description",
        content: "Endereço do celular com IP Webcam usado como câmera da entrada da academia.",
      },
    ],
  }),
  component: CameraSettings,
});

function CameraSettings() {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const current = getCameraUrl();
    setValue(current);
    setSaved(current);
  }, []);

  function save() {
    const normalized = setCameraUrl(value);
    setValue(normalized);
    setSaved(normalized);
    toast.success("Endereço da câmera salvo neste aparelho");
  }

  async function test() {
    setTesting(true);
    try {
      await capturePhoto(value);
      toast.success("Foto recebida, a câmera está respondendo");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-5 py-10 lg:grid-cols-2">
      <div>
        <h1 className="text-3xl">Câmera da entrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Abra o aplicativo IP Webcam no celular, ligue o servidor e copie aqui o endereço que ele
          mostra na tela. O celular precisa estar no mesmo Wi-Fi.
        </p>
        <label className="mt-6 block space-y-1.5">
          <span className="text-sm text-muted-foreground">Endereço do celular</span>
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={DEFAULT_CAMERA_URL}
            className="w-full rounded-md border border-input bg-card px-3 py-2.5 outline-none focus:border-primary"
          />
        </label>
        <div className="mt-4 flex gap-3">
          <button
            onClick={save}
            className="rounded-md bg-primary px-5 py-2.5 font-display text-lg text-primary-foreground transition-colors hover:brightness-110"
          >
            Salvar
          </button>
          <button
            onClick={() => void test()}
            disabled={testing}
            className="rounded-md border border-border px-5 py-2.5 transition-colors hover:bg-accent disabled:opacity-50"
          >
            {testing ? "Testando…" : "Testar foto"}
          </button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          A correção do lado da imagem (celular em pé ou deitado) é feita pelo próprio sistema ao
          analisar o rosto.
        </p>
      </div>
      <CameraPreview base={saved} className="aspect-[4/3] w-full" />
    </div>
  );
}
