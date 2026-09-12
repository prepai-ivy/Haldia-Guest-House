"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDateIST } from "@/utils/date";

import { fetchGuestHouses } from "@/services/guestHouseApi";
import { fetchAllAvailableRooms } from "@/services/roomApi";
import { createBooking } from "@/services/bookingApi";
import { fetchGrades } from "@/services/gradeApi";

import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Import the new components
import { BookingSuccessScreen } from "@/components/booking/BookingSuccessScreen";
import { CustomerDateSelection } from "@/components/booking/CustomerDateSelection";
import { CustomerRoomSelection } from "@/components/booking/CustomerRoomSelection";
import { CustomerBookingForm } from "@/components/booking/CustomerBookingForm";
import { AdminDateSelection } from "@/components/booking/AdminDateSelection";
import { AdminRoomSelection } from "@/components/booking/AdminRoomSelection";
import { AdminBookingForm } from "@/components/booking/AdminBookingForm";
import Notification from "@/components/ui/Notification";

export default function NewBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const [guestHouses, setGuestHouses] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [grades, setGrades] = useState([]);

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
    attachmentBlobPath: null,
    attachmentFileName: null,
  });

  // Initialize form data based on user type
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

  // Handle URL parameters
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

  // If guestHouseId+roomId+checkIn+checkOut are already set via query, skip date selection and go to final booking form.
  useEffect(() => {
    if (formData.guestHouseId && formData.roomId && formData.checkIn && formData.checkOut) {
      setShowDateSelection(false);
      if (!isCustomer) {
        setStep(1);
      }
    }
  }, [formData.guestHouseId, formData.roomId, formData.checkIn, formData.checkOut, isCustomer]);

  // Fetch guest houses + grades once for the whole flow (grades are needed by
  // CustomerRoomSelection for occupancy eligibility — fetching here instead of inside that
  // component avoids refetching every time the customer revisits room selection).
  useEffect(() => {
    fetchGuestHouses().then(setGuestHouses);
    fetchGrades().then(setGrades).catch(() => setGrades([]));
  }, []);

  // Fetch available rooms when dates change
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

  // Computed values
  const availableGuestHouses = useMemo(() => {
    if (fixedGuestHouse && formData.guestHouseId) {
      return guestHouses.filter((gh) => gh._id === formData.guestHouseId);
    }

    const ghIds = new Set(availableRooms.map((r) => r.guestHouseId?.toString()));
    return guestHouses.filter((gh) => ghIds.has(gh._id));
  }, [availableRooms, guestHouses, fixedGuestHouse, formData.guestHouseId]);

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

  // Occupancy always tracks whichever room ends up selected. For the normal customer flow
  // this is a no-op (CustomerRoomSelection already filters rooms to match the chosen
  // occupancy before a roomId is ever set). It matters for the admin flow (occupancy isn't
  // chosen independently there) and for direct booking links (?guestHouseId=&roomId=..,
  // e.g. from the Availability page's "Book" button) which set roomId without ever going
  // through the occupancy-picker step — without this, occupancyType stayed stuck at its
  // "SINGLE" default and the booking would fail (or previously crash — see Notification fix).
  useEffect(() => {
    if (selectedRoom?.type && selectedRoom.type !== formData.occupancyType) {
      setFormData((prev) => ({ ...prev, occupancyType: selectedRoom.type }));
    }
  }, [selectedRoom, formData.occupancyType]);

  const getDisabledDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return [{ before: today }, { after: maxDate }];
  };

  // Event handlers
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
        attachmentBlobPath: formData.attachmentBlobPath,
        attachmentFileName: formData.attachmentFileName,
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

  const handleNewBooking = () => {
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
      attachmentBlobPath: null,
      attachmentFileName: null,
    });
  };

  const isDatesReady = !!(formData.checkIn && formData.checkOut);
  const isRoomReady = !!(formData.guestHouseId && formData.roomId);

  // Everything below is wrapped in a SINGLE <DashboardLayout> at the bottom instead of each
  // step component wrapping itself — previously every step transition (including "Change
  // Date" and back) unmounted and remounted the whole layout (Sidebar/Header included),
  // since React remounts on a component-type change at the return root.
  let content;

  if (submitted) {
    content = (
      <BookingSuccessScreen
        isCustomer={isCustomer}
        onNewBooking={handleNewBooking}
        onViewBookings={() => router.push(isCustomer ? "/my-bookings" : "/bookings")}
      />
    );
  } else if (isCustomer && showDateSelection) {
    content = (
      <CustomerDateSelection
        range={range}
        onSelect={handleDateSelection}
        checkInTime={formData.checkInTime}
        checkOutTime={formData.checkOutTime}
        onCheckInTimeChange={(value) => handleChange("checkInTime", value)}
        onCheckOutTimeChange={(value) => handleChange("checkOutTime", value)}
        onReset={resetDateSelection}
        onViewRooms={() => setShowDateSelection(false)}
        disabledDates={getDisabledDates()}
        isDatesReady={isDatesReady}
      />
    );
  } else if (isCustomer && !showDateSelection && isDatesReady && !formData.roomId) {
    content = (
      <CustomerRoomSelection
        availableGuestHouses={availableGuestHouses}
        availableRooms={availableRooms}
        loadingRooms={loadingRooms}
        checkIn={formData.checkIn}
        checkOut={formData.checkOut}
        onChangeDates={() => setShowDateSelection(true)}
        onRoomSelect={handleRoomSelectionFromCard}
        occupancyType={formData.occupancyType}
        onOccupancyChange={(value) => handleChange("occupancyType", value)}
        grades={grades}
      />
    );
  } else if (isCustomer) {
    content = (
      <>
        <CustomerBookingForm
          selectedGuestHouse={selectedGuestHouse}
          selectedRoom={selectedRoom}
          formData={formData}
          onChange={handleChange}
          onBack={() => {
            setFormData((prev) => ({ ...prev, guestHouseId: undefined, roomId: undefined }));
            setShowDateSelection(false);
          }}
          onSubmit={handleSubmit}
          submitting={submitting}
          checkIn={formData.checkIn}
          checkOut={formData.checkOut}
          checkInTime={formData.checkInTime}
          checkOutTime={formData.checkOutTime}
        />
        {notification && (
          <Notification
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </>
    );
  } else if (showDateSelection) {
    content = (
      <AdminDateSelection
        range={range}
        onSelect={handleDateSelection}
        checkInTime={formData.checkInTime}
        checkOutTime={formData.checkOutTime}
        onCheckInTimeChange={(value) => handleChange("checkInTime", value)}
        onCheckOutTimeChange={(value) => handleChange("checkOutTime", value)}
        onReset={resetDateSelection}
        onSearchRooms={() => setShowDateSelection(false)}
        disabledDates={getDisabledDates()}
        isDatesReady={isDatesReady}
        checkIn={formData.checkIn}
        checkOut={formData.checkOut}
      />
    );
  } else if (!showDateSelection && isDatesReady && !formData.roomId) {
    content = (
      <AdminRoomSelection
        availableGuestHouses={availableGuestHouses}
        availableRooms={availableRooms}
        loadingRooms={loadingRooms}
        checkIn={formData.checkIn}
        checkOut={formData.checkOut}
        onChangeDates={changeDatesAdmin}
        onRoomSelect={handleRoomSelectionFromCard}
      />
    );
  } else {
    content = (
      <>
        <AdminBookingForm
          step={step}
          setStep={setStep}
          selectedGuestHouse={selectedGuestHouse}
          selectedRoom={selectedRoom}
          formData={formData}
          onChange={handleChange}
          onBack={() => {
            setFormData((prev) => ({ ...prev, guestHouseId: undefined, roomId: undefined }));
            setStep(1);
          }}
          onSubmit={handleSubmit}
          submitting={submitting}
          checkIn={formData.checkIn}
          checkOut={formData.checkOut}
          checkInTime={formData.checkInTime}
          checkOutTime={formData.checkOutTime}
          setShowDateSelection={setShowDateSelection}
        />
        {notification && (
          <Notification
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </>
    );
  }

  return <DashboardLayout>{content}</DashboardLayout>;
}