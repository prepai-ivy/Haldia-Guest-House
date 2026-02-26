"use client";

import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-56">
        <Header />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
