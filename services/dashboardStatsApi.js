import { apiClient } from '@/lib/apiClient';

export async function fetchDashboardStats() {
  const res = await apiClient('/dashboard-stats');
  return res.data || {};
}
