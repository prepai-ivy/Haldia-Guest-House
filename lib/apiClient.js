// Dedupe concurrent refresh attempts — if several requests 401 around the same time, they
// should all wait on one /api/auth/refresh call, not each fire their own.
let refreshPromise = null;

async function performRefresh() {
  const refreshToken = typeof window !== 'undefined'
    ? localStorage.getItem('lalbaba_refresh_token')
    : null;
  if (!refreshToken) return null;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;

    const json = await res.json();
    if (!json.success || !json.data?.token || !json.data?.refreshToken) return null;

    localStorage.setItem('lalbaba_token', json.data.token);
    localStorage.setItem('lalbaba_refresh_token', json.data.refreshToken);
    localStorage.setItem('lalbaba_user', JSON.stringify(json.data.user));
    window.dispatchEvent(new CustomEvent('user-refreshed', { detail: json.data.user }));

    return json.data.token;
  } catch {
    return null;
  }
}

// Exported so other direct-fetch call sites (e.g. multipart upload) can reuse the same
// refresh-and-retry behavior as apiClient.
export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiClient(endpoint, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    _retried = false,
  } = options;

  const token = typeof window !== 'undefined'
    ? localStorage.getItem('lalbaba_token')
    : null;

  const res = await fetch(
    `/api${endpoint}`,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  );

  // A 401 here means the (short-lived) access token expired, not necessarily that the
  // session is over — try one silent refresh-and-retry before giving up.
  if (res.status === 401 && !_retried && typeof window !== 'undefined') {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiClient(endpoint, { ...options, _retried: true });
    }

    let message = 'Session expired';
    try {
      const error = await res.json();
      message = error.message || error.error || message;
    } catch {}

    localStorage.removeItem('lalbaba_token');
    localStorage.removeItem('lalbaba_refresh_token');
    localStorage.removeItem('lalbaba_user');
    window.dispatchEvent(new CustomEvent('token-expired'));

    throw new ApiError(401, message);
  }

  if (!res.ok) {
    let message = 'Something went wrong';
    try {
      const error = await res.json();
      message = error.message || error.error || message;
    } catch {}

    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return null;

  return res.json();
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
