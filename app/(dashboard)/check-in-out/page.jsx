"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import BookingCard from "@/components/cards/BookingCard";
import { Shield, UserCheck, UserMinus } from "lucide-react";
import {
  fetchCheckInOutBookings,
  updateBookingStatus,
} from "@/api/bookingApi";

export default function CheckInOut() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchCheckInOutBookings();
        setBookings(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ---- IST day boundaries (consistent with stats APIs) ---- */
  const now = new Date();
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(now.getTime() + IST_OFFSET);
  const startOfTodayIST = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate());
  const endOfTodayIST = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate() + 1);
  const startUTC = new Date(startOfTodayIST.getTime() - IST_OFFSET);
  const endUTC = new Date(endOfTodayIST.getTime() - IST_OFFSET);

  /* BOOKED whose stay overlaps today — same rule as stats APIs */
  const awaitingCheckIn = bookings.filter((b) => {
    if (b.status !== "BOOKED") return false;
    const checkIn = new Date(b.checkInDate);
    const checkOut = new Date(b.checkOutDate);
    return checkIn < endUTC && checkOut > startUTC;
  });
  const currentlyCheckedIn = bookings.filter((b) => b.status === "CHECKED_IN");

  async function handleAction(id, action) {
    const statusMap = {
      check_in: "CHECKED_IN",
      check_out: "CHECKED_OUT",
    };

    const updated = await updateBookingStatus(id, statusMap[action] || action);

    setBookings((prev) => prev.map((b) => (b._id === id ? updated : b)));
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[300px] flex items-center justify-center">
          Loading check-ins…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="gradient-header rounded-xl p-6 mb-6 relative overflow-hidden">
        <h1 className="text-2xl font-bold text-white mb-1">
          Check In / Check Out
        </h1>
        <p className="text-white/70 text-sm">
          Manage guest arrivals and departures
        </p>
        <Shield
          size={80}
          className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Stat
          icon={<UserCheck />}
          label="Awaiting Check-in"
          value={awaitingCheckIn.length}
          color="info"
        />
        <Stat
          icon={<UserMinus />}
          label="Currently Staying"
          value={currentlyCheckedIn.length}
          color="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Section
          title="Awaiting Check-in"
          bookings={awaitingCheckIn}
          onAction={handleAction}
        />
        <Section
          title="Currently Staying"
          bookings={currentlyCheckedIn}
          onAction={handleAction}
        />
      </div>
    </DashboardLayout>
  );
}

function Section({ title, bookings, onAction }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {bookings.length ? (
        <div className="space-y-4">
          {bookings.map((b) => (
            <BookingCard key={b._id} booking={b} onAction={onAction} />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border p-6 text-center">
          No records
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, color }) {
  return (
    <div className={`bg-${color}/10 border border-${color}/20 rounded-xl p-5 flex gap-4`}>
      <div className={`bg-${color}/20 p-3 rounded-lg`}>{icon}</div>
      <div>
        <p className={`text-3xl font-bold text-${color}`}>{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
