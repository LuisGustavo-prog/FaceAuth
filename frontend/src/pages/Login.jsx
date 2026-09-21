import { useState } from 'react'
import { adminLogin } from '../api.js'

export default function Login({ onLoggedIn }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setBusy(true)

    try {
      const { access_token: token } = await adminLogin(username, password)
      onLoggedIn(token)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page page--narrow">
      <h1>Login administrativo</h1>
      <p>Necessario para cadastrar, editar ou remover usuarios.</p>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Usuario
          <input value={username} onChange={(event) => setUsername(event.target.value)} required />
        </label>

        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={busy}>
          {busy ? 'Entrando...' : 'Entrar'}
        </button>

        {error && <p className="form__error">{error}</p>}
      </form>
    </div>
  )
}
