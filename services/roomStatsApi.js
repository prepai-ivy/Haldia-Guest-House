import { apiClient } from '@/lib/apiClient';

export async function fetchRoomStats(guestHouseId) {
  const res = await apiClient(
    `/rooms-stats?guestHouseId=${guestHouseId}`
  );
  return res.data || [];
}
