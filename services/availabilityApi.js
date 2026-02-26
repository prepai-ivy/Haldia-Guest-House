import { apiClient } from '@/lib/apiClient';

export async function fetchAvailability({ roomId, from, to }) {
  const query = new URLSearchParams({ roomId, from, to }).toString();
  const res = await apiClient(`/availability?${query}`);
  return res.data;
}
