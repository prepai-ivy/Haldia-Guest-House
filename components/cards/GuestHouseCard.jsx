"use client";

import { Building2, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function GuestHouseCard({ guestHouse }) {

  const { isAdmin, isSuperAdmin, isCustomer } = useAuth();
  const router = useRouter();

  const {
    _id,
    name,
    available = 0,
    utilization = 0,
    totalRooms = 0,
  } = guestHouse;

  const getUtilizationColor = (util) => {
    if (util >= 90) return 'bg-destructive';
    if (util >= 70) return 'bg-warning';
    return 'bg-primary';
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-card hover:shadow-elevated transition-shadow animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-secondary rounded-lg">
          <Building2 size={24} className="text-primary" />
        </div>

        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Live Vacancy
          </p>
          <p className="text-2xl font-bold text-foreground">
            {available} Rooms
          </p>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-4">
        {name}
      </h3>

      <div className="space-y-3">
        {/* Utilization */}
        {!isCustomer && <div>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">UTILIZATION</span>
            <span
              className={
                utilization >= 90
                  ? 'text-destructive font-medium'
                  : 'text-primary font-medium'
              }
            >
              {utilization}%
            </span>
          </div>

          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getUtilizationColor(
                utilization
              )}`}
              style={{ width: `${utilization}%` }}
            />
          </div>
        </div>}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase">
              Total Rooms
            </p>
            <p className="text-sm font-medium text-primary">
              {totalRooms} Rooms
            </p>
          </div>

          {(isAdmin || isSuperAdmin) && <button
            onClick={() => router.push(`/room-inventory?gh=${_id}`)}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Explore Floor <ArrowUpRight size={14} />
          </button>}

          {isCustomer && <button
            onClick={() => router.push(`/new-request?guestHouseId=${_id}`)}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Book Room <ArrowUpRight size={14} />
          </button>}
        </div>
      </div>
    </div>
  );
}
