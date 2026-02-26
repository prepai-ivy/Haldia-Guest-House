"use client";

import { Menu, Plus } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const pageTitles = {
  '/dashboard': { title: 'REAL-TIME OPERATIONS', subtitle: 'DASHBOARD' },
  '/guest-houses': { title: 'MANAGEMENT', subtitle: 'GUEST HOUSES' },
  '/room-inventory': { title: 'REAL-TIME OPERATIONS', subtitle: 'ROOM INVENTORY' },
  '/bookings': { title: 'MANAGEMENT', subtitle: 'ALL BOOKINGS' },
  '/users': { title: 'ADMINISTRATION', subtitle: 'USER MANAGEMENT' },
  '/check-in-out': { title: 'REAL-TIME OPERATIONS', subtitle: 'CHECK IN/OUT' },
  '/availability': { title: 'ROOM STATUS', subtitle: 'AVAILABILITY' },
  '/my-bookings': { title: 'MY REQUESTS', subtitle: 'BOOKINGS' },
  '/new-request': { title: 'NEW REQUEST', subtitle: 'BOOK A ROOM' },
  '/settings': { title: 'SYSTEM', subtitle: 'SETTINGS' },
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useAuth();

  const pageInfo = pageTitles[pathname] || { title: '', subtitle: '' };

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-secondary rounded-md transition-colors">
          <Menu size={20} className="text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{pageInfo.title}</span>
          <span className="text-muted-foreground">›</span>
          <span className="text-primary font-medium">{pageInfo.subtitle}</span>
        </div>
      </div>

      {isAdmin && (
        <Button
          onClick={() => router.push('/bookings/new')}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus size={18} className="mr-1" />
          Allocate Room
        </Button>
      )}
    </header>
  );
}
