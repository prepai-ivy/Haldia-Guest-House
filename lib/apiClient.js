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
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}${endpoint}`,
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
