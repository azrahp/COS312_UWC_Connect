"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { EventCard, EventCardProps } from "@/components/EventCard";
import { ArrowLeft } from "lucide-react";

export default function SingleEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventCardProps["event"] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      if (res.ok) {
        setEvent(data.event);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  if (loading) {
    return <div className="py-20 text-center text-sm text-gray-400">Loading event...</div>;
  }

  if (!event) {
    return (
      <div className="text-center py-20 bg-white dark:bg-uwc-cardDark rounded-3xl p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Event Not Found</h2>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-4 py-2 bg-uwc-blue text-white rounded-xl text-xs font-bold"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-uwc-blue dark:hover:text-uwc-gold py-1"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <EventCard event={event} onEventUpdated={fetchEvent} />
    </div>
  );
}
