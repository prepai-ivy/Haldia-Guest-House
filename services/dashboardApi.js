import { apiClient } from '@/lib/apiClient';

// Guest Houses
export async function fetchGuestHouses() {
  const res = await apiClient('/guest-houses');
  return res.data;
}

// Rooms
export async function fetchRooms(guestHouseId) {
  const query = guestHouseId ? `?guestHouseId=${guestHouseId}` : '';
  const res = await apiClient(`/rooms${query}`);
  return res.data;
}

// Bookings
export async function fetchBookings(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await apiClient(`/bookings${query ? `?${query}` : ''}`);
  return res.data;
}
