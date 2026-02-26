"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Building2,
  MapPin,
  Layers,
  AlertCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { createGuestHouse } from "@/api/guestHouseApi";
import { createRoom, fetchRoomsByGuestHouse } from "@/api/roomApi";
import { fetchGuestHouseById, updateGuestHouse } from "@/api/guestHouseApi";
import Notification from "@/components/ui/Notification";

function hasDuplicateRoomNumbers(rooms) {
  const numbers = rooms.map((r) => r.roomNumber?.trim()).filter(Boolean);
  return new Set(numbers).size !== numbers.length;
}

function isRoomNumberDuplicate(rooms, index) {
  const current = rooms[index]?.roomNumber?.trim();
  if (!current) return false;
  return rooms.some((r, i) => i !== index && r.roomNumber?.trim() === current);
}

export default function AddGuestHouseForm() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const isEdit = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const [rooms, setRooms] = useState([
    { roomNumber: "", type: "SINGLE", capacity: 1, floor: 1 },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    category: "STANDARD",
    totalRooms: "",
    capacity: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (hasDuplicateRoomNumbers(rooms)) {
      setNotification({
        type: "error",
        title: "Duplicate Room Numbers",
        message: "Two or more rooms have the same room number.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const totalRooms = rooms.length;
      const capacity = rooms.reduce((sum, r) => sum + r.capacity, 0);

      if (isEdit) {
        await updateGuestHouse(id, {
          name: formData.name,
          location: formData.location,
          category: formData.category,
          totalRooms,
          capacity,
        });
      } else {
        const gh = await createGuestHouse({
          name: formData.name,
          location: formData.location,
          category: formData.category,
          totalRooms,
          capacity,
        });

        for (const room of rooms) {
          await createRoom({
            guestHouseId: gh._id,
            roomNumber: room.roomNumber,
            type: room.type,
            capacity: room.capacity,
            floor: room.floor,
          });
        }
      }

      setNotification({
        type: "success",
        title: isEdit ? "Guest House Updated" : "Guest House Created",
        message: "Changes saved successfully.",
      });

      setTimeout(() => {
        router.push("/guest-houses");
      }, 1200);
    } catch (err) {
      setNotification({
        type: "error",
        title: "Operation Failed",
        message: err.message || "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addRoom = () => {
    setRooms([
      ...rooms,
      { roomNumber: "", type: "SINGLE", capacity: 1, floor: 1 },
    ]);
  };

  const updateRoom = (index, field, value) => {
    const updated = [...rooms];
    updated[index][field] = value;
    setRooms(updated);
  };

  const removeRoom = (index) => {
    setRooms(rooms.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!isEdit) return;

    async function loadData() {
      const gh = await fetchGuestHouseById(id);
      const roomData = await fetchRoomsByGuestHouse(id);

      setFormData({
        name: gh.name,
        location: gh.location,
        category: gh.category,
      });

      setRooms(
        roomData.map((r) => ({
          _id: r._id,
          roomNumber: r.roomNumber,
          type: r.type,
          capacity: r.capacity,
          floor: r.floor,
        }))
      );
    }

    loadData();
  }, [id, isEdit]);

  const hasDuplicates = hasDuplicateRoomNumbers(rooms);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/guest-houses")}
            className="p-2 rounded-full hover:bg-secondary"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold">
              {isEdit ? "Edit Guest House" : "Add New Guest House"}
            </h1>
            <p className="text-muted-foreground">
              Enter basic details to register a guest house
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-6">
            {/* Guest House Info */}
            <Card>
              <div className="p-6 border-b">
                <h2 className="font-semibold flex items-center gap-2">
                  <Building2 size={18} />
                  Guest House Information
                </h2>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Guest House Name *
                  </label>
                  <Input
                    placeholder="e.g. Haldia GH - Unit A"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      Guest House Category *
                    </label>
                    <select
                      className="h-11 w-full rounded-lg border px-3"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    >
                      <option value="STANDARD">Standard</option>
                      <option value="EXECUTIVE">Executive</option>
                      <option value="PREMIUM">Premium</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      Guest House Location *
                    </label>
                    <Input
                      placeholder="City / Area (e.g. Haldia)"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Inventory */}
            <Card>
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Layers size={18} />
                  Room Inventory
                </h2>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addRoom}
                >
                  + Add Room
                </Button>
              </div>

              <div className="p-6 space-y-4">
                {rooms.map((room, idx) => {
                  const isDuplicate = isRoomNumberDuplicate(rooms, idx);
                  return (
                    <div key={idx} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Room {idx + 1}</h4>

                        {rooms.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            className="text-destructive h-8"
                            onClick={() => removeRoom(idx)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">
                            Room Number *
                          </label>
                          <Input
                            placeholder="e.g. 101"
                            value={room.roomNumber}
                            onChange={(e) =>
                              updateRoom(idx, "roomNumber", e.target.value)
                            }
                            className={
                              isDuplicate
                                ? "border-destructive focus-visible:ring-destructive"
                                : ""
                            }
                            required
                          />
                          {isDuplicate && (
                            <p className="text-xs text-destructive mt-1">
                              Room number already exists
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">
                            Room Type *
                          </label>
                          <select
                            className="h-11 w-full rounded-lg border px-3"
                            value={room.type}
                            onChange={(e) =>
                              updateRoom(idx, "type", e.target.value)
                            }
                          >
                            <option value="SINGLE">Single</option>
                            <option value="DOUBLE">Double</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">
                            Bed Capacity *
                          </label>
                          <Input
                            type="number"
                            min={1}
                            placeholder="e.g. 2"
                            value={room.capacity}
                            onChange={(e) =>
                              updateRoom(idx, "capacity", Number(e.target.value))
                            }
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">
                            Floor Number *
                          </label>
                          <Input
                            type="number"
                            min={1}
                            placeholder="e.g. 1"
                            value={room.floor}
                            onChange={(e) =>
                              updateRoom(idx, "floor", Number(e.target.value))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-6">
            <Card className="bg-blue-50 border-dashed">
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <AlertCircle size={14} />
                  IMPORTANT
                </div>
                <p className="text-sm mt-2">
                  Total rooms are used to calculate availability and
                  utilization.
                </p>
              </div>
            </Card>

            <Button
              type="submit"
              className="w-full py-6"
              disabled={isSubmitting || hasDuplicates}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : isEdit ? (
                "Update Guest House"
              ) : (
                "Create Guest House"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full py-6"
              onClick={() => router.push("/guest-houses")}
            >
              Cancel
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
