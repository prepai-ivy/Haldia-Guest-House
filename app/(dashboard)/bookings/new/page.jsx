"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  CalendarDays,
  User,
  Building2,
  Check,
  Loader2,
} from "lucide-react";
import { formatDateIST } from "@/utils/date";

import { fetchGuestHouses } from "@/services/guestHouseApi";
import { fetchAllAvailableRooms } from "@/services/roomApi";
import { createBooking } from "@/services/bookingApi";

import { useAuth } from "@/context/AuthContext";
import Notification from "@/components/ui/Notification";
import AdminGuestHouseCard from "@/components/cards/AdminGuestHouseCard";

const PAYMENT_MODES = [
  { value: "COMPANY_SPONSORED", label: "Company Sponsored" },
  { value: "SALARY_DEDUCTION", label: "Salary Deduction" },
  { value: "SELF_PAY", label: "Self Pay" },
];

export default function NewBooking() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [guestHouses, setGuestHouses] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [notification, setNotification] = useState(null);

  const { user, isCustomer } = useAuth();
  const searchParams = useSearchParams();

  const [fixedGuestHouse, setFixedGuestHouse] = useState(false);
  const [fixedRoom, setFixedRoom] = useState(false);

  const [range, setRange] = useState({ from: undefined, to: undefined });
  const [showDateSelection, setShowDateSelection] = useState(true);

  const [formData, setFormData] = useState({
    guestHouseId: undefined,
    roomId: undefined,
    guestName: "",
    guestEmail: "",
    department: "",
    checkIn: "",
    checkOut: "",
    checkInTime: "14:00",
    checkOutTime: "11:00",
    occupancyType: "SINGLE",
    paymentMode: "COMPANY_SPONSORED",
    purpose: "",
  });

  useEffect(() => {
    if (isCustomer && user) {
      setFormData((prev) => ({
        ...prev,
        guestName: user.name || "",
        guestEmail: user.email || "",
        department: user.department || "",
      }));
    }
  }, [isCustomer, user]);

  useEffect(() => {
    const ghId = searchParams.get("guestHouseId");
    const roomId = searchParams.get("roomId");
    const checkInParam = searchParams.get("checkIn");
    const checkOutParam = searchParams.get("checkOut");
    const checkInTimeParam = searchParams.get("checkInTime");
    const checkOutTimeParam = searchParams.get("checkOutTime");

    if (ghId) {
      setFixedGuestHouse(true);
      setFormData((prev) => ({ ...prev, guestHouseId: ghId }));
    }
    if (roomId) {
      setFixedRoom(true);
      setFormData((prev) => ({ ...prev, roomId }));
    }
    if (checkInParam) {
      setFormData((prev) => ({ ...prev, checkIn: checkInParam }));
      if (checkOutParam) {
        setRange({ from: new Date(checkInParam), to: new Date(checkOutParam) });
      }
    }
    if (checkOutParam) {
      setFormData((prev) => ({ ...prev, checkOut: checkOutParam }));
    }
    if (checkInTimeParam) {
      setFormData((prev) => ({ ...prev, checkInTime: checkInTimeParam }));
    }
    if (checkOutTimeParam) {
      setFormData((prev) => ({ ...prev, checkOutTime: checkOutTimeParam }));
    }
  }, [searchParams]);

  useEffect(() => {
    fetchGuestHouses().then(setGuestHouses);
  }, []);

  // Fetch all available rooms across all guest houses when dates+times are set
  useEffect(() => {
    if (!formData.checkIn || !formData.checkOut) {
      setAvailableRooms([]);
      return;
    }
    const from = `${formData.checkIn}T${formData.checkInTime || "14:00"}:00`;
    const to = `${formData.checkOut}T${formData.checkOutTime || "11:00"}:00`;

    setLoadingRooms(true);
    fetchAllAvailableRooms(from, to)
      .then((rooms) => {
        setAvailableRooms(rooms);
        // Clear GH/room if no longer available (but keep fixed selections from query params)
        setFormData((prev) => {
          const ghIds = new Set(rooms.map((r) => r.guestHouseId?.toString()));
          if (prev.guestHouseId && !fixedGuestHouse && !ghIds.has(prev.guestHouseId)) {
            return { ...prev, guestHouseId: undefined, roomId: undefined };
          }
          if (prev.roomId && !fixedRoom && !rooms.some((r) => r._id === prev.roomId)) {
            return { ...prev, roomId: undefined };
          }
          return prev;
        });
      })
      .finally(() => setLoadingRooms(false));
  }, [formData.checkIn, formData.checkOut, formData.checkInTime, formData.checkOutTime, fixedGuestHouse, fixedRoom]);

  // Guest houses that have at least one available room
  const availableGuestHouses = useMemo(() => {
    if (fixedGuestHouse && formData.guestHouseId) {
      return guestHouses.filter((gh) => gh._id === formData.guestHouseId);
    }

    const ghIds = new Set(availableRooms.map((r) => r.guestHouseId?.toString()));
    return guestHouses.filter((gh) => ghIds.has(gh._id));
  }, [availableRooms, guestHouses, fixedGuestHouse, formData.guestHouseId]);

  // Rooms for the selected guest house
  const roomsForGH = useMemo(() => {
    if (!formData.guestHouseId) return [];

    const rooms = availableRooms.filter(
      (r) => r.guestHouseId?.toString() === formData.guestHouseId
    );

    if (fixedRoom && formData.roomId) {
      return rooms.filter((r) => r._id === formData.roomId);
    }

    return rooms;
  }, [availableRooms, formData.guestHouseId, formData.roomId, fixedRoom]);

  const selectedGuestHouse = guestHouses.find((gh) => gh._id === formData.guestHouseId);
  const selectedRoom = roomsForGH.find((r) => r._id === formData.roomId);

  const getDisabledDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return [{ before: today }, { after: maxDate }];
  };

  const resetDates = () => {
    setRange({ from: undefined, to: undefined });
    setAvailableRooms([]);
    setFormData((prev) => ({
      ...prev,
      checkIn: "",
      checkOut: "",
      checkInTime: "14:00",
      checkOutTime: "11:00",
      guestHouseId: fixedGuestHouse ? prev.guestHouseId : undefined,
      roomId: fixedRoom ? prev.roomId : undefined,
    }));
  };

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleDateSelection = (selectedRange) => {
    if (!selectedRange) return;
    setRange(selectedRange);
    setFormData((prev) => ({
      ...prev,
      checkIn: selectedRange.from ? formatDateIST(selectedRange.from) : "",
      checkOut: selectedRange.to ? formatDateIST(selectedRange.to) : "",
      guestHouseId: undefined,
      roomId: undefined,
    }));
  };

  const resetDateSelection = () => {
    setRange({ from: undefined, to: undefined });
    setFormData((prev) => ({
      ...prev,
      checkIn: "",
      checkOut: "",
      checkInTime: "14:00",
      checkOutTime: "11:00",
      guestHouseId: undefined,
      roomId: undefined,
    }));
    setAvailableRooms([]);
  };

  const handleRoomSelectionFromCard = (ghId, roomId) => {
    setFormData((prev) => ({
      ...prev,
      guestHouseId: ghId,
      roomId,
    }));
    setShowDateSelection(false);
    setStep(1);
  };

  const changeDatesAdmin = () => {
    setShowDateSelection(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const checkInDateTime = new Date(`${formData.checkIn} ${formData.checkInTime}`);
    const checkOutDateTime = new Date(`${formData.checkOut} ${formData.checkOutTime}`);
    try {
      await createBooking({
        guestName: formData.guestName,
        email: formData.guestEmail,
        department: formData.department,
        guestHouseId: formData.guestHouseId,
        roomId: formData.roomId,
        checkInDate: checkInDateTime.toISOString(),
        checkOutDate: checkOutDateTime.toISOString(),
        occupancyType: formData.occupancyType,
        paymentMode: formData.paymentMode,
        purpose: formData.purpose,
      });
      setSubmitted(true);
    } catch (error) {
      setNotification({
        type: "error",
        title: "Submission Failed",
        message: error.message || "Something went wrong.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isDatesReady = !!(formData.checkIn && formData.checkOut);
  const isRoomReady = !!(formData.guestHouseId && formData.roomId);

  /* ---- Date section (shared) ---- */
  const dateSection = (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CalendarDays size={18} />
        <h2 className="font-semibold">Select Dates</h2>
      </div>

      <p className="text-sm text-muted-foreground">
        {!range.from && "Select your check-in date"}
        {range.from && !range.to && "Now select your check-out date"}
        {range.from && range.to && "Dates selected — scroll down to pick a guest house"}
      </p>

      <div className="bg-muted/30 p-4 rounded-lg border">
        <Calendar
          mode="range"
          selected={range}
          onSelect={(selectedRange) => {
            if (!selectedRange) return;
            setRange(selectedRange);
            setFormData((prev) => ({
              ...prev,
              checkIn: selectedRange.from ? formatDateIST(selectedRange.from) : "",
              checkOut: selectedRange.to ? formatDateIST(selectedRange.to) : "",
              guestHouseId: fixedGuestHouse ? prev.guestHouseId : undefined,
              roomId: fixedRoom ? prev.roomId : undefined,
            }));
          }}
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
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground font-medium">Check-in</p>
              <p className="text-sm font-semibold">
                {new Date(formData.checkIn).toLocaleDateString("en-IN", {
                  weekday: "short", month: "short", day: "numeric",
                  timeZone: "Asia/Kolkata",
                })}
              </p>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground font-medium">Check-out</p>
              <p className="text-sm font-semibold">
                {new Date(formData.checkOut).toLocaleDateString("en-IN", {
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
                value={formData.checkInTime}
                onChange={(e) => handleChange("checkInTime", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOutTime">Check-out Time</Label>
              <Input
                id="checkOutTime"
                type="time"
                value={formData.checkOutTime}
                onChange={(e) => handleChange("checkOutTime", e.target.value)}
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={resetDates}
            className="w-full text-sm bg-transparent"
          >
            Reset Dates
          </Button>
        </div>
      )}
    </div>
  );

  /* ---- Guest house + room section (shown after dates) ---- */
  const accommodationSection = isDatesReady && (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 size={18} />
        <h2 className="font-semibold">
          Select Accommodation
          {loadingRooms && (
            <span className="ml-2 text-xs font-normal text-muted-foreground inline-flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" /> Checking availability…
            </span>
          )}
        </h2>
      </div>

      {!loadingRooms && availableGuestHouses.length === 0 && (
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg text-sm text-destructive">
          No guest houses have available rooms for the selected dates. Please choose different dates.
        </div>
      )}

      {availableGuestHouses.length > 0 && (
        <div className="space-y-2">
          <Label>Guest House</Label>

          {fixedGuestHouse ? (
            <Input value={selectedGuestHouse?.name || "Selected guest house"} disabled />
          ) : (
            <Select
              value={formData.guestHouseId}
              onValueChange={(v) => {
                handleChange("guestHouseId", v);
                handleChange("roomId", undefined);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select guest house" />
              </SelectTrigger>
              <SelectContent>
                {availableGuestHouses.map((gh) => (
                  <SelectItem key={gh._id} value={gh._id}>
                    {gh.name} – {gh.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {formData.guestHouseId && (
        <div className="space-y-2">
          <Label>Available Room</Label>

          {fixedRoom ? (
            <Input
              value={selectedRoom ? `Room ${selectedRoom.roomNumber} – ${selectedRoom.type}` : `Room allocation selected`}
              disabled
            />
          ) : (
            <Select
              value={formData.roomId}
              onValueChange={(v) => handleChange("roomId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {roomsForGH.map((r) => (
                  <SelectItem key={r._id} value={r._id}>
                    Room {r.roomNumber} – {r.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );

  /* ---- Submitted success screen ---- */
  if (submitted) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto mt-12 text-center">
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-success" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {isCustomer ? "Booking Request Submitted" : "Booking Created"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isCustomer
              ? "Your request has been sent for approval. You will receive a confirmation email once approved."
              : "The booking has been confirmed and the guest has been notified."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(false);
                setStep(1);
                setRange({ from: undefined, to: undefined });
                setAvailableRooms([]);
                setFormData({
                  guestHouseId: undefined, roomId: undefined,
                  guestName: isCustomer ? user?.name || "" : "",
                  guestEmail: isCustomer ? user?.email || "" : "",
                  department: isCustomer ? user?.department || "" : "",
                  checkIn: "", checkOut: "",
                  checkInTime: "14:00", checkOutTime: "11:00",
                  occupancyType: "SINGLE",
                  paymentMode: "COMPANY_SPONSORED",
                  purpose: "",
                });
              }}
            >
              New Booking
            </Button>
            <Button onClick={() => router.push(isCustomer ? "/my-bookings" : "/bookings")}>
              View Bookings
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* ---- Customer: Date-first flow with results view ---- */
  if (isCustomer) {
    /* Date Selection View */
    if (showDateSelection) {
      return (
        <DashboardLayout>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">Book a Room</h1>
              <p className="text-muted-foreground">Select dates to check availability</p>
            </div>

            {/* Date Selection Card */}
            <div className="bg-card rounded-xl border border-border p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays size={18} />
                <h2 className="font-semibold">Select Dates</h2>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {!range.from && "Select your check-in date"}
                {range.from && !range.to && "Select your check-out date"}
                {range.from && range.to && "Click 'View Rooms' to see available options"}
              </p>

              <div className="bg-muted/30 p-4 rounded-lg border mb-4">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={(selectedRange) => {
                    if (!selectedRange) return;
                    setRange(selectedRange);
                    setFormData((prev) => ({
                      ...prev,
                      checkIn: selectedRange.from ? formatDateIST(selectedRange.from) : "",
                      checkOut: selectedRange.to ? formatDateIST(selectedRange.to) : "",
                      guestHouseId: undefined,
                      roomId: undefined,
                    }));
                  }}
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
                        {new Date(formData.checkIn).toLocaleDateString("en-IN", {
                          weekday: "short", month: "short", day: "numeric",
                          timeZone: "Asia/Kolkata",
                        })}
                      </p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                      <p className="text-xs text-muted-foreground font-medium">Check-out</p>
                      <p className="text-sm font-semibold">
                        {new Date(formData.checkOut).toLocaleDateString("en-IN", {
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
                        value={formData.checkInTime}
                        onChange={(e) => handleChange("checkInTime", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="checkOutTime">Check-out Time</Label>
                      <Input
                        id="checkOutTime"
                        type="time"
                        value={formData.checkOutTime}
                        onChange={(e) => handleChange("checkOutTime", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setRange({ from: undefined, to: undefined });
                        setFormData((prev) => ({
                          ...prev,
                          checkIn: "", checkOut: "", checkInTime: "14:00", checkOutTime: "11:00",
                          guestHouseId: undefined, roomId: undefined,
                        }));
                        setAvailableRooms([]);
                      }}
                      className="flex-1"
                    >
                      Reset
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowDateSelection(false)}
                      className="flex-1"
                    >
                      View Rooms
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DashboardLayout>
      );
    }

    /* Results View - Guest Houses with Available Rooms */
    if (!showDateSelection && isDatesReady && !formData.roomId) {
      return (
        <DashboardLayout>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Available Rooms</h1>
                <p className="text-muted-foreground">
                  {new Date(formData.checkIn).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} - {new Date(formData.checkOut).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDateSelection(true)}
                className="flex items-center gap-2"
              >
                <CalendarDays size={16} />
                Change Date
              </Button>
            </div>

            {loadingRooms && (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                Checking availability…
              </div>
            )}

            {!loadingRooms && availableGuestHouses.length === 0 && (
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg text-sm text-destructive">
                No guest houses have available rooms for the selected dates. Please choose different dates.
              </div>
            )}

            {!loadingRooms && availableGuestHouses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {availableGuestHouses.map((gh) => (
                  <div
                    key={gh._id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="mb-3">
                      <h3 className="font-semibold text-lg">{gh.name}</h3>
                      <p className="text-sm text-muted-foreground">{gh.location}</p>
                    </div>

                    {/* Available Rooms Info */}
                    <div className="mb-4 p-2 bg-secondary/50 rounded text-sm">
                      <div className="flex justify-between">
                        <span>Available Rooms</span>
                        <span className="font-semibold">
                          {availableRooms.filter((r) => r.guestHouseId?.toString() === gh._id).length}
                        </span>
                      </div>
                    </div>

                    {/* Rooms List */}
                    <div className="space-y-2 max-h-52 overflow-y-auto border rounded p-3 bg-muted/20">
                      {availableRooms.filter((r) => r.guestHouseId?.toString() === gh._id).length > 0 ? (
                        availableRooms
                          .filter((r) => r.guestHouseId?.toString() === gh._id)
                          .map((room) => (
                            <button
                              key={room._id}
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  guestHouseId: gh._id,
                                  roomId: room._id,
                                }));
                                setShowDateSelection(false);
                              }}
                              className="w-full text-left p-2 rounded hover:bg-primary/10 border hover:border-primary transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium text-sm">Room {room.roomNumber}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {room.capacity} guests
                                  </p>
                                </div>
                                <div className="text-primary text-xs font-semibold">Select</div>
                              </div>
                            </button>
                          ))
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No rooms available
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DashboardLayout>
      );
    }

    /* Booking Form - After Room Selection */
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => {
                setFormData((prev) => ({ ...prev, guestHouseId: undefined, roomId: undefined }));
                setShowDateSelection(false);
              }}
              className="p-2 hover:bg-secondary rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Complete Your Booking</h1>
              <p className="text-muted-foreground text-sm">
                Room {selectedRoom?.roomNumber} at {selectedGuestHouse?.name}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-card border rounded-xl p-6 space-y-6">
              {/* Visit Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User size={18} />
                  <h2 className="font-semibold">Visit Details</h2>
                </div>

                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select
                    value={formData.paymentMode}
                    onValueChange={(v) => handleChange("paymentMode", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_MODES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Purpose of Visit</Label>
                  <Textarea
                    placeholder="Describe the purpose of this booking..."
                    value={formData.purpose}
                    onChange={(e) => handleChange("purpose", e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Booking Summary */}
                <div className="bg-secondary rounded-lg p-4 mt-6 space-y-3">
                  <h3 className="font-medium">Booking Summary</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Check-in:</span>
                    <span>{formData.checkIn} {formData.checkInTime}</span>
                    <span className="text-muted-foreground">Check-out:</span>
                    <span>{formData.checkOut} {formData.checkOutTime}</span>
                    <span className="text-muted-foreground">Payment:</span>
                    <span>{PAYMENT_MODES.find((m) => m.value === formData.paymentMode)?.label}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, guestHouseId: undefined, roomId: undefined }));
                    setShowDateSelection(false);
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-success hover:bg-success/90"
                  disabled={
                    submitting ||
                    !formData.purpose ||
                    new Date(formData.checkIn) >= new Date(formData.checkOut)
                  }
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Submitting…
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
        {notification && (
          <Notification
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </DashboardLayout>
    );

  /* ---- Admin / Super Admin ---- */
  if (!isCustomer) {
    /* Date Selection + Results View for Admin */
    if (showDateSelection) {
      return (
        <DashboardLayout>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">Allocate Room</h1>
              <p className="text-muted-foreground">
                {!formData.checkIn || !formData.checkOut ? "Select dates to check availability" : `Available rooms for ${new Date(formData.checkIn).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} - ${new Date(formData.checkOut).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`}
              </p>
            </div>

            {/* Date Selection */}
            <div className="bg-card rounded-xl border border-border p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays size={18} />
                <h2 className="font-semibold">Select Dates</h2>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {!range.from && "Select check-in date"}
                {range.from && !range.to && "Select check-out date"}
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
                        {new Date(formData.checkIn).toLocaleDateString("en-IN", {
                          weekday: "short", month: "short", day: "numeric",
                          timeZone: "Asia/Kolkata",
                        })}
                      </p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                      <p className="text-xs text-muted-foreground font-medium">Check-out</p>
                      <p className="text-sm font-semibold">
                        {new Date(formData.checkOut).toLocaleDateString("en-IN", {
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
                        value={formData.checkInTime}
                        onChange={(e) => handleChange("checkInTime", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="checkOutTime">Check-out Time</Label>
                      <Input
                        id="checkOutTime"
                        type="time"
                        value={formData.checkOutTime}
                        onChange={(e) => handleChange("checkOutTime", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetDateSelection}
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
          </div>
        </DashboardLayout>
      );
    }

    /* Results View with Guest House Cards */
    if (!showDateSelection && isDatesReady && !formData.roomId) {
      return (
        <DashboardLayout>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Available Rooms</h1>
                <p className="text-muted-foreground">
                  {new Date(formData.checkIn).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} - {new Date(formData.checkOut).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={changeDatesAdmin}
                className="flex items-center gap-2"
              >
                <CalendarDays size={16} />
                Change Date
              </Button>
            </div>

            {loadingRooms && (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                Checking availability…
              </div>
            )}

            {!loadingRooms && availableGuestHouses.length === 0 && (
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg text-sm text-destructive">
                No guest houses have available rooms for the selected dates. Please choose different dates.
              </div>
            )}

            {!loadingRooms && availableGuestHouses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {availableGuestHouses.map((gh) => (
                  <AdminGuestHouseCard
                    key={gh._id}
                    guestHouse={gh}
                    checkIn={formData.checkIn}
                    checkOut={formData.checkOut}
                    availableRooms={availableRooms.filter((r) => r.guestHouseId?.toString() === gh._id)}
                    onRoomSelect={handleRoomSelectionFromCard}
                  />
                ))}
              </div>
            )}
          </div>
        </DashboardLayout>
      );
    }

    /* Admin 3-Step Form (after room selection) */
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => {
                if (step > 1) {
                  setStep(step - 1);
                } else {
                  setShowDateSelection(true);
                  setFormData((prev) => ({ ...prev, guestHouseId: undefined, roomId: undefined }));
                  setStep(1);
                }
              }}
              className="p-2 hover:bg-secondary rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">New Booking</h1>
              <p className="text-muted-foreground">Step {step} of 3</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
          {/* STEP 1: Dates → Guest house → Room */}
          {step === 1 && (
            <div className="bg-card border rounded-xl p-6 space-y-8">
              {dateSection}
              {isDatesReady && <hr className="border-border" />}
              {accommodationSection}
              <Button
                type="button"
                className="w-full"
                onClick={() => setStep(2)}
                disabled={
                  !isRoomReady ||
                  new Date(formData.checkIn) >= new Date(formData.checkOut)
                }
              >
                Continue
              </Button>
            </div>
          )}

          {/* STEP 2: Guest Details + Payment Mode */}
          {step === 2 && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User size={20} className="text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Guest Information</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Guest Name</Label>
                  <Input
                    placeholder="Full name"
                    value={formData.guestName}
                    onChange={(e) => handleChange("guestName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="guest@example.com"
                    value={formData.guestEmail}
                    onChange={(e) => handleChange("guestEmail", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    placeholder="e.g., Engineering"
                    value={formData.department}
                    onChange={(e) => handleChange("department", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Occupancy Type</Label>
                  <Select
                    value={formData.occupancyType}
                    onValueChange={(v) => handleChange("occupancyType", v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE">Single</SelectItem>
                      <SelectItem value="DOUBLE">Double</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select
                  value={formData.paymentMode}
                  onValueChange={(v) => handleChange("paymentMode", v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!formData.guestName || !formData.guestEmail || !formData.department}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Purpose + Confirm */}
          {step === 3 && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CalendarDays size={20} className="text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Purpose &amp; Confirmation</h2>
              </div>

              <div className="space-y-2">
                <Label>Purpose of Visit</Label>
                <Textarea
                  placeholder="Describe the purpose of this booking..."
                  value={formData.purpose}
                  onChange={(e) => handleChange("purpose", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="bg-secondary rounded-lg p-4 space-y-3">
                <h3 className="font-medium">Booking Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Guest House:</span>
                  <span>{availableGuestHouses.find((g) => g._id === formData.guestHouseId)?.name}</span>
                  <span className="text-muted-foreground">Room:</span>
                  <span>{roomsForGH.find((r) => r._id === formData.roomId)?.roomNumber}</span>
                  <span className="text-muted-foreground">Guest:</span>
                  <span>{formData.guestName}</span>
                  <span className="text-muted-foreground">Check-in:</span>
                  <span>{formData.checkIn} {formData.checkInTime}</span>
                  <span className="text-muted-foreground">Check-out:</span>
                  <span>{formData.checkOut} {formData.checkOutTime}</span>
                  <span className="text-muted-foreground">Payment:</span>
                  <span>{PAYMENT_MODES.find((m) => m.value === formData.paymentMode)?.label}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !formData.purpose}
                  className="flex-1 bg-success hover:bg-success/90"
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin mr-2" />Submitting…</>
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </DashboardLayout>
  );
  }
}
}