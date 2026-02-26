"use client";

import { User, Calendar, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

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
  });
}

export default function BookingCard({
  booking,
  rooms = [],
  guestHouses = [],
  onAction,
  showActions = true,
}) {

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const room = rooms.find((r) => r._id === booking.roomId?._id);
  const guestHouse = guestHouses.find(
    (gh) => gh._id === booking.guestHouseId?._id
  );

  const status = statusConfig[booking.status] || statusConfig.BOOKED;

  async function handleAction(type) {
    if (!onAction) return;

    try {
      setActionLoading(true);
      setActionError(null);
      await onAction(booking._id, type);
    } catch (err) {
      setActionError(
        err?.message || "Action failed. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-card animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center">
            <User size={20} className="text-muted-foreground" />
          </div>
          <h4 className="font-semibold text-foreground">
            {booking.userId.guestName || booking.userId.name}
          </h4>
        </div>

        <Badge
          className={`
            ${status.variant === "warning" && "bg-warning/15 text-warning border-warning/30"}
            ${status.variant === "success" && "bg-success/15 text-success border-success/30"}
            ${status.variant === "info" && "bg-info/15 text-info border-info/30"}
            ${status.variant === "secondary" && "bg-secondary text-muted-foreground"}
            ${status.variant === "destructive" && "bg-destructive/15 text-destructive border-destructive/30"}
          `}
        >
          {status.label}
        </Badge>
      </div>

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
      <div className="text-sm mb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar size={14} />
          <span>
            {formatDateTime(booking.checkInDate)} →{" "}
            {formatDateTime(booking.checkOutDate)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin size={14} />
          <span>{booking.department}</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        <span className="font-medium">Purpose:</span> {booking.purpose}
      </p>

      {/* ACTIONS */}
      {showActions && booking.status === "PENDING" && (
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

{showActions && booking.status === "BOOKED" && (
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



      {showActions && booking.status === "APPROVED" && (
        <div className="pt-3 border-t border-border">
          <Button
            size="sm"
            disabled={actionLoading}
            onClick={() => handleAction("check_in")}
            className="w-full bg-success"
          >
            {actionLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              "Check In Guest"
            )}
          </Button>
        </div>
      )}

      {showActions && booking.status === "CHECKED_IN" && (
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
