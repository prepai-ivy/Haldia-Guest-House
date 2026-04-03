"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GuestHouseCard from "@/components/cards/GuestHouseCard";
import { Building2, Bed, CheckCircle, CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { fetchGuestHouses } from "@/services/guestHouseApi";
import { fetchDashboardStats } from "@/services/dashboardStatsApi";
import { fetchAllAvailableRooms } from "@/services/roomApi";
import { formatDateIST } from "@/utils/date";

export default function RoomAvailability() {
  const [guestHouses, setGuestHouses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [range, setRange] = useState({ from: undefined, to: undefined });
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showDateSelection, setShowDateSelection] = useState(true);

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

  // Fetch available rooms when dates are set
  useEffect(() => {
    if (!checkIn || !checkOut) {
      setAvailableRooms([]);
      return;
    }
    const from = `${checkIn}T${checkInTime || "14:00"}:00`;
    const to = `${checkOut}T${checkOutTime || "11:00"}:00`;

    setLoadingRooms(true);
    fetchAllAvailableRooms(from, to)
      .then(setAvailableRooms)
      .finally(() => setLoadingRooms(false));
  }, [checkIn, checkOut, checkInTime, checkOutTime]);

  // Filter guest houses that have available rooms
  const availableGuestHouses = useMemo(() => {
    if (!checkIn || !checkOut) return guestHouses;
    const ghIds = new Set(availableRooms.map((r) => r.guestHouseId?.toString()));
    return guestHouses.filter((gh) => ghIds.has(gh._id));
  }, [availableRooms, guestHouses, checkIn, checkOut]);

  const getDisabledDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return [{ before: today }, { after: maxDate }];
  };

  const resetDates = () => {
    setRange({ from: undefined, to: undefined });
    setCheckIn("");
    setCheckOut("");
    setAvailableRooms([]);
    setShowDateSelection(true);
  };

  const handleDateSelection = (selectedRange) => {
    if (!selectedRange) return;
    setRange(selectedRange);
    setCheckIn(selectedRange.from ? formatDateIST(selectedRange.from) : "");
    setCheckOut(selectedRange.to ? formatDateIST(selectedRange.to) : "");
    if (selectedRange.from && selectedRange.to) {
      setShowDateSelection(false);
    }
  };

  const changeDates = () => {
    setShowDateSelection(true);
  };

  const isDatesReady = !!(checkIn && checkOut);

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
          {showDateSelection ? "Select dates to check availability" : `Available rooms for ${new Date(checkIn).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} - ${new Date(checkOut).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`}
        </p>
      </div>

{showDateSelection ? (
        /* Date Selection Mode */
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={18} />
            <h2 className="font-semibold">Select Dates</h2>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            {!range.from && "Select your check-in date"}
            {range.from && !range.to && "Now select your check-out date"}
            {range.from && range.to && "Click 'Search Rooms' to find available rooms"}
          </p>

          <div className="bg-muted/30 p-4 rounded-lg border mb-4">
            <Calendar
              mode="range"
              selected={range}
              onSelect={handleDateSelection}
              disabled={getDisabledDates()}
              modifiers={{ today: new Date(), checkin: range.from }}
              modifiersClassNames={{
                today: "bg-primary/30 text-black font-semibold",
                checkin: "bg-primary text-white font-bold",
              }}
              className="rounded-md"
            />
          </div>

          {isDatesReady && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground font-medium">Check-in</p>
                  <p className="text-sm font-semibold">
                    {new Date(checkIn).toLocaleDateString("en-IN", {
                      weekday: "short", month: "short", day: "numeric",
                      timeZone: "Asia/Kolkata",
                    })}
                  </p>
                </div>
                <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground font-medium">Check-out</p>
                  <p className="text-sm font-semibold">
                    {new Date(checkOut).toLocaleDateString("en-IN", {
                      weekday: "short", month: "short", day: "numeric",
                      timeZone: "Asia/Kolkata",
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkInTime">Check-in Time</Label>
                  <Input
                    id="checkInTime"
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkOutTime">Check-out Time</Label>
                  <Input
                    id="checkOutTime"
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetDates}
                  className="flex-1"
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowDateSelection(false)}
                  className="flex-1"
                >
                  Search Rooms
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Results Mode */
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={changeDates}
                className="flex items-center gap-2"
              >
                <CalendarDays size={16} />
                Change Date
              </Button>
            </div>
          </div>

          {/* Guest Houses Grid */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">
              Available Guest Houses
              {loadingRooms && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Checking availability…
                </span>
              )}
            </h2>

            {!loadingRooms && availableGuestHouses.length === 0 && (
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg text-sm text-destructive">
                No guest houses have available rooms for the selected dates. Please choose different dates.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {availableGuestHouses.map((gh) => (
                <GuestHouseCard
                  key={gh._id}
                  guestHouse={gh}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  availableRooms={availableRooms.filter((r) => r.guestHouseId?.toString() === gh._id)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
