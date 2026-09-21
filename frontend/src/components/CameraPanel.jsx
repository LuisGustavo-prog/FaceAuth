import { useState } from 'react'

export default function CameraPanel({ camera, onCapture, disabled, captureLabel = 'Capturar foto' }) {
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleCapture() {
    setError(null)
    setBusy(true)

    try {
      const blob = await camera.captureSnapshot()
      onCapture(blob)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="camera-panel">
      <label className="camera-panel__url">
        Endereco do IP Webcam
        <input
          type="text"
          value={camera.baseUrl}
          onChange={(event) => camera.setBaseUrl(event.target.value)}
          placeholder="http://192.168.0.10:8080"
        />
      </label>

      <div className="camera-panel__feed">
        {camera.videoUrl ? (
          <img src={camera.videoUrl} alt="Stream do IP Webcam" />
        ) : (
          <p>Informe o endereco do IP Webcam para ver a imagem.</p>
        )}
      </div>

      <button type="button" onClick={handleCapture} disabled={disabled || busy}>
        {busy ? 'Capturando...' : captureLabel}
      </button>

      {error && <p className="camera-panel__error">{error}</p>}
    </div>
  )
}
