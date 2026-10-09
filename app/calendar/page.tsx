"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/Providers";
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Bookmark,
  AlertCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types and constants                                                 */
/* ------------------------------------------------------------------ */

interface CalendarEvent {
  id: string;
  title: string;
  category: string;
  location: string;
  startsAt: string;
  capacity?: number | null;
  author: { id: string; name: string };
  rsvpCount: number;
  isRsvped: boolean;
  isSaved: boolean;
}

type Filter = "all" | "rsvp" | "saved";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const FILTERS: { value: Filter; label: string; needsLogin: boolean }[] = [
  { value: "all", label: "All events", needsLogin: false },
  { value: "rsvp", label: "Going", needsLogin: true },
  { value: "saved", label: "Saved", needsLogin: true },
];

// Full class names are listed so Tailwind can detect them at build time.
const CATEGORY_STYLES: Record<string, { label: string; dot: string; chip: string }> = {
  talks: {
    label: "Talks",
    dot: "bg-blue-500",
    chip: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  },
  society: {
    label: "Society",
    dot: "bg-purple-500",
    chip: "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200",
  },
  sports: {
    label: "Sports",
    dot: "bg-green-500",
    chip: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  },
  workshops: {
    label: "Workshops",
    dot: "bg-amber-500",
    chip: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  internships: {
    label: "Internships",
    dot: "bg-indigo-500",
    chip: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200",
  },
  fundraisers: {
    label: "Fundraisers",
    dot: "bg-pink-500",
    chip: "bg-pink-100 text-pink-900 dark:bg-pink-950 dark:text-pink-200",
  },
  parties: {
    label: "Parties",
    dot: "bg-rose-500",
    chip: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
  },
  careers: {
    label: "Careers",
    dot: "bg-teal-500",
    chip: "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200",
  },
  other: {
    label: "Other",
    dot: "bg-gray-500",
    chip: "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
};

function styleFor(category: string) {
  return CATEGORY_STYLES[category?.toLowerCase()] || CATEGORY_STYLES.other;
}

/* ------------------------------------------------------------------ */
/* Date helpers (all in the viewer's local time)                       */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, "0");

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Builds the 42 cells (6 weeks, Monday first) that cover a month. */
function buildGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const offset = (first.getDay() + 6) % 7; // Monday = 0
  const gridStart = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/* ------------------------------------------------------------------ */
/* .ics export ("Add to my calendar")                                  */
/* ------------------------------------------------------------------ */

function toIcsDate(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function downloadIcs(ev: CalendarEvent) {
  const start = new Date(ev.startsAt);
  // Events have no end time, so the exported entry lasts two hours.
  const end = new Date(start.getTime() + 2 * 3600 * 1000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UWC Connect//Events//EN",
    "BEGIN:VEVENT",
    `UID:${ev.id}@uwc-connect`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcs(ev.title)}`,
    `LOCATION:${escapeIcs(ev.location)}`,
    `DESCRIPTION:${escapeIcs(`Hosted by ${ev.author.name} on UWC Connect`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ev.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "event"}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth();

  // Dates are set after mount so the server and browser never disagree on "today".
  const [today, setToday] = useState<Date | null>(null);
  const [viewMonth, setViewMonth] = useState<Date | null>(null);
  const [selected, setSelected] = useState<Date | null>(null);

  const [filter, setFilter] = useState<Filter>("all");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);

  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    setToday(midnight);
    setViewMonth(startOfMonth(midnight));
    setSelected(midnight);
  }, []);

  // If the user logs out (or isn't logged in) while on a personal filter, reset it.
  useEffect(() => {
    if (!authLoading && !user && filter !== "all") {
      setFilter("all");
    }
  }, [authLoading, user, filter]);

  const grid = useMemo(() => (viewMonth ? buildGrid(viewMonth) : []), [viewMonth]);

  const loadEvents = useCallback(async () => {
    if (grid.length === 0) return;
    const myRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const from = grid[0];
      const to = addDays(grid[grid.length - 1], 1);
      const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
        filter,
      });
      const res = await fetch(`/api/calendar?${params.toString()}`);
      const data = await res.json();
      if (myRequest !== requestId.current) return; // a newer request replaced this one
      if (!res.ok) {
        throw new Error(data.error || "Could not load events.");
      }
      setEvents(data.events || []);
    } catch (err: any) {
      if (myRequest !== requestId.current) return;
      setEvents([]);
      setError(err.message || "Could not load events.");
    } finally {
      if (myRequest === requestId.current) setLoading(false);
    }
  }, [grid, filter]);

  useEffect(() => {
    loadEvents();
    // user id is included so the Going / Saved marks refresh after login or logout
  }, [loadEvents, user?.id]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const key = dateKey(new Date(ev.startsAt));
      const list = map.get(key);
      if (list) list.push(ev);
      else map.set(key, [ev]);
    }
    return map;
  }, [events]);

  const changeMonth = (delta: number) => {
    if (!viewMonth || !today) return;
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1);
    setViewMonth(next);
    setSelected(sameMonth(next, today) ? today : next);
  };

  const goToToday = () => {
    if (!today) return;
    setViewMonth(startOfMonth(today));
    setSelected(today);
  };

  const selectDay = (day: Date) => {
    setSelected(day);
    if (viewMonth && !sameMonth(day, viewMonth)) {
      setViewMonth(startOfMonth(day));
    }
  };

  if (!today || !viewMonth || !selected) {
    return <div className="py-20 text-center text-sm text-gray-400">Loading calendar...</div>;
  }

  const monthTitle = viewMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const selectedEvents = eventsByDay.get(dateKey(selected)) || [];
  const selectedTitle = selected.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-4 pt-3 md:pt-0">
      {/* Header + filter */}
      <div className="bg-white dark:bg-uwc-cardDark p-4 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-uwc-blue text-uwc-gold flex items-center justify-center">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white">Event calendar</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              See what is on across campus, day by day.
            </p>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Filter calendar events"
          className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 self-start sm:self-auto"
        >
          {FILTERS.map((f) => {
            const disabled = f.needsLogin && !user;
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                role="tab"
                aria-selected={active}
                disabled={disabled}
                title={disabled ? "Log in to use this filter" : undefined}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  active
                    ? "bg-white dark:bg-uwc-gold text-uwc-blue dark:text-uwc-navy shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-uwc-blue dark:hover:text-white"
                } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Month grid */}
      <div className="bg-white dark:bg-uwc-cardDark rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white" aria-live="polite">
            {monthTitle}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 mr-1 rounded-lg text-xs font-bold text-uwc-blue dark:text-uwc-gold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400"
            >
              {d}
            </div>
          ))}
        </div>

        <div className={`grid grid-cols-7 ${loading ? "opacity-60" : ""} transition-opacity`}>
          {grid.map((day, i) => {
            const key = dateKey(day);
            const dayEvents = eventsByDay.get(key) || [];
            const inMonth = sameMonth(day, viewMonth);
            const isToday = key === dateKey(today);
            const isSelected = key === dateKey(selected);
            const label = `${day.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}, ${dayEvents.length} ${dayEvents.length === 1 ? "event" : "events"}`;

            return (
              <button
                key={key}
                onClick={() => selectDay(day)}
                aria-label={label}
                aria-pressed={isSelected}
                className={`relative min-h-[3.75rem] sm:min-h-[6.5rem] p-1 sm:p-1.5 text-left flex flex-col items-center sm:items-stretch gap-1 border-gray-100 dark:border-gray-800 border-b ${
                  i % 7 !== 6 ? "border-r" : ""
                } ${inMonth ? "" : "bg-gray-50/70 dark:bg-gray-900/40"} ${
                  isSelected
                    ? "ring-2 ring-inset ring-uwc-blue dark:ring-uwc-gold z-10"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                } transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-uwc-lightBlue`}
              >
                <span
                  className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm font-bold ${
                    isToday
                      ? "bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy"
                      : inMonth
                      ? "text-gray-900 dark:text-gray-100"
                      : "text-gray-400 dark:text-gray-600"
                  }`}
                >
                  {day.getDate()}
                </span>

                {/* Phones: coloured dots */}
                {dayEvents.length > 0 && (
                  <div className="flex sm:hidden items-center gap-0.5 flex-wrap justify-center">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <span
                        key={ev.id}
                        className={`w-1.5 h-1.5 rounded-full ${styleFor(ev.category).dot}`}
                      />
                    ))}
                  </div>
                )}

                {/* Larger screens: event titles */}
                <div className="hidden sm:flex flex-col gap-0.5 min-w-0">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <span
                      key={ev.id}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-semibold truncate ${
                        styleFor(ev.category).chip
                      }`}
                    >
                      {ev.isRsvped && <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
                      <span className="truncate">{ev.title}</span>
                    </span>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="px-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      +{dayEvents.length - 2} more
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          {Object.entries(CATEGORY_STYLES).map(([key, s]) => (
            <span
              key={key}
              className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400"
            >
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-semibold"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </span>
          <button onClick={loadEvents} className="underline font-bold">
            Try again
          </button>
        </div>
      )}

      {/* Selected day agenda */}
      <section
        aria-label={`Events on ${selectedTitle}`}
        className="bg-white dark:bg-uwc-cardDark rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs p-4 space-y-3"
      >
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white">{selectedTitle}</h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {selectedEvents.length} {selectedEvents.length === 1 ? "event" : "events"}
          </span>
        </div>

        {selectedEvents.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="font-bold text-gray-700 dark:text-gray-200 text-sm">
              {loading ? "Loading events..." : "Nothing scheduled on this day"}
            </p>
            {!loading && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {filter === "all" ? (
                  <>
                    Hosting something?{" "}
                    <Link href="/create" className="font-bold text-uwc-blue dark:text-uwc-gold underline">
                      Create an event
                    </Link>
                  </>
                ) : (
                  "Try switching to All events to see everything on campus."
                )}
              </p>
            )}
          </div>
        ) : (
          <ul className="space-y-2.5">
            {selectedEvents.map((ev) => {
              const s = styleFor(ev.category);
              const full = ev.capacity != null && ev.rsvpCount >= ev.capacity;
              return (
                <li
                  key={ev.id}
                  className="flex gap-3 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40"
                >
                  <div className="w-14 flex-shrink-0 text-sm font-black text-uwc-blue dark:text-uwc-gold pt-0.5">
                    {formatTime(ev.startsAt)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <Link
                      href={`/events/${ev.id}`}
                      className="block font-bold text-sm text-gray-900 dark:text-white hover:text-uwc-blue dark:hover:text-uwc-gold"
                    >
                      {ev.title}
                    </Link>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-600 dark:text-gray-400">
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${s.chip}`}>{s.label}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {ev.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {ev.capacity != null
                          ? `${ev.rsvpCount}/${ev.capacity} going${full ? " (full)" : ""}`
                          : `${ev.rsvpCount} going`}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="text-gray-500 dark:text-gray-400">by {ev.author.name}</span>
                      {ev.isRsvped && (
                        <span className="flex items-center gap-1 font-bold text-green-700 dark:text-green-300">
                          <CheckCircle2 className="w-3 h-3" /> You are going
                        </span>
                      )}
                      {ev.isSaved && (
                        <span className="flex items-center gap-1 font-bold text-uwc-blue dark:text-uwc-gold">
                          <Bookmark className="w-3 h-3" /> Saved
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => downloadIcs(ev)}
                    title="Add to my phone or Google Calendar"
                    aria-label={`Add ${ev.title} to my calendar`}
                    className="self-start p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-uwc-blue dark:hover:text-uwc-gold hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  >
                    <CalendarPlus className="w-5 h-5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
