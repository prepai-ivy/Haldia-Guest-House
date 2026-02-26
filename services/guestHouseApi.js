import { apiClient } from '@/lib/apiClient';

export async function fetchGuestHouses() {
  const res = await apiClient('/guest-houses');
  return res.data || [];
}

export async function createGuestHouse(payload) {
  const res = await apiClient('/guest-houses', {
    method: 'POST',
    body: payload,
  });
  return res.data;
}

export async function deleteGuestHouse(id) {
  return apiClient(`/guest-houses/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchGuestHouseById(id) {
  const res = await apiClient(`/guest-houses/${id}`);
  return res.data;
}

export async function updateGuestHouse(id, payload) {
  return apiClient(`/guest-houses/${id}`, {
    method: 'PUT',
    body: payload,
  });
}
