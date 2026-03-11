"use client";

import * as React from "react";

interface Event {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  location?: string;
  capacity?: number;
  signups: Array<{
    userId: string;
    name: string;
    email?: string;
    phone?: string;
    signedUpAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function EventsCalendarPage() {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [events, setEvents] = React.useState<Event[]>([]);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);
  const [hoveredEvent, setHoveredEvent] = React.useState<Event | null>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [showSignupForm, setShowSignupForm] = React.useState(false);
  const [signupData, setSignupData] = React.useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = React.useState(false);

  // Form state for creating events
  const [newEvent, setNewEvent] = React.useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    description: "",
    location: "",
    capacity: "",
  });

  const canCreate = user?.role === "staff" || user?.role === "admin";
  const isLoggedIn = Boolean(user);

  // Fetch user auth status
  React.useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/check");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
        }
      } catch {
        // Not logged in - that's fine
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  // Fetch events
  React.useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events");
        const data = await res.json();
        setEvents(data.events || []);
      } catch (e) {
        console.error("Failed to fetch events:", e);
      }
    }
    fetchEvents();
  }, []);

  const getDateKey = (date: Date) => date.toISOString().split("T")[0];

  const getEventsForDate = (date: Date) => {
    const key = getDateKey(date);
    return events.filter((e) => e.date === key);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const formatTime = (time?: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleMouseEnter = (e: React.MouseEvent, event: Event) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltipPosition({ x: rect.left, y: rect.bottom + 8 });
    setHoveredEvent(event);
  };

  const handleMouseLeave = () => {
    setHoveredEvent(null);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleSignup = async (eventId: string) => {
    if (!isLoggedIn) return;
    if (!signupData.name.trim()) {
      alert("Please enter your name");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "signup", 
          name: signupData.name.trim(),
          email: signupData.email.trim() || null,
          phone: signupData.phone.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEvents((prev) => prev.map((e) => (e.id === eventId ? data.event : e)));
        setSelectedEvent(data.event);
        setShowSignupForm(false);
        setSignupData({ name: "", email: "", phone: "" });
      } else {
        alert(data.error || "Failed to sign up");
      }
    } catch (e) {
      console.error("Signup failed:", e);
      alert("Failed to sign up");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnsignup = async (eventId: string) => {
    if (!isLoggedIn) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unsignup" }),
      });
      const data = await res.json();
      if (res.ok) {
        setEvents((prev) => prev.map((e) => (e.id === eventId ? data.event : e)));
        setSelectedEvent(data.event);
      } else {
        alert(data.error || "Failed to remove signup");
      }
    } catch (e) {
      console.error("Unsignup failed:", e);
      alert("Failed to remove signup");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEvent.title,
          date: newEvent.date,
          startTime: newEvent.startTime || null,
          endTime: newEvent.endTime || null,
          description: newEvent.description || null,
          location: newEvent.location || null,
          capacity: newEvent.capacity ? parseInt(newEvent.capacity) : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEvents((prev) => [...prev, data.event].sort((a, b) => a.date.localeCompare(b.date)));
        setShowCreateForm(false);
        setNewEvent({
          title: "",
          date: "",
          startTime: "",
          endTime: "",
          description: "",
          location: "",
          capacity: "",
        });
      } else {
        alert(data.error || "Failed to create event");
      }
    } catch (e) {
      console.error("Create event failed:", e);
      alert("Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        setSelectedEvent(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete event");
      }
    } catch (e) {
      console.error("Delete event failed:", e);
      alert("Failed to delete event");
    }
  };

  const isUserSignedUp = (event: Event) => {
    return event.signups?.some((s) => s.userId === user?.id);
  };

  const exportToGoogleCalendar = () => {
    // Generate ICS content for all events
    const icsEvents = events.map((event) => {
      const startDate = new Date(event.date + "T" + (event.startTime || "00:00"));
      const endDate = new Date(event.date + "T" + (event.endTime || "23:59"));
      
      const formatICSDate = (d: Date) => {
        return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      };

      const signupNames = event.signups?.map(s => s.name).join(", ") || "";
      const description = (event.description || "") + (signupNames ? `\n\nSigned up: ${signupNames}` : "");

      return [
        "BEGIN:VEVENT",
        `DTSTART:${formatICSDate(startDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
        event.location ? `LOCATION:${event.location}` : "",
        "END:VEVENT",
      ].filter(Boolean).join("\r\n");
    });

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Before & Afters//Events Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      ...icsEvents,
      "END:VCALENDAR",
    ].join("\r\n");

    // Download the ICS file
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "before-afters-events.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Events Calendar</h1>
              <p className="text-sm text-muted-foreground">
                View upcoming events and sign up to participate
              </p>
            </div>
            {canCreate && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
              >
                Create Event
              </button>
            )}
          </div>

          {/* Month Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted transition"
            >
              ← Previous
            </button>
            <h2 className="text-lg font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted transition"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/50">
            {dayNames.map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const dayEvents = day ? getEventsForDate(day) : [];
              const isToday = day && getDateKey(day) === getDateKey(new Date());

              return (
                <div
                  key={index}
                  className={`min-h-[140px] border-b border-r border-border p-2 ${
                    day ? "bg-background cursor-pointer hover:bg-muted/30" : "bg-muted/20"
                  }`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : ""}`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className="rounded bg-blue-100 text-blue-800 px-2 py-1 text-xs cursor-pointer hover:bg-blue-200 transition"
                            onMouseEnter={(e) => handleMouseEnter(e, event)}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => handleEventClick(event)}
                          >
                            <div className="truncate font-medium">{event.title}</div>
                            {event.signups && event.signups.length > 0 && (
                              <div className="truncate text-blue-600 text-[10px] mt-0.5">
                                👤 {event.signups.map(s => s.name).join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Hover Tooltip */}
        {hoveredEvent && (
          <div
            className="fixed z-50 w-64 rounded-lg border border-border bg-card p-3 shadow-lg"
            style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
          >
            <div className="font-medium text-sm">{hoveredEvent.title}</div>
            {hoveredEvent.startTime && hoveredEvent.endTime && (
              <div className="text-xs text-muted-foreground mt-1">
                {formatTime(hoveredEvent.startTime)} - {formatTime(hoveredEvent.endTime)}
              </div>
            )}
            {hoveredEvent.location && (
              <div className="text-xs text-muted-foreground mt-1">
                📍 {hoveredEvent.location}
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              {hoveredEvent.signups?.length || 0}
              {hoveredEvent.capacity ? ` / ${hoveredEvent.capacity}` : ""} signed up
            </div>
            {hoveredEvent.signups && hoveredEvent.signups.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                👤 {hoveredEvent.signups.map(s => s.name).join(', ')}
              </div>
            )}
            {hoveredEvent.description && (
              <div className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {hoveredEvent.description}
              </div>
            )}
          </div>
        )}

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="text-muted-foreground">
                  📅 {new Date(selectedEvent.date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                {selectedEvent.startTime && selectedEvent.endTime && (
                  <div className="text-muted-foreground">
                    🕐 {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
                  </div>
                )}
                {selectedEvent.location && (
                  <div className="text-muted-foreground">📍 {selectedEvent.location}</div>
                )}
                {selectedEvent.description && (
                  <div className="text-muted-foreground mt-3">{selectedEvent.description}</div>
                )}
              </div>

              {/* Signups */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-sm font-medium mb-2">
                  Signups ({selectedEvent.signups?.length || 0}
                  {selectedEvent.capacity ? ` / ${selectedEvent.capacity}` : ""})
                </div>
                {selectedEvent.signups && selectedEvent.signups.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedEvent.signups.map((signup, index) => (
                      <div key={index} className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-2">
                        <div className="font-medium text-foreground">{signup.name}</div>
                        {signup.email && <div className="text-xs">📧 {signup.email}</div>}
                        {signup.phone && <div className="text-xs">📱 {signup.phone}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No signups yet</div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-border">
                {isLoggedIn ? (
                  isUserSignedUp(selectedEvent) ? (
                    <button
                      onClick={() => handleUnsignup(selectedEvent.id)}
                      disabled={submitting}
                      className="w-full rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                    >
                      {submitting ? "Removing..." : "Remove My Signup"}
                    </button>
                  ) : showSignupForm ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Your Name *</label>
                        <input
                          type="text"
                          value={signupData.name}
                          onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          placeholder="Enter your name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                          type="email"
                          value={signupData.email}
                          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          placeholder="your@email.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone</label>
                        <input
                          type="tel"
                          value={signupData.phone}
                          onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          placeholder="Your phone number"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSignup(selectedEvent.id)}
                          disabled={submitting || !signupData.name.trim()}
                          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          {submitting ? "Signing up..." : "Confirm Signup"}
                        </button>
                        <button
                          onClick={() => setShowSignupForm(false)}
                          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSignupForm(true)}
                      disabled={Boolean(selectedEvent.capacity && selectedEvent.signups?.length >= selectedEvent.capacity)}
                      className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      Sign Me Up
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => window.location.href = "/login"}
                    className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
                  >
                    Log in to Sign Up
                  </button>
                )}
                {canCreate && (
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="w-full mt-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                  >
                    Delete Event
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Event Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create New Event</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Event Title *</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Event name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Event location"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Capacity (optional)</label>
                  <input
                    type="number"
                    value={newEvent.capacity}
                    onChange={(e) => setNewEvent({ ...newEvent, capacity: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Max signups"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
                    placeholder="Event details..."
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={submitting || !newEvent.title || !newEvent.date}
                    className="flex-1 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Create Event"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Export to Google Calendar */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={exportToGoogleCalendar}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Export to Google Calendar
          </button>
        </div>
      </div>
    </div>
  );
}
