"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  MoreVertical,
  Mail,
  Building,
  Shield,
  Users as UsersIcon,
  User,
  Crown,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { fetchUsers, updateUser } from "@/api/userApi";
import { useRouter } from "next/navigation";

const roleConfig = {
  SUPER_ADMIN: {
    label: "Super Admin",
    icon: Crown,
    color: "bg-warning/15 text-warning border-warning/30",
  },
  ADMIN: {
    label: "Admin",
    icon: Shield,
    color: "bg-info/15 text-info border-info/30",
  },
  CUSTOMER: {
    label: "Customer",
    icon: User,
    color: "bg-secondary text-muted-foreground",
  },
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const router = useRouter();

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await fetchUsers();
        setUsers(data);
      } catch (err) {
        console.error("Failed to load users", err);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[300px] flex items-center justify-center text-muted-foreground">
          Loading users...
        </div>
      </DashboardLayout>
    );
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.department || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage system users and their roles
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={() => router.push("/users/new")}
        >
          <Plus size={18} className="mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="p-3 bg-secondary rounded-lg">
            <UsersIcon size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </div>
        </div>

        {Object.entries(roleConfig).map(([key, config]) => {
          const Icon = config.icon;
          const count = users.filter((u) => u.role === key).length;

          return (
            <div
              key={key}
              className="bg-card rounded-xl border border-border p-4 flex items-center gap-4"
            >
              <div className="p-3 bg-secondary rounded-lg">
                <Icon size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{count}</p>
                <p className="text-sm text-muted-foreground">
                  {config.label}s
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          {["all", "SUPER_ADMIN", "ADMIN", "CUSTOMER"].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === role
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {role === "all" ? "All" : roleConfig[role]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                  User
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                  Department
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                  Role
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                  Status
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => {
                const role = roleConfig[user.role];
                const RoleIcon = role?.icon || User;

                return (
                  <tr
                    key={user._id}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.name}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail size={12} />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building size={14} />
                        {user.department}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <Badge className={role?.color}>
                        <RoleIcon size={12} className="mr-1" />
                        {role?.label}
                      </Badge>
                    </td>

                    <td className="px-6 py-4">
                      {user.active === false ? (
                        <Badge className="bg-destructive/15 text-destructive border-destructive/30">
                          Inactive
                        </Badge>
                      ) : (
                        <Badge className="bg-success/15 text-success border-success/30">
                          Active
                        </Badge>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-secondary rounded-lg">
                            <MoreVertical size={16} />
                          </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/users/edit/${user._id}`)
                            }
                          >
                            Edit User
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setSelectedRole(user.role);
                              setRoleModalOpen(true);
                            }}
                          >
                            Change Role
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={async () => {
                              if (!confirm("Deactivate this user?")) return;

                              await updateUser(user._id, { active: false });

                              setUsers((prev) =>
                                prev.map((u) =>
                                  u._id === user._id
                                    ? { ...u, active: false }
                                    : u
                                )
                              );
                            }}
                          >
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {roleModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-card rounded-xl w-full max-w-md p-6 border shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Change User Role</h2>

              <div className="space-y-3 mb-6">
                <p className="text-sm text-muted-foreground">
                  User:{" "}
                  <span className="font-medium">{selectedUser.name}</span>
                </p>

                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-background"
                >
                  {Object.keys(roleConfig).map((role) => (
                    <option
                      key={role}
                      value={role}
                      disabled={
                        selectedUser.role === "SUPER_ADMIN" &&
                        role !== "SUPER_ADMIN"
                      }
                    >
                      {roleConfig[role].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setRoleModalOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  onClick={async () => {
                    await updateUser(selectedUser._id, {
                      role: selectedRole,
                    });

                    setUsers((prev) =>
                      prev.map((u) =>
                        u._id === selectedUser._id
                          ? { ...u, role: selectedRole }
                          : u
                      )
                    );

                    setRoleModalOpen(false);
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
