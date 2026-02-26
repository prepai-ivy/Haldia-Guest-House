export function calculateRoomStats(rooms) {
  const total = rooms.length;
  const available = rooms.filter(r => r.status === 'available').length;
  const occupied = rooms.filter(r => r.status === 'occupied').length;
  const maintenance = rooms.filter(r => r.status === 'maintenance').length;

  const utilization = total === 0
    ? 0
    : Math.round((occupied / total) * 100);

  return {
    total,
    available,
    occupied,
    maintenance,
    utilization,
  };
}
