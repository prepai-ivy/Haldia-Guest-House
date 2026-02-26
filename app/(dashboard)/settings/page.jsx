"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Building2, Bell, Lock, Database } from "lucide-react";

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage system configuration and preferences
          </p>
        </div>

        {/* Organization Settings */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 size={20} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Organization</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input defaultValue="Lalbaba Engineering Group" />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input defaultValue="admin@lalbaba.com" />
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell size={20} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  Email Notifications
                </p>
                <p className="text-sm text-muted-foreground">
                  Receive booking updates via email
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  New Booking Alerts
                </p>
                <p className="text-sm text-muted-foreground">
                  Get notified for new booking requests
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  Check-in Reminders
                </p>
                <p className="text-sm text-muted-foreground">
                  Send reminders before check-in date
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lock size={20} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Security</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  Two-Factor Authentication
                </p>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security
                </p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Session Timeout</p>
                <p className="text-sm text-muted-foreground">
                  Auto logout after inactivity
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Database Info */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database size={20} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Database</h2>
          </div>

          <div className="bg-secondary rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Currently using mock data. Connect to MongoDB backend to enable
              persistent data storage.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline">Cancel</Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
