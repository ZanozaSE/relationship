const ACCESS_TOKEN_KEY = 'relationship_access_token'
const REFRESH_TOKEN_KEY = 'relationship_refresh_token'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function saveTokens(access, refresh) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

async function refreshAccessToken() {
  const refresh = getRefreshToken()

  if (!refresh) {
    return null
  }

  const response = await fetch('/api/auth/token/refresh/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh }),
  })

  if (!response.ok) {
    clearTokens()
    return null
  }

  const data = await response.json()
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access)
  return data.access
}

export async function apiFetch(path, options = {}, allowRefresh = true) {
  const token = getAccessToken()
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response = await fetch(path, {
    ...options,
    headers,
  })

  if (response.status === 401 && allowRefresh && getRefreshToken()) {
    const newAccessToken = await refreshAccessToken()

    if (newAccessToken) {
      headers.set('Authorization', `Bearer ${newAccessToken}`)
      response = await fetch(path, {
        ...options,
        headers,
      })
    }
  }

  return response
}

export async function login(username, password) {
  const response = await fetch('/api/auth/login/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.detail || data.non_field_errors?.[0] || 'Не удалось выполнить вход.',
    )
  }

  saveTokens(data.access, data.refresh)
  return data
}

export async function register(username, email, password) {
  const response = await fetch('/api/auth/register/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const firstError = Object.values(data).flat?.()[0]
    throw new Error(
      data.detail || firstError || 'Не удалось создать аккаунт.',
    )
  }

  return data
}

export async function requestPasswordReset(email) {
  const response = await fetch('/api/auth/password-reset/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const firstError = Object.values(data).flat?.()[0]
    throw new Error(
      data.detail || firstError || 'Не удалось отправить инструкцию.',
    )
  }

  return data
}

export async function confirmPasswordReset(uid, token, newPassword, newPasswordConfirm) {
  const response = await fetch('/api/auth/password-reset/confirm/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uid,
      token,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const firstError = Object.values(data).flat?.()[0]
    throw new Error(
      data.detail || firstError || 'Не удалось изменить пароль.',
    )
  }

  return data
}

export async function getCurrentUser() {
  const response = await apiFetch('/api/auth/me/')

  if (!response.ok) {
    return null
  }

  return response.json()
}
