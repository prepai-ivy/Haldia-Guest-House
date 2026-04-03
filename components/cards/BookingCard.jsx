"use client";

import { User, Calendar, MapPin, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { fetchAvailability } from "@/services/availabilityApi";

const PAYMENT_MODE_LABELS = {
  SELF_PAY: "Self Pay",
  SALARY_DEDUCTION: "Salary Deduction",
  COMPANY_SPONSORED: "Company Sponsored",
};

const statusConfig = {
  PENDING: { label: "Pending Approval", variant: "warning" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  BOOKED: { label: "Booked", variant: "info" },
  CHECKED_IN: { label: "Checked In", variant: "success" },
  CHECKED_OUT: { label: "Checked Out", variant: "secondary" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

function formatDateTime(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

// Convert UTC ISO string to YYYY-MM-DDTHH:mm in IST for datetime-local input
function toDateTimeLocalIST(dateString) {
  if (!dateString) return "";
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const d = new Date(dateString);
  const istMs = d.getTime() + IST_OFFSET;
  const ist = new Date(istMs);
  const pad = (n) => String(n).padStart(2, "0");
  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}T${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`;
}

// Parse YYYY-MM-DDTHH:mm (treated as IST) to UTC ISO string
function istLocalToISO(localStr) {
  if (!localStr) return "";
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const utcMs = new Date(localStr + ":00Z").getTime() - IST_OFFSET;
  return new Date(utcMs).toISOString();
}

export default function BookingCard({
  booking,
  rooms = [],
  guestHouses = [],
  onAction,
  onEdit,
  showActions = true,
}) {
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [blockedSlots, setBlockedSlots] = useState([]);

  const room = rooms.find((r) => r._id === booking.roomId?._id);
  const guestHouse = guestHouses.find((gh) => gh._id === booking.guestHouseId?._id);

  const status = statusConfig[booking.status] || statusConfig.BOOKED;

  // Rooms available for the booking's current guest house (for edit form)
  const bookingGhId = booking.guestHouseId?._id?.toString() || booking.guestHouseId?.toString();
  const ghRooms = rooms.filter(
    (r) => r.guestHouseId?.toString() === bookingGhId
  );

  async function handleAction(type) {
    if (!onAction) return;
    try {
      setActionLoading(true);
      setActionError(null);
      await onAction(booking._id, type);
    } catch (err) {
      setActionError(err?.message || "Action failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  function startEdit() {
    const roomId = booking.roomId?._id || booking.roomId;
    setEditData({
      guestName: booking.userId?.name || "",
      department: booking.department || "",
      purpose: booking.purpose || "",
      paymentMode: booking.paymentMode || "COMPANY_SPONSORED",
      roomId: roomId || "",
      checkInDate: toDateTimeLocalIST(booking.checkInDate),
      checkOutDate: toDateTimeLocalIST(booking.checkOutDate),
    });
    setEditing(true);
    setActionError(null);
    setBlockedSlots([]);

    // Fetch other bookings' blocked slots for this room (excluding current booking)
    if (roomId) {
      const now = new Date();
      const future = new Date();
      future.setMonth(future.getMonth() + 6);
      fetchAvailability({
        roomId,
        from: now.toISOString(),
        to: future.toISOString(),
        excludeId: booking._id,
      })
        .then((data) => setBlockedSlots(data?.blockedSlots || []))
        .catch(() => {});
    }
  }

  // Check if the edited dates conflict with any blocked slot
  const dateConflict = useMemo(() => {
    if (!editData.checkInDate || !editData.checkOutDate || blockedSlots.length === 0)
      return null;
    const checkIn = new Date(istLocalToISO(editData.checkInDate));
    const checkOut = new Date(istLocalToISO(editData.checkOutDate));
    if (isNaN(checkIn) || isNaN(checkOut) || checkIn >= checkOut) return null;
    for (const slot of blockedSlots) {
      if (checkIn < new Date(slot.to) && checkOut > new Date(slot.from)) {
        const slotFrom = new Date(slot.from).toLocaleString("en-IN", {
          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
          hour12: true, timeZone: "Asia/Kolkata",
        });
        const slotTo = new Date(slot.to).toLocaleString("en-IN", {
          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
          hour12: true, timeZone: "Asia/Kolkata",
        });
        return `Conflicts with existing booking: ${slotFrom} – ${slotTo}`;
      }
    }
    return null;
  }, [editData.checkInDate, editData.checkOutDate, blockedSlots]);

  async function handleEdit() {
    if (!onEdit) return;
    try {
      setActionLoading(true);
      setActionError(null);
      await onEdit(booking._id, {
        guestName: editData.guestName,
        department: editData.department,
        purpose: editData.purpose,
        paymentMode: editData.paymentMode,
        roomId: editData.roomId,
        checkInDate: istLocalToISO(editData.checkInDate),
        checkOutDate: istLocalToISO(editData.checkOutDate),
      });
      setEditing(false);
    } catch (err) {
      setActionError(err?.message || "Edit failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  const canEdit =
    showActions &&
    onEdit &&
    ["PENDING", "BOOKED"].includes(booking.status);

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-card animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 shrink-0 rounded-full bg-secondary flex items-center justify-center">
            <User size={20} className="text-muted-foreground" />
          </div>
          <h4 className="font-semibold text-foreground truncate">
            {booking.userId?.guestName || booking.userId?.name}
          </h4>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canEdit && !editing && (
            <button
              onClick={startEdit}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Edit booking"
            >
              <Pencil size={14} />
            </button>
          )}
          <Badge
            className={`shrink-0
              ${status.variant === "warning" && "bg-warning/15 text-warning border-warning/30"}
              ${status.variant === "success" && "bg-success/15 text-success border-success/30"}
              ${status.variant === "info" && "bg-info/15 text-info border-info/30"}
              ${status.variant === "secondary" && "bg-secondary text-muted-foreground"}
              ${status.variant === "destructive" && "bg-destructive/15 text-destructive border-destructive/30"}
            `}
            noBgChange
          >
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Edit Form */}
      {editing ? (
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Guest Name</Label>
              <Input
                value={editData.guestName}
                onChange={(e) => setEditData((p) => ({ ...p, guestName: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Department</Label>
              <Input
                value={editData.department}
                onChange={(e) => setEditData((p) => ({ ...p, department: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {ghRooms.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">Room</Label>
              <Select
                value={editData.roomId}
                onValueChange={(v) => setEditData((p) => ({ ...p, roomId: v }))}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {ghRooms.map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      Room {r.roomNumber} – {r.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Check-in</Label>
              <Input
                type="datetime-local"
                value={editData.checkInDate}
                onChange={(e) => setEditData((p) => ({ ...p, checkInDate: e.target.value }))}
                className={`h-8 text-sm ${dateConflict ? "border-destructive" : ""}`}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Check-out</Label>
              <Input
                type="datetime-local"
                value={editData.checkOutDate}
                onChange={(e) => setEditData((p) => ({ ...p, checkOutDate: e.target.value }))}
                className={`h-8 text-sm ${dateConflict ? "border-destructive" : ""}`}
              />
            </div>
          </div>

          {dateConflict && (
            <p className="text-xs text-destructive font-medium">
              ⚠ {dateConflict}
            </p>
          )}

          <div className="space-y-1">
            <Label className="text-xs">Payment Mode</Label>
            <Select
              value={editData.paymentMode}
              onValueChange={(v) => setEditData((p) => ({ ...p, paymentMode: v }))}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPANY_SPONSORED">Company Sponsored</SelectItem>
                <SelectItem value="SALARY_DEDUCTION">Salary Deduction</SelectItem>
                <SelectItem value="SELF_PAY">Self Pay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Purpose</Label>
            <Textarea
              value={editData.purpose}
              onChange={(e) => setEditData((p) => ({ ...p, purpose: e.target.value }))}
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              disabled={actionLoading || !!dateConflict}
              onClick={handleEdit}
              className="flex-1"
            >
              {actionLoading ? <Loader2 size={14} className="animate-spin" /> : "Save"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={actionLoading}
              onClick={() => { setEditing(false); setActionError(null); }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Meta */}
          <div className="flex items-center gap-2 mt-0.5">
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 bg-foreground text-background"
            >
              Room #{room?.roomNumber || booking?.roomId?.roomNumber || "—"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {guestHouse?.name || booking?.guestHouseId?.name || "—"}
            </span>
          </div>

          {/* Dates */}
          <div className="text-sm mb-4 space-y-1 mt-3">
            <div className="flex items-start gap-2 text-muted-foreground">
              <Calendar size={14} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="truncate">In: {formatDateTime(booking.checkInDate)}</p>
                <p className="truncate">Out: {formatDateTime(booking.checkOutDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin size={14} className="shrink-0" />
              <span className="truncate">{booking.department}</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-1">
            <span className="font-medium">Purpose:</span> {booking.purpose}
          </p>
          {booking.paymentMode && (
            <p className="text-sm text-muted-foreground mb-4">
              <span className="font-medium">Payment:</span>{" "}
              {PAYMENT_MODE_LABELS[booking.paymentMode] || booking.paymentMode}
            </p>
          )}
        </>
      )}

      {/* ACTIONS */}
      {!editing && showActions && booking.status === "PENDING" && (
        <div className="flex gap-2 pt-3 border-t border-border">
          <Button
            size="sm"
            disabled={actionLoading}
            onClick={() => handleAction("APPROVE")}
            className="flex-1 bg-primary"
          >
            Approve
          </Button>
          <Button
            size="sm"
            disabled={actionLoading}
            variant="outline"
            onClick={() => handleAction("REJECT")}
            className="flex-1 border-destructive text-destructive hover:bg-destructive"
          >
            Reject
          </Button>
        </div>
      )}

      {!editing && showActions && booking.status === "BOOKED" && (
        <div className="flex gap-2 pt-3 border-t border-border">
          <Button
            size="sm"
            disabled={actionLoading}
            onClick={() => handleAction("CHECK_IN")}
            className="flex-1 bg-success"
          >
            Check In
          </Button>
          <Button
            size="sm"
            disabled={actionLoading}
            variant="outline"
            onClick={() => handleAction("CANCEL")}
            className="flex-1 border-destructive text-destructive hover:bg-destructive"
          >
            Cancel
          </Button>
        </div>
      )}

      {!editing && showActions && booking.status === "CHECKED_IN" && (
        <div className="pt-3 border-t border-border">
          <Button
            size="sm"
            disabled={actionLoading}
            variant="outline"
            onClick={() => handleAction("CHECK_OUT")}
            className="w-full"
          >
            Check Out
          </Button>
        </div>
      )}

      {/* ERROR */}
      {actionError && (
        <div className="mt-3 text-sm text-destructive">
          ⚠ {actionError}
        </div>
      )}
    </div>
  );
}
