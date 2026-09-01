"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GraduationCap, Loader2, ChevronDown, Pencil } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchGrades, createGrade, updateGrade, deleteGrade } from "@/services/gradeApi";

const OCCUPANCY_TYPES = [
  { value: "SINGLE", label: "Single" },
  { value: "DOUBLE", label: "Double" },
];

function occupancyLabel(list) {
  if (!list || list.length === 0) return "Select occupancy…";
  return list.map((t) => (t === "SINGLE" ? "Single" : "Double")).join(", ");
}

function OccupancyDropdown({ selected, onChange }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className="justify-between sm:min-w-[200px]">
          {occupancyLabel(selected)}
          <ChevronDown size={14} className="ml-2 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {OCCUPANCY_TYPES.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={selected.includes(opt.value)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(checked) => {
              onChange(
                checked
                  ? [...new Set([...selected, opt.value])]
                  : selected.filter((t) => t !== opt.value)
              );
            }}
          >
            Allow {opt.label} Occupancy
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EditGradeDialog({ grade, onClose, onSaved, setError }) {
  const [code, setCode] = useState(grade.code);
  const [allowed, setAllowed] = useState(grade.allowedOccupancies);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!code.trim()) {
      setError("Grade code cannot be empty");
      return;
    }
    if (allowed.length === 0) {
      setError("Select at least one allowed occupancy type");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateGrade(grade._id, { code: code.trim(), allowedOccupancies: allowed });
      onSaved();
    } catch (err) {
      setError(err.message || "Failed to update grade");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-sm rounded-xl border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Edit Grade</h3>

        <div className="space-y-2">
          <Label>Grade Code</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Allowed Occupancy</Label>
          <div className="space-y-2">
            {OCCUPANCY_TYPES.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={allowed.includes(opt.value)}
                  onCheckedChange={(checked) =>
                    setAllowed((prev) =>
                      checked ? [...new Set([...prev, opt.value])] : prev.filter((t) => t !== opt.value)
                    )
                  }
                />
                {opt.label} Occupancy
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border text-sm" disabled={saving}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GradeManagement() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [newAllowed, setNewAllowed] = useState(["DOUBLE"]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editingGrade, setEditingGrade] = useState(null);

  function load() {
    setLoading(true);
    fetchGrades()
      .then(setGrades)
      .catch((err) => setError(err.message || "Failed to load grades"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newCode.trim()) return;
    if (newAllowed.length === 0) {
      setError("Select at least one allowed occupancy type");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createGrade({ code: newCode.trim(), allowedOccupancies: newAllowed });
      setNewCode("");
      setNewAllowed(["DOUBLE"]);
      load();
    } catch (err) {
      setError(err.message || "Failed to add grade");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(grade) {
    try {
      await deleteGrade(grade._id);
      load();
    } catch (err) {
      setError(err.message || "Failed to deactivate grade");
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <GraduationCap size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Grade Management</h2>
          <p className="text-sm text-muted-foreground">
            Choose which occupancy types each grade is allowed to book. This only applies to customers booking for themselves — admins can always choose either.
          </p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <Input
          placeholder="Grade code (e.g. M1, O1, MM2)"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          className="sm:max-w-xs"
        />
        <OccupancyDropdown selected={newAllowed} onChange={setNewAllowed} />
        <Button type="submit" disabled={submitting || !newCode.trim()}>
          {submitting ? <Loader2 size={16} className="animate-spin" /> : "Add Grade"}
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : grades.length === 0 ? (
        <p className="text-sm text-muted-foreground">No grades defined yet.</p>
      ) : (
        <div className="space-y-2">
          {grades.map((grade) => (
            <div key={grade._id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <span className="font-medium">{grade.code}</span>
                {grade.allowedOccupancies.map((type) => (
                  <Badge key={type} className="bg-success/15 text-success border-success/30" noBgChange>
                    {type === "SINGLE" ? "Single" : "Double"}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingGrade(grade)}>
                  <Pencil size={14} className="mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive"
                  onClick={() => handleDeactivate(grade)}
                >
                  Deactivate
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingGrade && (
        <EditGradeDialog
          grade={editingGrade}
          setError={setError}
          onClose={() => setEditingGrade(null)}
          onSaved={() => {
            setEditingGrade(null);
            load();
          }}
        />
      )}
    </div>
  );
}

export default function Settings() {
  const { isSuperAdmin } = useAuth();

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

        {isSuperAdmin ? (
          <GradeManagement />
        ) : (
          <p className="text-sm text-muted-foreground">
            Nothing to configure here yet.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
