"use client";

import React, { useState, useEffect } from "react";
import { X, Users, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Attendee {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  faculty?: string | null;
}

interface AttendeeModalProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AttendeeModal({ eventId, eventTitle, isOpen, onClose }: AttendeeModalProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && eventId) {
      setLoading(true);
      fetch(`/api/events/${eventId}/rsvp`)
        .then((res) => res.json())
        .then((data) => {
          setAttendees(data.attendees || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, eventId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-uwc-cardDark w-full max-w-md rounded-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-uwc-blue dark:text-uwc-gold" />
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Attendees</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                {eventTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-sm text-gray-400">Loading attendee list...</div>
          ) : attendees.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No RSVPs yet. Be the first!</div>
          ) : (
            attendees.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                    alt={user.name}
                    className="w-10 h-10 rounded-full bg-uwc-sky object-cover"
                  />
                  <div>
                    <Link
                      href={`/profile/${user.id}`}
                      className="font-bold text-sm text-gray-900 dark:text-white hover:underline flex items-center gap-1.5"
                    >
                      {user.name}
                      <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.faculty || user.role}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full">
                  Going
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
