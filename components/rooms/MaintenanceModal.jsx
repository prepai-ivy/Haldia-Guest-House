"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchRoomMaintenance,
  scheduleRoomMaintenance,
  cancelRoomMaintenance,
  fetchRoomsByGuestHouse,
} from "@/services/roomApi";
import { editBooking, updateBookingStatus } from "@/services/bookingApi";

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function MaintenanceModal({ room, guestHouseId, onClose, onChanged }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [conflicts, setConflicts] = useState(null); // null = not yet submitted / resolved
  const [otherRooms, setOtherRooms] = useState([]);
  const [reassignChoice, setReassignChoice] = useState({}); // bookingId -> roomId
  const [resolving, setResolving] = useState({}); // bookingId -> boolean

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    fetchRoomMaintenance(room._id)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));

    fetchRoomsByGuestHouse(guestHouseId)
      .then((rooms) => setOtherRooms(rooms.filter((r) => r._id !== room._id)))
      .catch(() => setOtherRooms([]));
  }, [room._id, guestHouseId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!startDate || !endDate) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await scheduleRoomMaintenance(room._id, { startDate, endDate, reason });
      if (result.created) {
        onChanged();
        onClose();
      } else {
        setConflicts(result.conflicts);
      }
    } catch (err) {
      setError(err.message || "Failed to schedule maintenance");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelBooking(bookingId, status) {
    // PENDING requests are REJECTed (CANCEL only applies to already-BOOKED reservations).
    const action = status === "PENDING" ? "REJECT" : "CANCEL";
    setResolving((p) => ({ ...p, [bookingId]: true }));
    try {
      await updateBookingStatus(bookingId, action, { reason: "MAINTENANCE", maintenanceReason: reason });
      setConflicts((prev) => prev.filter((c) => c._id !== bookingId));
    } catch (err) {
      setError(err.message || "Failed to cancel booking");
    } finally {
      setResolving((p) => ({ ...p, [bookingId]: false }));
    }
  }

  async function handleReassign(bookingId) {
    const newRoomId = reassignChoice[bookingId];
    if (!newRoomId) return;
    setResolving((p) => ({ ...p, [bookingId]: true }));
    try {
      await editBooking(bookingId, { roomId: newRoomId, reason: "MAINTENANCE", maintenanceReason: reason });
      setConflicts((prev) => prev.filter((c) => c._id !== bookingId));
    } catch (err) {
      setError(err.message || "Failed to reassign booking");
    } finally {
      setResolving((p) => ({ ...p, [bookingId]: false }));
    }
  }

  async function handleRetry() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await scheduleRoomMaintenance(room._id, { startDate, endDate, reason });
      if (result.created) {
        onChanged();
        onClose();
      } else {
        setConflicts(result.conflicts);
      }
    } catch (err) {
      setError(err.message || "Failed to schedule maintenance");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelWindow(maintenanceId) {
    try {
      await cancelRoomMaintenance(room._id, maintenanceId);
      setHistory((prev) => prev.map((m) => (m._id === maintenanceId ? { ...m, status: "CANCELLED" } : m)));
      onChanged();
    } catch (err) {
      setError(err.message || "Failed to cancel maintenance window");
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-xl border p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Maintenance — Room {room.roomNumber}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>
        )}

        {conflicts === null ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Reason</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. AC repair" />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : "Schedule Maintenance"}
            </Button>

            {!historyLoading && history.filter((m) => m.status === "ACTIVE").length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">Scheduled windows</p>
                <div className="space-y-2">
                  {history.filter((m) => m.status === "ACTIVE").map((m) => (
                    <div key={m._id} className="flex items-center justify-between text-xs p-2 rounded bg-secondary/50">
                      <span>{formatDate(m.startDate)} – {formatDate(m.endDate)}{m.reason ? ` · ${m.reason}` : ""}</span>
                      <button
                        type="button"
                        onClick={() => handleCancelWindow(m._id)}
                        className="text-destructive hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        ) : conflicts.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-success">All conflicts resolved — you can now schedule this window.</p>
            <Button onClick={handleRetry} className="w-full" disabled={submitting}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : "Schedule Maintenance"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-warning">
              {conflicts.length} booking(s) overlap these dates. Reassign or cancel each before scheduling maintenance.
            </p>
            <div className="space-y-3">
              {conflicts.map((c) => (
                <div key={c._id} className="border rounded-lg p-3 space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">{c.userId?.name || "Guest"}</span>
                    <span className="text-muted-foreground"> · {formatDate(c.checkInDate)} – {formatDate(c.checkOutDate)} · {c.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={reassignChoice[c._id] || ""}
                      onValueChange={(v) => setReassignChoice((p) => ({ ...p, [c._id]: v }))}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder="Reassign to room…" />
                      </SelectTrigger>
                      <SelectContent>
                        {otherRooms.map((r) => (
                          <SelectItem key={r._id} value={r._id}>
                            Room {r.roomNumber} ({r.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!reassignChoice[c._id] || resolving[c._id]}
                      onClick={() => handleReassign(c._id)}
                    >
                      Reassign
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive"
                      disabled={resolving[c._id]}
                      onClick={() => handleCancelBooking(c._id, c.status)}
                    >
                      {c.status === "PENDING" ? "Reject" : "Cancel"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
