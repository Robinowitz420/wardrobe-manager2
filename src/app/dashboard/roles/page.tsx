"use client";

import * as React from "react";

interface StaffRole {
  id: string;
  name: string;
  emojis: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmployeeRolesPage() {
  const [staff, setStaff] = React.useState<StaffRole[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [newName, setNewName] = React.useState("");
  const [newEmojis, setNewEmojis] = React.useState("");

  // Load staff
  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/staff-roles");
        const data = await res.json();
        setStaff(data.staff || []);
      } catch (e) {
        console.error("Failed to load staff:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleAdd() {
    if (!newName.trim() || !newEmojis.trim()) return;
    const res = await fetch("/api/staff-roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), emojis: newEmojis.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setStaff(s => [...s, data.staff]);
      setNewName("");
      setNewEmojis("");
    } else {
      alert("Failed to add staff");
    }
  }

  async function handleUpdate(id: string, name: string, emojis: string) {
    const res = await fetch(`/api/staff-roles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), emojis: emojis.trim() }),
    });
    if (res.ok) {
      setStaff(s => s.map(st => st.id === id ? { ...st, name: name.trim(), emojis: emojis.trim() } : st));
      setEditing(null);
    } else {
      alert("Failed to update staff");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this staff member?")) return;
    const res = await fetch(`/api/staff-roles/${id}`, { method: "DELETE" });
    if (res.ok) {
      setStaff(s => s.filter(st => st.id !== id));
    } else {
      alert("Failed to delete staff");
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
          <h1 className="text-xl font-semibold">Employee Roles</h1>
          <p className="text-sm text-muted-foreground">Manage staff and their roles.</p>
        </div>

        {/* Add new */}
        <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="text"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            />
            <input
              type="text"
              placeholder="Emojis (e.g., 👗 ✨ 🏠)"
              value={newEmojis}
              onChange={(e) => setNewEmojis(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || !newEmojis.trim()}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              Add Staff
            </button>
          </div>
          <div className="mt-4">
            <button
              onClick={() => {
                const staffList = [
                  { name: "Varuna", emojis: "🌌 🐈‍⬛ ✨" },
                  { name: "Saturday", emojis: "🛋️ 🛍️ 🧣" },
                  { name: "Eliza", emojis: "🎬 🤳 📸" },
                  { name: "Sarah", emojis: "🎬 💰 👠" },
                  { name: "Linda", emojis: "🎨 🛠️ 📦" },
                  { name: "Robin", emojis: "💻 📱 👑" },
                  { name: "Swaggi", emojis: "🤱 💆‍♂️ 🇨🇳" },
                  { name: "Charles", emojis: "🌙 🎟️ 📋" },
                  { name: "Eli", emojis: "🌙 📊 💸" },
                  { name: "Will", emojis: "🎧 🕺 🔊" },
                  { name: "Marvin", emojis: "🇫🇷 🤝 🥖" },
                  { name: "Addison", emojis: "👗 ✨ 🏠" },
                  { name: "Archie", emojis: "🥂 📅 👔" },
                  { name: "Asa", emojis: "📻 🎙️ 🎧" },
                  { name: "Jo", emojis: "🚶‍♀️ 🧪 💎" },
                  { name: "Vanessa", emojis: "🎊 🎈 🗓️" },
                  { name: "Solani", emojis: "🎤 🌟 🗓️" },
                ];
                staffList.forEach(async (member) => {
                  try {
                    await fetch("/api/staff-roles", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: member.name, emojis: member.emojis }),
                    });
                  } catch (e) {
                    console.error("Failed to seed staff:", member.name, e);
                  }
                });
                alert("Imported staff list");
              }}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Import Provided List
            </button>
          </div>
        </div>

        {/* List */}
        <div className="mt-6 space-y-2">
          {staff.length === 0 ? (
            <p className="text-sm text-muted-foreground">No staff added yet.</p>
          ) : (
            staff.map((member) => (
              <div key={member.id} className="rounded-lg border border-border bg-background p-3">
                {editing === member.id ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input
                      type="text"
                      defaultValue={member.name}
                      id={`name-${member.id}`}
                      className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                    />
                    <input
                      type="text"
                      defaultValue={member.emojis}
                      id={`emojis-${member.id}`}
                      className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const nameEl = document.getElementById(`name-${member.id}`) as HTMLInputElement;
                          const emojisEl = document.getElementById(`emojis-${member.id}`) as HTMLInputElement;
                          handleUpdate(member.id, nameEl.value, emojisEl.value);
                        }}
                        className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-800"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-lg">{member.emojis}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditing(member.id)}
                        className="rounded-lg border border-border bg-card px-3 py-1 text-xs font-medium hover:bg-muted"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="rounded-lg border border-red-100 bg-red-50 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-100"
                      >
                        Delete
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
