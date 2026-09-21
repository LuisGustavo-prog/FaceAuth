import { useState } from 'react'
import './App.css'
import { useCameraSource } from './useCameraSource.js'
import Login from './pages/Login.jsx'
import Cadastro from './pages/Cadastro.jsx'
import Acesso from './pages/Acesso.jsx'

const TABS = {
  acesso: 'Acesso',
  cadastro: 'Cadastro',
  login: 'Admin',
}

export default function App() {
  const [tab, setTab] = useState('acesso')
  const [token, setToken] = useState(null)
  const camera = useCameraSource()

  function handleLoggedIn(newToken) {
    setToken(newToken)
    setTab('cadastro')
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>FaceAuth Academia</h1>
        <nav className="tabs">
          {Object.entries(TABS).map(([key, label]) => (
            <button
              key={key}
              className={tab === key ? 'tabs__button tabs__button--active' : 'tabs__button'}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {tab === 'acesso' && <Acesso camera={camera} />}

        {tab === 'cadastro' &&
          (token ? (
            <Cadastro camera={camera} token={token} />
          ) : (
            <div className="page page--narrow">
              <p>Faca login como administrador para cadastrar alunos.</p>
              <button onClick={() => setTab('login')}>Ir para o login</button>
            </div>
          ))}

        {tab === 'login' && <Login onLoggedIn={handleLoggedIn} />}
      </main>
    </div>
  )
}
