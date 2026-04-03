export async function apiClient(endpoint, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
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

  if (!res.ok) {
    let message = 'Something went wrong';
    try {
      const error = await res.json();
      message = error.message || error.error || message;
    } catch {}

    // Handle token expiration (401 Unauthorized)
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('lalbaba_token');
      localStorage.removeItem('lalbaba_user');
      // Dispatch custom event for logout
      window.dispatchEvent(new CustomEvent('token-expired'));
    }

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
