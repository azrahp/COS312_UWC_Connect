"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/Providers";
import { EventCard, EventCardProps } from "@/components/EventCard";
import { Calendar, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function MyRsvpsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventCardProps["event"][]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyRsvps = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch feed or search filter with user's rsvpd events
      const res = await fetch("/api/events");
      const data = await res.json();
      const allEvents: EventCardProps["event"][] = data.events || [];
      const rsvpdOnly = allEvents.filter((e) => e.isRsvped);
      setEvents(rsvpdOnly);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyRsvps();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-uwc-cardDark rounded-3xl border border-gray-200 dark:border-gray-800 text-center space-y-4">
        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Sign In Required</h2>
        <p className="text-xs text-gray-500">Log in to view your scheduled RSVPs and upcoming events.</p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy font-bold text-xs rounded-xl"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-uwc-cardDark p-4 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white">My RSVPs</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Events you confirmed attendance for.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading your RSVPs...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-uwc-cardDark rounded-2xl border border-gray-200 dark:border-gray-800 max-w-xl mx-auto space-y-2">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="font-bold text-gray-700 dark:text-gray-200">No RSVPs confirmed yet</p>
          <p className="text-xs text-gray-500">Explore the feed and click "I'm Going" to save spots!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {events.map((event) => (
            <EventCard key={event.id} event={event} onEventUpdated={fetchMyRsvps} />
          ))}
        </div>
      )}
    </div>
  );
}
