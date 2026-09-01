"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";

import { createUser } from "@/services/userApi";
import { fetchGrades } from "@/services/gradeApi";

export default function AddUser() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [grades, setGrades] = useState([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CUSTOMER",
    department: "",
    phone: "",
    grade: "",
  });

  useEffect(() => {
    fetchGrades().then(setGrades).catch(() => setGrades([]));
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createUser({ ...form, grade: form.grade || null });
      router.push("/users");
    } catch (err) {
      setError(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6 text-sm"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="text-2xl font-bold mb-6">Add User</h1>

        <form
          onSubmit={submit}
          className="space-y-5 bg-card p-6 rounded-xl border"
        >
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Password *</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(v) => handleChange("role", v)}
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

          <div className="space-y-2">
            <Label>Department</Label>
            <Input
              value={form.department}
              onChange={(e) => handleChange("department", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Grade</Label>
            <Select
              value={form.grade || "NONE"}
              onValueChange={(v) => handleChange("grade", v === "NONE" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No grade assigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">No grade assigned</SelectItem>
                {grades.map((g) => (
                  <SelectItem key={g._id} value={g.code}>
                    {g.code} ({g.allowedOccupancies.map((t) => t === "SINGLE" ? "Single" : "Double").join(", ")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>

          <Button className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : "Create User"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
