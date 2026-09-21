import { useEffect, useState } from 'react'

const STORAGE_KEY = 'faceauth:camera-url'

function normalizeBaseUrl(rawUrl) {
  return rawUrl.trim().replace(/\/+$/, '')
}

export function useCameraSource() {
  const defaultUrl = import.meta.env.VITE_CAMERA_URL || 'http://192.168.0.10:8080'
  const [baseUrl, setBaseUrl] = useState(
    () => localStorage.getItem(STORAGE_KEY) || defaultUrl,
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, baseUrl)
  }, [baseUrl])

  const videoUrl = baseUrl ? `${normalizeBaseUrl(baseUrl)}/video` : null

  async function captureSnapshot() {
    const snapshotUrl = `${normalizeBaseUrl(baseUrl)}/shot.jpg?t=${Date.now()}`

    let response
    try {
      response = await fetch(snapshotUrl, { cache: 'no-store' })
    } catch {
      throw new Error(
        'Nao foi possivel acessar o IP Webcam. Confira se o celular e o computador estao na mesma rede, se o endereco esta correto, e se o app nao esta bloqueando a origem do navegador (CORS).',
      )
    }

    if (!response.ok) {
      throw new Error(`O IP Webcam respondeu com erro ${response.status} ao tentar capturar a foto.`)
    }

    return response.blob()
  }

  return { baseUrl, setBaseUrl, videoUrl, captureSnapshot }
}
