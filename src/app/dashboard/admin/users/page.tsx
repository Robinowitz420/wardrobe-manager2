"use client";

import * as React from "react";

interface ClerkUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  lastSignInAt: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = React.useState<ClerkUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [editRole, setEditRole] = React.useState("");

  // Load users
  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        setUsers(data.users || []);
      } catch (e) {
        console.error("Failed to load users:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleUpdateRole(userId: string) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: editRole }),
    });
    if (res.ok) {
      setUsers(u => u.map(u => (u.id === userId ? { ...u, role: editRole } : u)));
      setEditing(null);
      setEditRole("");
    } else {
      alert("Failed to update user role");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold">User Management</h1>
          <p className="text-sm text-muted-foreground">View and manage Clerk users and roles.</p>
        </div>

        <div className="mt-6 space-y-2">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            users.map((user) => (
              <div key={user.id} className="rounded-lg border border-border bg-background p-3">
                {editing === user.id ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-muted-foreground">Last seen: {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : "Never"}</div>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-1 text-sm"
                      >
                        <option value="">Select role</option>
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="member">Member</option>
                      </select>
                      <button
                        onClick={() => handleUpdateRole(user.id)}
                        disabled={!editRole}
                        className="rounded-lg bg-black px-3 py-1 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="rounded-lg border border-border bg-card px-3 py-1 text-xs font-medium hover:bg-muted"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-muted-foreground">Role: {user.role}</div>
                      <div className="text-xs text-muted-foreground">Last seen: {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : "Never"}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditing(user.id);
                          setEditRole(user.role);
                        }}
                        className="rounded-lg border border-border bg-card px-3 py-1 text-xs font-medium hover:bg-muted"
                      >
                        Edit Role
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
