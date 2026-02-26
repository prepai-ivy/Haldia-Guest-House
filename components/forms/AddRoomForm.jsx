"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";

import { fetchGuestHouses } from "@/api/guestHouseApi";
import { createRoom, updateRoom, fetchRoomById } from "@/api/roomApi";
import Notification from "@/components/ui/Notification";

export default function AddRoomForm() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const isEdit = Boolean(id);

  const [guestHouses, setGuestHouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [duplicateError, setDuplicateError] = useState("");
  const [notification, setNotification] = useState(null);

  const [form, setForm] = useState({
    guestHouseId: "",
    roomNumber: "",
    type: "SINGLE",
    capacity: 1,
    floor: 1,
    status: "AVAILABLE",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const gh = await fetchGuestHouses();
        setGuestHouses(gh);

        if (isEdit) {
          const room = await fetchRoomById(id);

          setForm({
            guestHouseId: room.guestHouseId,
            roomNumber: room.roomNumber,
            type: room.type,
            capacity: room.capacity,
            floor: room.floor,
            status: room.status,
          });
        }
      } finally {
        setInitialLoading(false);
      }
    }

    loadData();
  }, [id, isEdit]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDuplicateError("");
    setNotification(null);

    try {
      if (isEdit) {
        await updateRoom(id, form);

        setNotification({
          type: "success",
          title: "Room Updated",
          message: "Room details updated successfully.",
        });
      } else {
        await createRoom(form);

        setNotification({
          type: "success",
          title: "Room Created",
          message: "Room created successfully.",
        });
      }

      setTimeout(() => {
        router.push("/room-inventory");
      }, 1200);
    } catch (err) {
      console.log(err);

      if (err.status === 409) {
        setDuplicateError(err.message || "Room number already exists");

        setNotification({
          type: "error",
          title: "Duplicate Room",
          message: err.message || "Room number already exists.",
        });
      } else {
        setNotification({
          type: "error",
          title: "Operation Failed",
          message: err.message || "Failed to save room.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[300px] flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6 text-sm"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="text-2xl font-bold mb-6">
          {isEdit ? "Edit Room" : "Add Room"}
        </h1>

        <form
          onSubmit={submit}
          className="space-y-5 bg-card p-6 rounded-xl border"
        >
          {/* Guest House */}
          <div className="space-y-2">
            <Label>Guest House *</Label>
            <Select
              value={form.guestHouseId}
              onValueChange={(v) => setForm({ ...form, guestHouseId: v })}
              disabled={isEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select guest house" />
              </SelectTrigger>
              <SelectContent>
                {guestHouses.map((gh) => (
                  <SelectItem key={gh._id} value={gh._id}>
                    {gh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room Number */}
          <div className="space-y-2">
            <Label>Room Number *</Label>
            <Input
              placeholder="101"
              value={form.roomNumber}
              onChange={(e) =>
                setForm({ ...form, roomNumber: e.target.value })
              }
              className={duplicateError ? "border-destructive" : ""}
              required
            />

            {duplicateError && (
              <p className="text-xs text-destructive">{duplicateError}</p>
            )}
          </div>

          {/* Room Type */}
          <div className="space-y-2">
            <Label>Room Type *</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v })}
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

          {/* Bed Capacity */}
          <div className="space-y-2">
            <Label>Bed Capacity *</Label>
            <Input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) =>
                setForm({
                  ...form,
                  capacity: Number(e.target.value),
                })
              }
            />
          </div>

          {/* Floor */}
          <div className="space-y-2">
            <Label>Floor *</Label>
            <Input
              type="number"
              min={1}
              value={form.floor}
              onChange={(e) =>
                setForm({ ...form, floor: Number(e.target.value) })
              }
            />
          </div>

          {/* Status (edit only) */}
          {isEdit && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="OCCUPIED">Occupied</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : isEdit ? (
              "Update Room"
            ) : (
              "Create Room"
            )}
          </Button>
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
