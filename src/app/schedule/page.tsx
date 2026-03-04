"use client";

import * as React from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { isStaffOrAdmin } from "@/lib/authz";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  employee: string;
  color: string;
  details?: string;
}

interface DaySchedule {
  [dateKey: string]: TimeSlot[];
}

export default function PublicSchedulePage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [viewMode, setViewMode] = React.useState<"month" | "week" | "day">("month");
  const [schedules, setSchedules] = React.useState<DaySchedule>({});
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingSlot, setEditingSlot] = React.useState<TimeSlot | null>(null);

  // Form state for adding/editing
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("17:00");
  const [employeeName, setEmployeeName] = React.useState("");
  const [selectedColor, setSelectedColor] = React.useState("blue");
  const [details, setDetails] = React.useState("");

  // Fetch schedule on mount
  React.useEffect(() => {
    async function fetchSchedule() {
      try {
        const res = await fetch("/api/schedule");
        const data = await res.json();
        if (data.schedules) {
          setSchedules(data.schedules);
        }
      } catch (e) {
        console.error("Failed to fetch schedule:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchSchedule();
  }, []);

  const canEdit = isLoaded && isStaffOrAdmin(user);

  const colorOptions = [
    { value: "blue", label: "Blue", bg: "bg-blue-100", text: "text-blue-800", bar: "bg-blue-200" },
    { value: "green", label: "Green", bg: "bg-green-100", text: "text-green-800", bar: "bg-green-200" },
    { value: "purple", label: "Purple", bg: "bg-purple-100", text: "text-purple-800", bar: "bg-purple-200" },
    { value: "red", label: "Red", bg: "bg-red-100", text: "text-red-800", bar: "bg-red-200" },
    { value: "yellow", label: "Yellow", bg: "bg-yellow-100", text: "text-yellow-800", bar: "bg-yellow-200" },
    { value: "pink", label: "Pink", bg: "bg-pink-100", text: "text-pink-800", bar: "bg-pink-200" },
    { value: "orange", label: "Orange", bg: "bg-orange-100", text: "text-orange-800", bar: "bg-orange-200" },
    { value: "gray", label: "Gray", bg: "bg-gray-100", text: "text-gray-800", bar: "bg-gray-200" },
  ];

  const getDateKey = (date: Date) => date.toISOString().split('T')[0];
  const getColorStyle = (colorValue: string) => colorOptions.find(c => c.value === colorValue) || colorOptions[0];
  const getDaySlots = (date: Date | null) => date ? schedules[getDateKey(date)] || [] : [];
  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Generate calendar days for month view
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleAddTimeslot = async () => {
    if (!selectedDate || !employeeName.trim()) return;
    console.log("[Schedule UI] Add timeslot clicked");
    const dateKey = getDateKey(selectedDate);
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      startTime,
      endTime,
      employee: employeeName.trim(),
      color: selectedColor,
      details: details.trim() || undefined,
    };
    const newSchedules = { ...schedules, [dateKey]: [...(schedules[dateKey] || []), newSlot] };
    setSchedules(newSchedules);
    resetForm();
    await saveSchedule(newSchedules);
  };

  const handleUpdateTimeslot = async () => {
    if (!selectedDate || !editingSlot || !employeeName.trim()) return;
    console.log("[Schedule UI] Update timeslot clicked", editingSlot.id);
    const dateKey = getDateKey(selectedDate);
    const newSchedules = {
      ...schedules,
      [dateKey]: schedules[dateKey]?.map(slot => slot.id === editingSlot.id 
        ? { ...slot, startTime, endTime, employee: employeeName.trim(), color: selectedColor, details: details.trim() || undefined }
        : slot) || [],
    };
    setSchedules(newSchedules);
    resetForm();
    await saveSchedule(newSchedules);
  };

  const handleDeleteTimeslot = async (slotId: string) => {
    if (!selectedDate || !canEdit) return;
    console.log("[Schedule UI] Delete timeslot clicked", slotId);
    const dateKey = getDateKey(selectedDate);
    const newSchedules = { ...schedules, [dateKey]: schedules[dateKey]?.filter(slot => slot.id !== slotId) || [] };
    setSchedules(newSchedules);
    await saveSchedule(newSchedules);
  };

  async function saveSchedule(newSchedules: DaySchedule) {
    if (!canEdit) return;
    setSaving(true);
    try {
      console.log("Saving schedules:", Object.keys(newSchedules).length, "days");
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules: newSchedules }),
      });
      console.log("Save response:", res.status);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      console.log("Schedule saved successfully");
    } catch (e: any) {
      console.error("Failed to save schedule:", e);
      alert("Failed to save: " + (e.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  const handleEditTimeslot = (slot: TimeSlot) => {
    if (!canEdit) return;
    setEditingSlot(slot);
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setEmployeeName(slot.employee);
    setSelectedColor(slot.color);
    setDetails(slot.details || "");
    setIsEditing(true);
  };

  const resetForm = () => {
    setStartTime("09:00");
    setEndTime("17:00");
    setEmployeeName("");
    setSelectedColor("blue");
    setDetails("");
    setIsEditing(false);
    setEditingSlot(null);
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      {/* Hero Banner */}
      <div className="mb-4">
        <img src="/herobannere.jpg" alt="Before And Afters' Closet" className="w-full rounded-xl" />
      </div>

      {/* Auth Status */}
      <div className="mb-4 flex items-center justify-end gap-3">
        {saving && (
          <span className="text-sm text-muted-foreground">Saving...</span>
        )}
        {canEdit ? (
          <>
            <span className="text-sm text-muted-foreground">
              Logged in as {user?.primaryEmailAddress?.emailAddress || ""}
            </span>
            <Link
              href="/dashboard"
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Dashboard
            </Link>
          </>
        ) : (
          <Link
            href="/login?next=/schedule"
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-muted"
          >
            Log in to edit
          </Link>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="text-muted-foreground">Loading schedule...</div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">Employee Schedule</h1>
                <p className="text-sm text-muted-foreground">
                  View employee timeslots and availability
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("month")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    viewMode === "month" 
                      ? "bg-black text-white" 
                      : "bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    viewMode === "week" 
                      ? "bg-black text-white" 
                      : "bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode("day")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    viewMode === "day" 
                      ? "bg-black text-white" 
                      : "bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  Day
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
            {/* Calendar Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="rounded-lg p-2 hover:bg-muted transition"
                >
                  ←
                </button>
                <h2 className="text-lg font-semibold">{monthYear}</h2>
                <button
                  onClick={() => navigateMonth(1)}
                  className="rounded-lg p-2 hover:bg-muted transition"
                >
                  →
                </button>
              </div>
              <button
                onClick={goToToday}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
              >
                Today
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Week day headers */}
              {weekDays.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {days.map((day, index) => {
                const daySlots = day ? getDaySlots(day) : [];
                return (
                  <div
                    key={index}
                    className={`min-h-[100px] sm:min-h-[120px] p-2 sm:p-3 border border-border rounded-lg transition relative group ${
                      day ? 'hover:bg-muted cursor-pointer' : ''
                    } ${
                      selectedDate && day && 
                      selectedDate.toDateString() === day.toDateString() 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-background'
                    }`}
                    onClick={() => day && setSelectedDate(day)}
                  >
                    {day && (
                      <>
                        <div className="text-sm sm:text-base font-medium mb-1">{day.getDate()}</div>
                        {daySlots.length > 0 && (
                          <div className="space-y-1.5">
                            {daySlots.slice(0, 2).map((slot, idx) => {
                              const colorStyle = getColorStyle(slot.color);
                              return (
                                <div 
                                  key={idx} 
                                  className={`h-2 w-full rounded ${colorStyle.bar} relative`}
                                >
                                  {/* Hover tooltip */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 w-max max-w-[200px]">
                                    <div className="bg-black text-white text-xs rounded-lg px-2 py-1.5 shadow-lg">
                                      <div className="font-semibold">{slot.employee}</div>
                                      <div>{formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}</div>
                                      {slot.details && <div className="mt-1 text-gray-300">{slot.details}</div>}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {daySlots.length > 2 && (
                              <div className="text-xs text-muted-foreground text-center">+{daySlots.length - 2} more</div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Date Details */}
            {selectedDate && (
              <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4">
                <h3 className="font-semibold mb-3">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                {/* Timeslot List */}
                <div className="space-y-2 mb-4">
                  {getDaySlots(selectedDate).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No timeslots scheduled for this day.</p>
                  ) : (
                    getDaySlots(selectedDate).map((slot) => {
                      const colorStyle = getColorStyle(slot.color);
                      return (
                        <div 
                          key={slot.id} 
                          className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${colorStyle.bar}`}></div>
                            <span className="text-sm font-medium">
                              {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${colorStyle.bg} ${colorStyle.text}`}>
                              {slot.employee}
                            </span>
                            {slot.details && (
                              <span className="text-xs text-muted-foreground" title={slot.details}>
                                📝
                              </span>
                            )}
                            {canEdit && (
                              <>
                                <button
                                  onClick={() => handleEditTimeslot(slot)}
                                  className="rounded px-2 py-1 text-xs bg-muted hover:bg-muted/80 transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTimeslot(slot.id)}
                                  className="rounded px-2 py-1 text-xs bg-red-100 text-red-800 hover:bg-red-200 transition"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add/Edit Form - Only for logged in users */}
                {canEdit && (
                  <div className="border-t border-border pt-4">
                    <h4 className="font-medium mb-3">
                      {isEditing ? 'Edit Timeslot' : 'Add Timeslot'}
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Start Time</label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">End Time</label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Employee</label>
                        <input
                          type="text"
                          value={employeeName}
                          onChange={(e) => setEmployeeName(e.target.value)}
                          placeholder="Enter name"
                          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Color</label>
                        <select
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                        >
                          {colorOptions.map(color => (
                            <option key={color.value} value={color.value}>{color.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-1">Details (optional)</label>
                      <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Add notes, location, or other details..."
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
                      />
                    </div>
                    <div className="mt-4 flex gap-2">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={handleUpdateTimeslot}
                            disabled={!employeeName.trim()}
                            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition disabled:opacity-50"
                          >
                            Update Timeslot
                          </button>
                          <button
                            type="button"
                            onClick={resetForm}
                            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={handleAddTimeslot}
                          disabled={!employeeName.trim()}
                          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition disabled:opacity-50"
                        >
                          Add Timeslot
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
