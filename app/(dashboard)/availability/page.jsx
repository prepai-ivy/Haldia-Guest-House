"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GuestHouseCard from "@/components/cards/GuestHouseCard";
import { Building2, Bed, CheckCircle } from "lucide-react";

import { fetchGuestHouses } from "@/api/guestHouseApi";
import { fetchDashboardStats } from "@/api/dashboardStatsApi";

export default function RoomAvailability() {
  const [guestHouses, setGuestHouses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [gh, dashboardStats] = await Promise.all([
          fetchGuestHouses(),
          fetchDashboardStats(),
        ]);

        setGuestHouses(gh);
        setStats(dashboardStats);
      } catch (err) {
        console.error("Failed to load room availability", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[300px] flex items-center justify-center text-muted-foreground">
          Loading availability...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Room Availability
        </h1>
        <p className="text-muted-foreground">
          Real-time availability across all guest houses
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
          <div className="p-3 bg-secondary rounded-lg">
            <Building2 size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">
              {stats?.totalRooms || 0}
            </p>
            <p className="text-sm text-muted-foreground">Total Rooms</p>
          </div>
        </div>

        <div className="bg-success/10 rounded-xl border border-success/20 p-5 flex items-center gap-4">
          <div className="p-3 bg-success/20 rounded-lg">
            <CheckCircle size={24} className="text-success" />
          </div>
          <div>
            <p className="text-3xl font-bold text-success">
              {stats?.availableToday || 0}
            </p>
            <p className="text-sm text-muted-foreground">Available Now</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
          <div className="p-3 bg-secondary rounded-lg">
            <Bed size={24} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">
              {stats?.occupiedToday || 0}
            </p>
            <p className="text-sm text-muted-foreground">Currently Occupied</p>
          </div>
        </div>
      </div>

      {/* Guest Houses Grid */}
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Guest Houses
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {guestHouses.map((gh) => (
          <GuestHouseCard key={gh._id} guestHouse={gh} />
        ))}
      </div>
    </DashboardLayout>
  );
}
