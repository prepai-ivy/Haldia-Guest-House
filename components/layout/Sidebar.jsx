"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarCheck,
  ClipboardList,
  LogOut,
  Shield
} from 'lucide-react';

const navItems = {
  SUPER_ADMIN: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/guest-houses', label: 'Guest Houses', icon: Building2 },
    { path: '/room-inventory', label: 'Room Inventory', icon: ClipboardList },
    { path: '/bookings', label: 'All Bookings', icon: CalendarCheck },
    { path: '/users', label: 'User Management', icon: Users },
  ],
  ADMIN: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/room-inventory', label: 'Room Inventory', icon: ClipboardList },
    { path: '/bookings', label: 'Bookings', icon: CalendarCheck },
    { path: '/check-in-out', label: 'Check In/Out', icon: Shield },
  ],
  CUSTOMER: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/availability', label: 'Room Availability', icon: Building2 },
    { path: '/my-bookings', label: 'My Bookings', icon: CalendarCheck },
    { path: '/new-request', label: 'New Request', icon: ClipboardList },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const items = navItems[user?.role] || navItems.CUSTOMER;

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-sidebar flex flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">Lalbaba</h1>
        <p className="text-xs text-sidebar-primary mt-0.5">ENGINEERING GROUP</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="bg-sidebar-accent rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-semibold text-sm">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-muted capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-border rounded-md transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
