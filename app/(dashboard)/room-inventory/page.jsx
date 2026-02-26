"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Building2,
  Bed,
  Wifi,
  Tv,
  Wind,
  Bath,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

import { fetchGuestHouses } from "@/services/guestHouseApi";
import { fetchRoomStats } from "@/services/roomStatsApi";
import { deleteRoom } from "@/services/roomApi";

const amenityIcons = {
  WiFi: Wifi,
  TV: Tv,
  AC: Wind,
  "Attached Bath": Bath,
};

const statusColors = {
  AVAILABLE: "bg-success/15 text-success border-success/30",
  OCCUPIED: "bg-destructive/15 text-destructive border-destructive/30",
  MAINTENANCE: "bg-warning/15 text-warning border-warning/30",
};

export default function RoomInventory() {
  const router = useRouter();

  const [guestHouses, setGuestHouses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [summary, setSummary] = useState(null);

  const [selectedGH, setSelectedGH] = useState(null);
  const [loading, setLoading] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteRoom() {
    if (!roomToDelete) return;

    try {
      setDeleting(true);
      await deleteRoom(roomToDelete._id);
      setRooms((prev) => prev.filter((r) => r._id !== roomToDelete._id));
      setConfirmOpen(false);
      setRoomToDelete(null);
    } catch (err) {
      console.error("Failed to delete room", err);
      alert("Failed to delete room");
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        const gh = await fetchGuestHouses();
        setGuestHouses(gh);

        const defaultGH = gh[0]?._id;
        setSelectedGH(defaultGH);

        if (defaultGH) {
          const stats = await fetchRoomStats(defaultGH);
          setRooms(stats.rooms);
          setSummary(stats.summary);
        }
      } catch (err) {
        console.error("Room inventory load failed", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!selectedGH) return;

    async function loadStats() {
      try {
        const stats = await fetchRoomStats(selectedGH);
        setRooms(stats.rooms);
        setSummary(stats.summary);
      } catch (err) {
        console.error("Failed to load room stats", err);
      }
    }

    loadStats();
  }, [selectedGH]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[300px] flex items-center justify-center text-muted-foreground">
          Loading room inventory...
        </div>
      </DashboardLayout>
    );
  }

  const currentGH = guestHouses.find((g) => g._id === selectedGH);
  const utilization = summary?.utilizationToday ?? 0;
  const filteredRooms = rooms;
  const floors = [...new Set(rooms.map((r) => r.floor))].sort();

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Room Inventory</h1>
          <p className="text-muted-foreground">
            Manage rooms for each guest house
          </p>
        </div>

        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={() => router.push("/room-inventory/new")}
        >
          <Plus size={18} className="mr-2" />
          Add Room
        </Button>
      </div>

      {/* Guest House Selector */}
      <div className="flex flex-wrap gap-3 mb-6">
        {guestHouses.map((gh) => {
          const isSelected = selectedGH === gh._id;
          const availableToday = isSelected
            ? (summary?.availableToday ?? 0)
            : "-";

          return (
            <button
              key={gh._id}
              onClick={() => setSelectedGH(gh._id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                selectedGH === gh._id
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-card border-border hover:border-primary/50"
              }`}
            >
              <Building2 size={20} />
              <div className="text-left">
                <p className="font-medium text-sm">{gh.name}</p>
                <p className="text-xs opacity-80">{availableToday} available</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Total Rooms" value={summary?.totalRooms || 0} />
        <Stat
          label="Available"
          value={summary?.availableToday || 0}
          color="success"
        />
        <Stat
          label="Occupied"
          value={summary?.occupiedToday || 0}
          color="destructive"
        />
        <Stat
          label="Maintenance"
          value={summary?.underMaintenanceToday || 0}
          color="warning"
        />
      </div>

      {/* Utilization */}
      <div className="bg-card rounded-xl border border-border p-5 mb-6">
        <div className="flex justify-between mb-2">
          <h3 className="font-semibold">{currentGH?.name} – Utilization</h3>
          <span className="font-bold text-primary">{utilization}%</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${utilization}%` }}
          />
        </div>
      </div>

      {/* Rooms by Floor */}
      {floors.map((floor) => (
        <div key={floor} className="mb-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">
            Floor {floor}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRooms
              .filter((r) => r.floor === floor)
              .map((room) => (
                <div
                  key={room._id}
                  className="bg-card border border-border rounded-xl p-5"
                >
                  <div className="flex justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">Room {room.roomNumber}</h4>
                      <p className="text-sm text-muted-foreground">
                        {room.type}
                      </p>
                    </div>
                    <Badge className={statusColors[room.todayStatus]}>
                      {room.todayStatus.charAt(0) + room.todayStatus.slice(1).toLowerCase()}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm mb-3">
                    <Bed size={16} />
                    Capacity: {room.capacity}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {room.amenities.map((a) => {
                      const Icon = amenityIcons[a] || Wind;
                      return (
                        <span
                          key={a}
                          className="flex items-center gap-1 px-2 py-1 bg-secondary rounded text-xs"
                        >
                          <Icon size={12} /> {a}
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        router.push(
                          `/bookings/new?guestHouseId=${selectedGH}&roomId=${room._id}`
                        )
                      }
                    >
                      Allocate
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/room-inventory/edit/${room._id}`)
                      }
                    >
                      <Edit size={14} />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/100"
                      onClick={() => {
                        setRoomToDelete(room);
                        setConfirmOpen(true);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Room"
        description={
          roomToDelete
            ? `Are you sure you want to delete Room ${roomToDelete.roomNumber}? This action cannot be undone.`
            : ""
        }
        confirmText="Delete Room"
        loading={deleting}
        onCancel={() => {
          setConfirmOpen(false);
          setRoomToDelete(null);
        }}
        onConfirm={handleDeleteRoom}
      />
    </DashboardLayout>
  );
}

function Stat({ label, value, color }) {
  const colorMap = {
    success: "text-success bg-success/10 border-success/20",
    destructive: "text-destructive bg-destructive/10 border-destructive/20",
    warning: "text-warning bg-warning/10 border-warning/20",
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] || "bg-card"}`}>
      <p className="text-xs uppercase opacity-70">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
