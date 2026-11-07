
const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

type Options = RequestInit & { headers?: Record<string, string> }

async function request(path: string, options: Options = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    let detail = res.statusText

    try {
      const body = await res.json()
      detail = body.detail || body.message || detail
    } catch {}

    throw new Error(
      typeof detail === 'string' ? detail : JSON.stringify(detail)
    )
  }

  if (res.status === 204) return null

  return res.json()
}

export const api = {
  get: (path: string, options?: Options) =>
    request(path, { ...options, method: 'GET' }),

  post: (path: string, body?: unknown, options?: Options) =>
    request(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: (path: string, body?: unknown, options?: Options) =>
    request(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: (path: string, body?: unknown, options?: Options) =>
    request(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: (path: string, options?: Options) =>
    request(path, { ...options, method: 'DELETE' }),
}
