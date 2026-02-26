"use client";

import {
  Shield,
  Building2,
  Users,
  CalendarCheck,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/cards/StatsCard";
import GuestHouseCard from "@/components/cards/GuestHouseCard";
import BookingCard from "@/components/cards/BookingCard";
import { useAuth } from "@/context/AuthContext";

import { fetchGuestHouseStats } from "@/api/guestHouseStatsApi";
import { fetchDashboardStats } from "@/api/dashboardStatsApi";
import { fetchBookings } from "@/api/dashboardApi";
import { updateBookingStatus } from "@/api/bookingApi";

export default function Dashboard() {
  const { user, isAdmin, isCustomer } = useAuth();

  const [guestHouses, setGuestHouses] = useState([]);
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [actionErrors, setActionErrors] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [ghStats, dashStats, bk] = await Promise.all([
          fetchGuestHouseStats(),
          fetchDashboardStats(),
          fetchBookings(isAdmin ? {} : { userId: user?._id }),
        ]);

        setGuestHouses(ghStats);
        setStats(dashStats);
        setBookings(bk || []);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) loadDashboard();
  }, [user, isAdmin]);

  /* ---- IST day boundaries ---- */
  const now = new Date();
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(now.getTime() + IST_OFFSET);
  const startOfTodayIST = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate());
  const endOfTodayIST = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate() + 1);
  const startUTC = new Date(startOfTodayIST.getTime() - IST_OFFSET);
  const endUTC = new Date(endOfTodayIST.getTime() - IST_OFFSET);

  const todaysArrivals = bookings.filter((b) => {
    const checkIn = new Date(b.checkInDate);
    return (
      ["BOOKED", "CHECKED_IN"].includes(b.status) &&
      checkIn >= startUTC &&
      checkIn < endUTC
    );
  });

  async function handleBookingAction(id, action) {
    try {
      setActionLoading((p) => ({ ...p, [id]: true }));
      setActionErrors((p) => ({ ...p, [id]: null }));

      const updated = await updateBookingStatus(id, action);

      setBookings((prev) =>
        prev.map((b) => (b._id === id ? updated : b))
      );

      return updated;
    } catch (err) {
      setActionErrors((p) => ({
        ...p,
        [id]: err.message || "Action failed",
      }));
      throw err;
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

  const pendingRequests = bookings.filter((b) => b.status === "PENDING");

  const totalAvailable = stats?.availableToday || 0;
  const totalOccupied = stats?.occupiedToday || 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[300px] flex items-center justify-center text-muted-foreground">
          Loading dashboard...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Welcome Header */}
      <div className="gradient-header rounded-xl p-6 mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white mb-1">
            {isAdmin
              ? "Haldia Ground Hub"
              : `Welcome, ${user?.name?.split(" ")[0]}`}
          </h1>
          <p className="text-white/70 text-sm uppercase tracking-wide">
            {isAdmin
              ? "Digital Verification Panel"
              : "Guest House Booking Portal"}
          </p>
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20">
          <Shield size={100} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatsCard
          title="Available Rooms"
          value={totalAvailable}
          subtitle="Across all guest houses"
          icon={Building2}
        />
        <StatsCard
          title="Occupied Rooms"
          value={totalOccupied}
          subtitle="Currently in use"
          icon={Users}
        />
        {isAdmin && (
          <StatsCard
            title="Today's Arrivals"
            value={todaysArrivals.length}
            subtitle={new Date().toLocaleDateString()}
            icon={CalendarCheck}
          />
        )}
        {isCustomer && (
          <StatsCard
            title="Pending Requests"
            value={pendingRequests.length}
            subtitle="Awaiting approval"
            icon={CalendarCheck}
          />
        )}
        {isAdmin && (
          <StatsCard
            title="Pending Requests"
            value={pendingRequests.length}
            subtitle="Awaiting approval"
            icon={AlertCircle}
            variant={pendingRequests.length > 0 ? "warning" : "default"}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guest Houses */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Guest Houses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {guestHouses.map((gh) => (
              <GuestHouseCard key={gh._id || gh.id} guestHouse={gh} />
            ))}
          </div>
        </div>

        {/* Activity */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {isAdmin ? "Today's Check-ins" : "My Recent Bookings"}
          </h2>

          <div className="space-y-4">
            {isAdmin ? (
              todaysArrivals.length > 0 ? (
                todaysArrivals.map((booking) => (
                  <BookingCard
                    key={booking._id}
                    booking={booking}
                    onAction={handleBookingAction}
                  />
                ))
              ) : (
                <div className="bg-card rounded-xl border border-border p-8 text-center">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                    <CalendarCheck
                      size={24}
                      className="text-muted-foreground"
                    />
                  </div>
                  <p className="text-muted-foreground">
                    No check-ins scheduled for today
                  </p>
                </div>
              )
            ) : (
              bookings
                .slice(0, 3)
                .map((booking) => (
                  <BookingCard
                    key={booking._id}
                    booking={booking}
                    showActions={false}
                  />
                ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
