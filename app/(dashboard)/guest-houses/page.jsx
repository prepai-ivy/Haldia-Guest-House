"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, MapPin, Layers, Edit, Trash2 } from "lucide-react";

import { fetchGuestHouseStats } from "@/services/guestHouseStatsApi";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { deleteGuestHouse } from "@/services/guestHouseApi";

export default function GuestHouses() {
  const { isSuperAdmin } = useAuth();
  const router = useRouter();

  const [guestHouses, setGuestHouses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadGuestHouses() {
      try {
        const data = await fetchGuestHouseStats();
        setGuestHouses(data);
      } catch (err) {
        console.error("Failed to load guest houses", err);
      } finally {
        setLoading(false);
      }
    }

    loadGuestHouses();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[300px] flex items-center justify-center text-muted-foreground">
          Loading guest houses...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Guest Houses</h1>
          <p className="text-muted-foreground">
            Manage all guest house properties
          </p>
        </div>

        {isSuperAdmin && (
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => router.push("/guest-houses/new")}
          >
            <Plus size={18} className="mr-2" />
            Add Guest House
          </Button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {guestHouses.map((gh) => (
          <div
            key={gh._id}
            className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-elevated transition-shadow"
          >
            {/* Header */}
            <div className="gradient-header p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">{gh.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-white/70 text-sm">
                    <MapPin size={14} />
                    {gh.location}
                  </div>
                </div>

                <Badge className="bg-white/20 text-white border-0">
                  {gh.category}
                </Badge>
              </div>
            </div>

            {/* Body */}
            <div className="p-5">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="text-center p-3 bg-secondary rounded-lg">
                  <p className="text-2xl font-bold text-foreground">
                    {gh.totalRooms}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Rooms</p>
                </div>

                <div className="text-center p-3 bg-success/10 rounded-lg">
                  <p className="text-2xl font-bold text-success">
                    {gh.available}
                  </p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>

                <div className="text-center p-3 bg-destructive/10 rounded-lg">
                  <p className="text-2xl font-bold text-destructive">
                    {gh.occupied}
                  </p>
                  <p className="text-xs text-muted-foreground">Occupied</p>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-5">
                <div className="flex items-center gap-1">
                  <Building2 size={14} />
                  {gh.totalRooms} rooms
                </div>
                <div className="flex items-center gap-1">
                  <Layers size={14} />
                  {gh.capacity} beds capacity
                </div>
              </div>

              {/* Utilization */}
              <div className="mb-5">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Utilization</span>
                  <span className="font-medium text-primary">
                    {gh.utilization}%
                  </span>
                </div>

                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${gh.utilization}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              {isSuperAdmin && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => router.push(`/guest-houses/${gh._id}/edit`)}
                  >
                    <Edit size={16} />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget(gh)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete Guest House"
          description={`This will permanently delete "${deleteTarget?.name}" and all its rooms. This action cannot be undone.`}
          confirmText="Delete Guest House"
          loading={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            try {
              setDeleting(true);
              await deleteGuestHouse(deleteTarget._id);

              setGuestHouses((prev) =>
                prev.filter((g) => g._id !== deleteTarget._id)
              );

              setDeleteTarget(null);
            } finally {
              setDeleting(false);
            }
          }}
        />
      </div>
    </DashboardLayout>
  );
}
