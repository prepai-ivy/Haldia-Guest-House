import { apiClient } from '@/lib/apiClient';

export async function fetchAvailability({ roomId, from, to, excludeId }) {
  const params = { roomId, from, to };
  if (excludeId) params.excludeId = excludeId;
  const query = new URLSearchParams(params).toString();
  const res = await apiClient(`/availability?${query}`);
  return res.data;
}
