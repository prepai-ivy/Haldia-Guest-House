import { apiClient, ApiError, refreshAccessToken } from '@/lib/apiClient';

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_UPLOAD_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

/**
 * Uploads a file to a given folder via /api/upload. Kept separate from apiClient
 * since that wrapper always JSON-encodes the body — this needs multipart/form-data.
 */
export async function uploadFile(file, folder) {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new ApiError(400, 'File exceeds the 5MB limit');
  }
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
    throw new ApiError(400, 'Only image or PDF files are allowed');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const doUpload = (token) => fetch('/api/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const token = typeof window !== 'undefined'
    ? localStorage.getItem('lalbaba_token')
    : null;

  let res = await doUpload(token);

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doUpload(newToken);
    }
  }

  if (!res.ok) {
    let message = 'Upload failed';
    try {
      const error = await res.json();
      message = error.message || error.error || message;
    } catch {}
    throw new ApiError(res.status, message);
  }

  const json = await res.json();
  return json.data;
}

export async function deleteUploadedFile(blobPath) {
  const res = await apiClient('/upload', {
    method: 'DELETE',
    body: { blobPath },
  });
  return res.data;
}
