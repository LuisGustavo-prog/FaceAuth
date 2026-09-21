import { useState } from 'react'
import CameraPanel from '../components/CameraPanel.jsx'
import { registerUser } from '../api.js'

export default function Cadastro({ camera, token }) {
  const [name, setName] = useState('')
  const [document, setDocument] = useState('')
  const [photoBlob, setPhotoBlob] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)

  function handleCapture(blob) {
    setPhotoBlob(blob)
    setPreviewUrl(URL.createObjectURL(blob))
    setStatus(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!photoBlob) {
      setStatus({ type: 'error', message: 'Capture uma foto antes de cadastrar.' })
      return
    }

    setBusy(true)
    setStatus(null)

    try {
      const user = await registerUser({ name, document, photoBlob, token })
      setStatus({ type: 'success', message: `${user.name} cadastrado com sucesso.` })
      setName('')
      setDocument('')
      setPhotoBlob(null)
      setPreviewUrl(null)
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <h1>Cadastro de aluno</h1>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Nome
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>

        <label>
          Matricula
          <input value={document} onChange={(event) => setDocument(event.target.value)} required />
        </label>

        <CameraPanel camera={camera} onCapture={handleCapture} />

        {previewUrl && (
          <div className="preview">
            <p>Foto capturada</p>
            <img src={previewUrl} alt="Previa da foto capturada" />
          </div>
        )}

        <button type="submit" disabled={busy}>
          {busy ? 'Cadastrando...' : 'Cadastrar aluno'}
        </button>

        {status && (
          <p className={status.type === 'error' ? 'form__error' : 'form__success'}>{status.message}</p>
        )}
      </form>
    </div>
  )
}
