"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import BookingCard from "@/components/cards/BookingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchBookings, updateBookingStatus } from "@/services/bookingApi";
import { fetchRooms } from "@/services/roomApi";
import { fetchGuestHouses } from "@/services/guestHouseApi";

const statusTabs = [
  { key: "all", label: "All Bookings" },
  { key: "PENDING", label: "Pending Approval" },
  { key: "REJECTED", label: "Rejected" },
  { key: "BOOKED", label: "Booked" },
  { key: "CHECKED_IN", label: "Checked In" },
  { key: "CHECKED_OUT", label: "Checked Out" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guestHouses, setGuestHouses] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState({});
  const [actionErrors, setActionErrors] = useState({});

  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const [bk, rm, gh] = await Promise.all([
          fetchBookings(),
          fetchRooms(),
          fetchGuestHouses(),
        ]);

        setBookings(bk);
        setRooms(rm);
        setGuestHouses(gh);
      } catch (err) {
        console.error("Failed to load bookings", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus = activeTab === "all" || b.status === activeTab;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (b.userId?.name || "").toLowerCase().includes(q) ||
        (b.department || "").toLowerCase().includes(q) ||
        (b.purpose || "").toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [bookings, activeTab, searchQuery]);

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[300px] flex items-center justify-center">
          Loading bookings...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Booking Management</h1>
          <p className="text-muted-foreground">
            Manage all guest house booking requests
          </p>
        </div>
        <Button onClick={() => router.push("/bookings/new")}>
          <Plus size={18} className="mr-2" /> New Booking
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2"
            size={18}
          />
          <Input
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter size={18} /> Filters
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded ${
              activeTab === tab.key ? "bg-primary text-white" : "bg-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filteredBookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              rooms={rooms}
              guestHouses={guestHouses}
              onAction={handleBookingAction}
              loading={actionLoading[booking._id]}
              error={actionErrors[booking._id]}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          No bookings found
        </div>
      )}
    </DashboardLayout>
  );
}
