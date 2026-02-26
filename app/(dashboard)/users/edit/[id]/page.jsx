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
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";

import { fetchUserById, updateUser } from "@/api/userApi";

export default function EditUser() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    department: "",
    phone: "",
    role: "CUSTOMER",
    active: true,
  });

  useEffect(() => {
    async function load() {
      const user = await fetchUserById(id);
      setForm({
        name: user.name,
        department: user.department,
        phone: user.phone,
        role: user.role,
        active: user.active,
      });
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await updateUser(id, form);
    router.push("/users");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center p-10">
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
          className="flex items-center gap-2 mb-6"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="text-2xl font-bold mb-6">Edit User</h1>

        <form
          onSubmit={submit}
          className="space-y-5 bg-card p-6 border rounded-xl"
        >
          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <Label>Department</Label>
            <Input
              value={form.department}
              onChange={(e) =>
                setForm({ ...form, department: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div>
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm({ ...form, role: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full" disabled={saving}>
            Save Changes
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
