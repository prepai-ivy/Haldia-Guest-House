import { apiClient } from '@/lib/apiClient';

export async function fetchRooms(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await apiClient(`/rooms${query ? `?${query}` : ''}`);
  return res.data || [];
}

export async function fetchRoomsByGuestHouse(guestHouseId) {
  const res = await apiClient(`/rooms?guestHouseId=${guestHouseId}`);
  return res.data || [];
}

export async function createRoom(payload) {
  const res = await apiClient('/rooms', {
    method: 'POST',
    body: payload,
  });
  return res.data;
}

export async function updateRoom(id, payload) {
  const res = await apiClient(`/rooms/${id}`, {
    method: 'PATCH',
    body: payload,
  });
  return res.data;
}

export async function deleteRoom(id) {
  await apiClient(`/rooms/${id}`, { method: 'DELETE' });
}

export async function fetchRoomById(id) {
  const res = await apiClient(`/rooms/${id}`);
  return res.data;
}
