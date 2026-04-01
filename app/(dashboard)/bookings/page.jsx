"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import BookingCard from "@/components/cards/BookingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchBookings, updateBookingStatus, editBooking } from "@/services/bookingApi";
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

  const [filterOpen, setFilterOpen] = useState(false);
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

  async function handleBookingEdit(id, data) {
    const updated = await editBooking(id, data);
    setBookings((prev) => prev.map((b) => (b._id === id ? updated : b)));
    return updated;
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Booking Management</h1>
          <p className="text-muted-foreground text-sm">Manage all guest house booking requests</p>
        </div>
        <Button onClick={() => router.push("/bookings/new")} className="w-full sm:w-auto">
          <Plus size={18} className="mr-2" /> New Booking
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-2"
          >
            <Filter size={16} />
            <span className="hidden sm:inline">
              {activeTab === "all" ? "Filter" : statusTabs.find(t => t.key === activeTab)?.label}
            </span>
            <span className="sm:hidden">
              {activeTab === "all" ? "Filter" : "●"}
            </span>
            <ChevronDown size={14} className={`transition-transform ${filterOpen ? "rotate-180" : ""}`} />
          </Button>

          {filterOpen && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-20 min-w-[180px] py-1">
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setFilterOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
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
              onEdit={handleBookingEdit}
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
