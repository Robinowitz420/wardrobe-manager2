"use client";

import * as React from "react";
import Link from "next/link";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  employee: string;
  color: string;
}

interface DaySchedule {
  [dateKey: string]: TimeSlot[];
}

export default function CalendarPage() {
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
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
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

  const handleAddTimeslot = () => {
    if (!selectedDate || !employeeName.trim()) return;
    const dateKey = getDateKey(selectedDate);
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      startTime,
      endTime,
      employee: employeeName.trim(),
      color: selectedColor,
    };
    setSchedules(prev => ({ ...prev, [dateKey]: [...(prev[dateKey] || []), newSlot] }));
    resetForm();
  };

  const handleEditTimeslot = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setEmployeeName(slot.employee);
    setSelectedColor(slot.color);
    setIsEditing(true);
  };

  const handleUpdateTimeslot = () => {
    if (!selectedDate || !editingSlot || !employeeName.trim()) return;
    const dateKey = getDateKey(selectedDate);
    setSchedules(prev => ({
      ...prev,
      [dateKey]: prev[dateKey]?.map(slot => slot.id === editingSlot.id 
        ? { ...slot, startTime, endTime, employee: employeeName.trim(), color: selectedColor }
        : slot) || [],
    }));
    resetForm();
  };

  const handleDeleteTimeslot = (slotId: string) => {
    if (!selectedDate) return;
    const dateKey = getDateKey(selectedDate);
    setSchedules(prev => ({ ...prev, [dateKey]: prev[dateKey]?.filter(slot => slot.id !== slotId) || [] }));
  };

  const resetForm = () => {
    setStartTime("09:00");
    setEndTime("17:00");
    setEmployeeName("");
    setSelectedColor("blue");
    setIsEditing(false);
    setEditingSlot(null);
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Employee Schedule</h1>
            <p className="text-sm text-muted-foreground">
              Manage employee timeslots and availability
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
                className={`min-h-[80px] p-2 border border-border rounded-lg transition ${
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
                    <div className="text-sm font-medium">{day.getDate()}</div>
                    {daySlots.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {daySlots.slice(0, 3).map((slot, idx) => {
                          const colorStyle = getColorStyle(slot.color);
                          return (
                            <div 
                              key={idx} 
                              className={`h-1 w-full rounded ${colorStyle.bar}`}
                              title={`${slot.employee}: ${formatTimeDisplay(slot.startTime)} - ${formatTimeDisplay(slot.endTime)}`}
                            ></div>
                          );
                        })}
                        {daySlots.length > 3 && (
                          <div className="text-xs text-muted-foreground">+{daySlots.length - 3} more</div>
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
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add/Edit Form */}
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
              <div className="mt-4 flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleUpdateTimeslot}
                      disabled={!employeeName.trim()}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition disabled:opacity-50"
                    >
                      Update Timeslot
                    </button>
                    <button
                      onClick={resetForm}
                      className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleAddTimeslot}
                    disabled={!employeeName.trim()}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    Add Timeslot
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          ← Back to Profile
        </Link>
      </div>
    </div>
  );
}
