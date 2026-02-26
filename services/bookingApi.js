import { apiClient } from '@/lib/apiClient';

export async function fetchBookings(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await apiClient(`/bookings${query ? `?${query}` : ''}`);
  return res.data || [];
}

export async function updateBookingStatus(id, status) {
  const res = await apiClient(`/bookings/${id}`, {
    method: 'PATCH',
    body: { status },
  });
  return res.data;
}

export async function createBooking(payload) {
  return apiClient('/bookings', {
    method: 'POST',
    body: payload,
  });
}

export async function fetchCheckInOutBookings() {
  const res = await apiClient('/bookings?status=BOOKED,CHECKED_IN');
  return res.data || [];
}
