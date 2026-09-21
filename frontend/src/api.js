const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function parseErrorDetail(response) {
  try {
    const body = await response.json()
    return body.detail || `Erro ${response.status}`
  } catch {
    return `Erro ${response.status}`
  }
}

export async function adminLogin(username, password) {
  const response = await fetch(`${API_URL}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    throw new ApiError(await parseErrorDetail(response), response.status)
  }

  return response.json()
}

export async function registerUser({ name, document, photoBlob, token }) {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('document', document)
  formData.append('photo', photoBlob, 'photo.jpg')

  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  if (!response.ok) {
    throw new ApiError(await parseErrorDetail(response), response.status)
  }

  return response.json()
}

export async function verifyFace(photoBlob) {
  const formData = new FormData()
  formData.append('photo', photoBlob, 'photo.jpg')

  const response = await fetch(`${API_URL}/auth/verify`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new ApiError(await parseErrorDetail(response), response.status)
  }

  return response.json()
}

export { ApiError }
