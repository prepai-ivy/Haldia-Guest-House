import { apiClient } from '@/lib/apiClient';

export async function fetchGuestHouseStats() {
  const res = await apiClient('/guest-house-stats');
  return res.data || [];
}
