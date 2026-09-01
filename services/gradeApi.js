import { apiClient } from '@/lib/apiClient';

export async function fetchGrades() {
  const res = await apiClient('/grades');
  return res.data || [];
}

export async function createGrade(payload) {
  const res = await apiClient('/grades', {
    method: 'POST',
    body: payload,
  });
  return res.data;
}

export async function updateGrade(id, payload) {
  const res = await apiClient(`/grades/${id}`, {
    method: 'PATCH',
    body: payload,
  });
  return res.data;
}

export async function deleteGrade(id) {
  await apiClient(`/grades/${id}`, { method: 'DELETE' });
}
