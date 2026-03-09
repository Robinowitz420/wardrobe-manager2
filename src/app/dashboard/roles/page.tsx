"use client";

import * as React from "react";

interface StaffRole {
  id: string;
  name: string;
  emojis: string;
  referralCode: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmployeeRolesPage() {
  const [staff, setStaff] = React.useState<StaffRole[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [newName, setNewName] = React.useState("");
  const [newEmojis, setNewEmojis] = React.useState("");
  const [newReferralCode, setNewReferralCode] = React.useState("");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  function normalizeNameKey(name: string): string {
    return name.trim().toLowerCase();
  }

  function normalizePersonKey(name: string): string {
    const trimmed = typeof name === "string" ? name.trim() : "";
    const base = trimmed.split("-")[0]?.trim() || trimmed;
    return base.toLowerCase();
  }

  function combineStaff(a: StaffRole, b: StaffRole): StaffRole {
    const pickString = (x: string, y: string) => (x && x.trim() ? x : y);
    const pickLatestIso = (x: string, y: string) => {
      const tx = Date.parse(x);
      const ty = Date.parse(y);
      if (!Number.isFinite(tx)) return y;
      if (!Number.isFinite(ty)) return x;
      return tx >= ty ? x : y;
    };

    const cleanName = (n: string) => n.trim();
    const preferTitleFormat = (x: string, y: string) => {
      const cx = cleanName(x);
      const cy = cleanName(y);
      if (!cx) return cy;
      if (!cy) return cx;
      // Prefer the name with title (contains " - ")
      const hasTitleX = cx.includes(" - ");
      const hasTitleY = cy.includes(" - ");
      if (hasTitleX && !hasTitleY) return cx;
      if (hasTitleY && !hasTitleX) return cy;
      // If both have titles or neither do, prefer the first one
      return cx;
    };

    return {
      // Keep the first id as canonical for UI actions.
      id: a.id,
      name: preferTitleFormat(a.name, b.name),
      emojis: pickString(a.emojis, b.emojis),
      referralCode: pickString(a.referralCode, b.referralCode),
      createdAt: pickLatestIso(a.createdAt, b.createdAt),
      updatedAt: pickLatestIso(a.updatedAt, b.updatedAt),
    };
  }

  function mergeDuplicates(list: StaffRole[]): StaffRole[] {
    // Group by person key (base name before any " - description") and combine fields into one.
    const byPerson = new Map<string, StaffRole>();
    for (const item of list) {
      if (!item?.name) continue;
      const key = normalizePersonKey(item.name);
      const existing = byPerson.get(key);
      if (!existing) {
        byPerson.set(key, item);
      } else {
        byPerson.set(key, combineStaff(existing, item));
      }
    }
    // Stable sort for readability
    return Array.from(byPerson.values()).sort((a, b) => normalizeNameKey(a.name).localeCompare(normalizeNameKey(b.name)));
  }

  // Load staff
  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/staff-roles");
        const data = await res.json();
        setStaff(mergeDuplicates(data.staff || []));
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
      body: JSON.stringify({ 
        name: newName.trim(), 
        emojis: newEmojis.trim(),
        referralCode: newReferralCode.trim() || undefined 
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setStaff((s) => mergeDuplicates([...s, data.staff]));
      setNewName("");
      setNewEmojis("");
      setNewReferralCode("");
    } else {
      const err = await res.json().catch(() => ({ error: "Failed to add staff" }));
      alert(err.error || "Failed to add staff");
    }
  }

  async function handleUpdate(id: string, name: string, emojis: string, referralCode: string) {
    const res = await fetch(`/api/staff-roles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name: name.trim(), 
        emojis: emojis.trim(),
        referralCode: referralCode.trim() || undefined
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setStaff(s => s.map(st => st.id === id ? { ...st, ...data.staff } : st));
      setEditing(null);
    } else {
      const err = await res.json().catch(() => ({ error: "Failed to update staff" }));
      alert(err.error || "Failed to update staff");
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
          <div className="grid gap-3 sm:grid-cols-4">
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
            <input
              type="text"
              placeholder="Referral Code (auto if blank)"
              value={newReferralCode}
              onChange={(e) => setNewReferralCode(e.target.value)}
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
          <p className="mt-2 text-xs text-muted-foreground">
            Referral code will be auto-generated from name if left blank (e.g., "Varuna" → "VARUNA")
          </p>
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
                      body: JSON.stringify({ 
                        name: member.name, 
                        emojis: member.emojis,
                        // Referral codes will be auto-generated
                      }),
                    });
                  } catch (e) {
                    console.error("Failed to seed staff:", member.name, e);
                  }
                });
                alert("Imported staff list with auto-generated referral codes");
              }}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Import Provided List
            </button>
            <button
              onClick={() => {
                const emojiMap: Record<string, string> = {
                  "Varuna": "🌌 🐈‍⬛ ✨",
                  "Saturday": "🛋️ 🛍️ 🧣",
                  "Eliza": "🎬 🤳 📸",
                  "Sarah": "🎬 💰 👠",
                  "Linda": "🎨 🛠️ 📦",
                  "Robin": "💻 📱 👑",
                  "Swaggi": "🤱 💆‍♂️ 🇨🇳",
                  "Charles": "🌙 🎟️ 📋",
                  "Eli": "🌙 📊 💸",
                  "Will": "🎧 🕺 🔊",
                  "Marvin": "🇫🇷 🤝 🥖",
                  "Addison": "👗 ✨ 🏠",
                  "Archie": "🥂 📅 👔",
                  "Asa": "📻 🎙️ 🎧",
                  "Jo": "🚶‍♀️ 🧪 💎",
                  "Vanessa": "🎊 🎈 🗓️",
                  "Solani": "🎤 🌟 🗓️",
                };
                let updated = 0;
                staff.forEach(async (member) => {
                  const emojis = emojiMap[member.name];
                  if (emojis && !member.emojis) {
                    try {
                      await fetch(`/api/staff-roles/${member.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: member.name, emojis, referralCode: member.referralCode }),
                      });
                      updated++;
                    } catch (e) {
                      console.error("Failed to backfill emojis:", member.name, e);
                    }
                  }
                });
                alert(`Backfilling emojis for ${updated} staff members... Refresh the page in a few seconds.`);
              }}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Backfill Emojis
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
                  <div className="grid gap-3 sm:grid-cols-4">
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
                    <input
                      type="text"
                      defaultValue={member.referralCode || ""}
                      id={`ref-${member.id}`}
                      placeholder="Referral code"
                      className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const nameEl = document.getElementById(`name-${member.id}`) as HTMLInputElement;
                          const emojisEl = document.getElementById(`emojis-${member.id}`) as HTMLInputElement;
                          const refEl = document.getElementById(`ref-${member.id}`) as HTMLInputElement;
                          handleUpdate(member.id, nameEl.value, emojisEl.value, refEl.value);
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
                      <div className="font-medium">{member.name} <span className="text-lg">{member.emojis}</span></div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Ref Code: <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{member.referralCode || "—"}</span>
                        {member.referralCode && (
                          <>
                            {" • "}
                            <button
                              onClick={() => {
                                const url = `https://wardrobe-manager2.vercel.app/r/${member.referralCode}`;
                                navigator.clipboard.writeText(url);
                                setCopiedId(member.id);
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="text-blue-600 hover:underline text-xs"
                            >
                              {copiedId === member.id ? "Copied!" : "Copy URL"}
                            </button>
                          </>
                        )}
                      </div>
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
