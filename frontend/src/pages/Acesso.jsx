import { useEffect, useRef, useState } from 'react'
import CameraPanel from '../components/CameraPanel.jsx'
import { verifyFace } from '../api.js'

const AUTO_VERIFY_INTERVAL_MS = 3000

export default function Acesso({ camera }) {
  const [autoVerify, setAutoVerify] = useState(false)
  const [result, setResult] = useState(null)
  const [checking, setChecking] = useState(false)
  const checkingRef = useRef(false)

  async function verifyBlob(blob) {
    checkingRef.current = true
    setChecking(true)

    try {
      const response = await verifyFace(blob)
      setResult(
        response.access_granted
          ? { type: 'granted', name: response.user.name, distance: response.distance }
          : { type: 'denied' },
      )
    } catch (err) {
      setResult({ type: 'error', message: err.message })
    } finally {
      checkingRef.current = false
      setChecking(false)
    }
  }

  async function runAutoVerification() {
    if (checkingRef.current) {
      return
    }

    try {
      const blob = await camera.captureSnapshot()
      await verifyBlob(blob)
    } catch (err) {
      setResult({ type: 'error', message: err.message })
    }
  }

  useEffect(() => {
    if (!autoVerify) {
      return
    }

    const intervalId = setInterval(runAutoVerification, AUTO_VERIFY_INTERVAL_MS)
    return () => clearInterval(intervalId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoVerify, camera.baseUrl])

  return (
    <div className="page">
      <h1>Acesso</h1>

      <CameraPanel camera={camera} onCapture={verifyBlob} captureLabel="Verificar agora" disabled={checking} />

      <label className="toggle">
        <input
          type="checkbox"
          checked={autoVerify}
          onChange={(event) => setAutoVerify(event.target.checked)}
        />
        Verificacao automatica (a cada {AUTO_VERIFY_INTERVAL_MS / 1000}s)
      </label>

      <div className={`access-result access-result--${result?.type || 'idle'}`}>
        {!result && 'Aguardando verificacao.'}
        {result?.type === 'granted' && (
          <p>Acesso liberado para {result.name} (distancia {result.distance.toFixed(3)})</p>
        )}
        {result?.type === 'denied' && <p>Acesso negado. Rosto nao reconhecido.</p>}
        {result?.type === 'error' && <p>{result.message}</p>}
      </div>
    </div>
  )
}
