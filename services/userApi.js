import { apiClient } from '@/lib/apiClient';

export async function fetchUsers(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await apiClient(`/users${query ? `?${query}` : ''}`);
  return res.data || [];
}

export async function createUser(payload) {
  const res = await apiClient('/users', {
    method: 'POST',
    body: payload,
  });
  return res.data;
}

export async function fetchUserById(id) {
  const res = await apiClient(`/users/${id}`);
  return res.data;
}

export async function updateUser(id, payload) {
  const res = await apiClient(`/users/${id}`, {
    method: 'PATCH',
    body: payload,
  });
  return res.data;
}
