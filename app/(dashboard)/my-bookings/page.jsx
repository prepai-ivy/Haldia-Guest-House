"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import BookingCard from "@/components/cards/BookingCard";
import { useAuth } from "@/context/AuthContext";
import { CalendarCheck, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { fetchBookings } from "@/services/bookingApi";

export default function MyBookings() {
  const { user } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMyBookings() {
      try {
        const data = await fetchBookings();
        setBookings(data || []);
      } catch (err) {
        console.error("Failed to load bookings", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) loadMyBookings();
  }, [user]);

  const bookedCount = bookings.filter((b) => b.status === "BOOKED").length;
  const activeStayCount = bookings.filter(
    (b) => b.status === "CHECKED_IN"
  ).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[300px] flex items-center justify-center text-muted-foreground">
          Loading your bookings...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
          <p className="text-muted-foreground">
            Track your booking requests and stays
          </p>
        </div>
        <Button
          onClick={() => router.push("/new-request")}
          className="bg-primary hover:bg-primary/90"
        >
          New Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
          <div className="p-3 bg-secondary rounded-lg">
            <CalendarCheck size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">
              {bookings.length}
            </p>
            <p className="text-sm text-muted-foreground">Total Requests</p>
          </div>
        </div>

        <div className="bg-warning/10 rounded-xl border border-warning/20 p-5 flex items-center gap-4">
          <div className="p-3 bg-warning/20 rounded-lg">
            <Clock size={24} className="text-warning" />
          </div>
          <div>
            <p className="text-3xl font-bold text-warning">{bookedCount}</p>
            <p className="text-sm text-muted-foreground">Booked</p>
          </div>
        </div>

        <div className="bg-success/10 rounded-xl border border-success/20 p-5 flex items-center gap-4">
          <div className="p-3 bg-success/20 rounded-lg">
            <CheckCircle size={24} className="text-success" />
          </div>
          <div>
            <p className="text-3xl font-bold text-success">{activeStayCount}</p>
            <p className="text-sm text-muted-foreground">Active Stay</p>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bookings.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              showActions={false}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarCheck size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Bookings Yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Start by making your first booking request
          </p>
          <Button onClick={() => router.push("/new-request")}>
            Make a Request
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}
