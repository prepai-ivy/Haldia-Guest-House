import { apiClient } from '@/lib/apiClient';

export async function signup(payload) {
  const res = await apiClient('/auth/signup', {
    method: 'POST',
    body: payload,
  });
  return res.data || [];
}
