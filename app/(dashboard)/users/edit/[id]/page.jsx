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

import { fetchUserById, updateUser } from "@/services/userApi";
import { fetchGrades } from "@/services/gradeApi";
import { useAuth } from "@/context/AuthContext";
import { useRequireRole } from "@/hooks/use-require-role";

export default function EditUser() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const { authorized, checking } = useRequireRole(["SUPER_ADMIN"]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [grades, setGrades] = useState([]);
  const [originalRole, setOriginalRole] = useState("CUSTOMER");

  const [form, setForm] = useState({
    name: "",
    department: "",
    phone: "",
    role: "CUSTOMER",
    grade: "",
    isActive: true,
  });

  useEffect(() => {
    async function load() {
      const [user, gradeList] = await Promise.all([
        fetchUserById(id),
        fetchGrades().catch(() => []),
      ]);
      setForm({
        name: user.name,
        department: user.department,
        phone: user.phone,
        role: user.role,
        grade: user.grade || "",
        isActive: user.isActive,
      });
      setOriginalRole(user.role);
      setGrades(gradeList);
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form, grade: form.grade || null };
      // Only send role when it actually changed — the server rejects any role field at
      // all from a non-SUPER_ADMIN, even an unchanged one, so resending it unconditionally
      // meant an ADMIN could never save an edit to anything else on this form.
      if (form.role === originalRole) delete payload.role;
      await updateUser(id, payload);
      router.push("/users");
    } catch (err) {
      setError(err.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  if (checking || !authorized) {
    return null;
  }

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
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {error}
            </div>
          )}

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
            {isSuperAdmin ? (
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
            ) : (
              <p className="text-sm h-10 flex items-center px-3 border rounded-md bg-muted/30 text-muted-foreground">
                {form.role} <span className="ml-1">(only Super Admin can change roles)</span>
              </p>
            )}
          </div>

          <div>
            <Label>Grade</Label>
            <Select
              value={form.grade || "NONE"}
              onValueChange={(v) => setForm({ ...form, grade: v === "NONE" ? "" : v })}
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

          <Button className="w-full" disabled={saving}>
            Save Changes
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
