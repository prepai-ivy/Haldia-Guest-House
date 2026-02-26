import { apiClient } from '@/lib/apiClient';

export async function fetchGuestHouses() {
  const res = await apiClient('/guest-houses');
  return res.data || [];
}

export async function fetchRooms(guestHouseId) {
  const query = guestHouseId ? `?guestHouseId=${guestHouseId}` : '';
  const res = await apiClient(`/rooms${query}`);
  return res.data || [];
}
