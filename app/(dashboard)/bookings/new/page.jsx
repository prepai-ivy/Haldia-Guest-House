"use client";

import { useEffect, useState } from "react";
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
import { ArrowLeft, CalendarDays, User, Building2, Check, Loader2 } from "lucide-react";
import { fetchAvailability } from "@/services/availabilityApi";
import { formatDateIST } from "@/utils/date";

import { fetchGuestHouses } from "@/services/guestHouseApi";
import { fetchRoomsByGuestHouse } from "@/services/roomApi";
import { createBooking } from "@/services/bookingApi";

import { useAuth } from "@/context/AuthContext";
import Notification from "@/components/ui/Notification";

function getNext3MonthsRange() {
  const from = new Date();
  const to = new Date();
  to.setMonth(to.getMonth() + 3);
  return { from: formatDateIST(from), to: formatDateIST(to) };
}

export default function NewBooking() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [guestHouses, setGuestHouses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [notification, setNotification] = useState(null);

  const { user, isCustomer } = useAuth();

  const [range, setRange] = useState({ from: undefined, to: undefined });

  const preGuestHouseId = searchParams.get("guestHouseId");
  const preRoomId = searchParams.get("roomId");

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
    purpose: "",
  });

  useEffect(() => {
    if (preGuestHouseId) {
      setFormData((prev) => ({ ...prev, guestHouseId: String(preGuestHouseId) }));
    }
  }, [preGuestHouseId]);

  useEffect(() => {
    if (preRoomId && rooms.length > 0) {
      const exists = rooms.some((r) => r._id === preRoomId);
      if (exists) setFormData((prev) => ({ ...prev, roomId: preRoomId }));
    }
  }, [preRoomId, rooms]);

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

  const getDisabledDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    const disabled = [{ before: today }, { after: maxDate }];
    blockedSlots.forEach((slot) => {
      disabled.push({ from: new Date(slot.from), to: new Date(slot.to) });
    });
    return disabled;
  };

  const hasOverlap = () => {
    if (!formData.checkIn || !formData.checkOut || !formData.checkInTime || !formData.checkOutTime)
      return false;
    const userCheckIn = new Date(`${formData.checkIn}T${formData.checkInTime}`);
    const userCheckOut = new Date(`${formData.checkOut}T${formData.checkOutTime}`);
    for (const slot of blockedSlots) {
      if (userCheckIn < new Date(slot.to) && userCheckOut > new Date(slot.from)) return true;
    }
    return false;
  };

  const resetDates = () => {
    setRange({ from: undefined, to: undefined });
    setFormData((prev) => ({
      ...prev,
      checkIn: "",
      checkOut: "",
      checkInTime: "14:00",
      checkOutTime: "11:00",
    }));
  };

  useEffect(() => {
    fetchGuestHouses().then(setGuestHouses);
  }, []);

  useEffect(() => {
    if (!formData.roomId) return;
    const { from, to } = getNext3MonthsRange();
    fetchAvailability({ roomId: formData.roomId, from, to }).then((data) => {
      setBlockedSlots(data.blockedSlots || []);
    });
  }, [formData.roomId]);

  useEffect(() => {
    if (!formData.guestHouseId) return;
    fetchRoomsByGuestHouse(formData.guestHouseId).then(setRooms);
  }, [formData.guestHouseId]);

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

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

  const isRoomReady = formData.guestHouseId && formData.roomId;

  /* Shared calendar/dates section — extracted to avoid nested <p> and reuse */
  const calendarSection = (
    <div className="space-y-4">
      <div>
        <Label>Stay Dates (Check-in &amp; Check-out)</Label>
        <p className="text-sm font-medium mt-2 text-muted-foreground">
          {!range.from && "Select your check-in date"}
          {range.from && !range.to && "Now select your check-out date"}
          {range.from && range.to && "Dates selected successfully"}
        </p>
      </div>

      <div className="relative bg-muted/30 p-4 rounded-lg border">
        {!isRoomReady && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground text-center px-4">
              Please select guest house and room first
            </p>
          </div>
        )}
        <Calendar
          mode="range"
          selected={range}
          onSelect={(selectedRange) => {
            if (!isRoomReady || !selectedRange) return;
            setRange(selectedRange);
            setFormData((prev) => ({
              ...prev,
              checkIn: selectedRange.from ? formatDateIST(selectedRange.from) : "",
              checkOut: selectedRange.to ? formatDateIST(selectedRange.to) : "",
            }));
            if (selectedRange.from && !selectedRange.to) {
              setNotification({
                type: "success",
                title: "Check-in Selected",
                message: "Now select your check-out date.",
              });
            }
            if (selectedRange.from && selectedRange.to) {
              setNotification({
                type: "success",
                title: "Dates Selected",
                message: "Your stay dates are selected.",
              });
            }
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

      {formData.checkIn && formData.checkOut && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground font-medium">Check-in</p>
              <p className="text-sm font-semibold text-foreground">
                {new Date(formData.checkIn).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground font-medium">Check-out</p>
              <p className="text-sm font-semibold text-foreground">
                {new Date(formData.checkOut).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
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

      {formData.checkIn && formData.checkOut && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="checkInTime">Check-in Time</Label>
            <Input
              id="checkInTime"
              type="time"
              value={formData.checkInTime || "14:00"}
              onChange={(e) => handleChange("checkInTime", e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkOutTime">Check-out Time</Label>
            <Input
              id="checkOutTime"
              type="time"
              value={formData.checkOutTime || "11:00"}
              onChange={(e) => handleChange("checkOutTime", e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      )}

      {hasOverlap() && (
        <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
          <p className="text-sm text-destructive font-medium">
            ⚠️ Selected date/time range conflicts with unavailable slots for this room
          </p>
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
          <h1 className="text-2xl font-bold mb-2">Booking Request Submitted</h1>
          <p className="text-muted-foreground mb-6">
            Your request has been sent for approval.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => router.push(isCustomer ? "/new-request" : "/bookings/new")}
            >
              New Booking Request
            </Button>
            <Button onClick={() => router.push("/my-bookings")}>
              Go to My Bookings
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* ---- Customer: single-page form (details pre-filled, no step 2 needed) ---- */
  if (isCustomer) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-secondary rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">New Booking Request</h1>
              <p className="text-muted-foreground text-sm">
                Select your room, dates and purpose
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-card border rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-2">
                <Building2 size={18} />
                <h2 className="font-semibold">Select Accommodation</h2>
              </div>

              <div className="space-y-2">
                <Label>Guest House</Label>
                <Select
                  key={formData.guestHouseId}
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
                    {guestHouses.map((gh) => (
                      <SelectItem key={gh._id} value={gh._id}>
                        {gh.name} – {gh.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.guestHouseId && (
                <div className="space-y-2">
                  <Label>Available Rooms</Label>
                  <Select
                    value={formData.roomId}
                    onValueChange={(v) => handleChange("roomId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((r) => (
                        <SelectItem key={r._id} value={r._id}>
                          Room {r.roomNumber} – {r.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {calendarSection}

              <div className="space-y-2">
                <Label>Purpose of Visit</Label>
                <Textarea
                  placeholder="Describe the purpose of this booking..."
                  value={formData.purpose}
                  onChange={(e) => handleChange("purpose", e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-success hover:bg-success/90"
                disabled={
                  submitting ||
                  !formData.guestHouseId ||
                  !formData.roomId ||
                  !formData.checkIn ||
                  !formData.checkOut ||
                  hasOverlap() ||
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

  /* ---- Admin / Super Admin: 3-step form ---- */
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
            className="p-2 hover:bg-secondary rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">New Booking Request</h1>
            <p className="text-muted-foreground">Step {step} of 3</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* STEP 1: Accommodation & Dates */}
          {step === 1 && (
            <div className="bg-card border rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-2">
                <Building2 size={18} />
                <h2 className="font-semibold">Select Accommodation</h2>
              </div>

              <div className="space-y-2">
                <Label>Guest House</Label>
                <Select
                  key={formData.guestHouseId}
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
                    {guestHouses.map((gh) => (
                      <SelectItem key={gh._id} value={gh._id}>
                        {gh.name} – {gh.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.guestHouseId && (
                <div className="space-y-2">
                  <Label>Available Rooms</Label>
                  <Select
                    value={formData.roomId}
                    onValueChange={(v) => handleChange("roomId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((r) => (
                        <SelectItem key={r._id} value={r._id}>
                          Room {r.roomNumber} – {r.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {calendarSection}

              <Button
                type="button"
                className="w-full"
                onClick={() => setStep(2)}
                disabled={
                  !formData.guestHouseId ||
                  !formData.roomId ||
                  !formData.checkIn ||
                  !formData.checkOut ||
                  hasOverlap() ||
                  new Date(formData.checkIn) >= new Date(formData.checkOut)
                }
              >
                Continue
              </Button>
            </div>
          )}

          {/* STEP 2: Guest Details */}
          {step === 2 && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User size={20} className="text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Guest Information</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE">Single</SelectItem>
                      <SelectItem value="DOUBLE">Double</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={
                    !formData.guestName ||
                    !formData.guestEmail ||
                    !formData.department
                  }
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Purpose & Confirm */}
          {step === 3 && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
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
                <h3 className="font-medium text-foreground">Booking Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Guest House:</span>
                  <span className="text-foreground">
                    {guestHouses.find((g) => g._id === formData.guestHouseId)?.name}
                  </span>
                  <span className="text-muted-foreground">Room:</span>
                  <span className="text-foreground">
                    {rooms.find((r) => r._id === formData.roomId)?.roomNumber}
                  </span>
                  <span className="text-muted-foreground">Guest:</span>
                  <span className="text-foreground">{formData.guestName}</span>
                  <span className="text-muted-foreground">Dates:</span>
                  <span className="text-foreground">
                    {formData.checkIn} to {formData.checkOut}
                  </span>
                  <span className="text-muted-foreground">Occupancy:</span>
                  <span className="text-foreground capitalize">
                    {formData.occupancyType}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.purpose}
                  className="flex-1 bg-success hover:bg-success/90"
                >
                  Submit Request
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
