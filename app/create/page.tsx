"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/Providers";
import { PlusCircle, Save, Calendar, MapPin, Image, Users, Link2, AlertCircle } from "lucide-react";

const CATEGORIES = [
  "talks",
  "society",
  "sports",
  "workshops",
  "internships",
  "fundraisers",
  "parties",
  "careers",
  "other",
];

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("workshops");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [capacity, setCapacity] = useState("");
  const [externalUrl, setExternalUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-uwc-cardDark rounded-3xl border border-gray-200 dark:border-gray-800 text-center space-y-4">
        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Sign In Required</h2>
        <p className="text-xs text-gray-500">You must be logged in to create or host campus events.</p>
        <button
          onClick={() => router.push("/login")}
          className="px-6 py-2.5 bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy font-bold text-xs rounded-xl"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  const handleSubmit = async (status: "PUBLISHED" | "DRAFT") => {
    setError(null);
    if (!title.trim() || !description.trim() || !location.trim() || !startsAt) {
      setError("Title, description, date/time, and location are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          location,
          startsAt,
          imageUrl,
          capacity,
          externalUrl,
          status,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/");
      } else {
        setError(data.error || "Failed to create event");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-4 p-6 bg-white dark:bg-uwc-cardDark rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-xl bg-uwc-blue dark:bg-uwc-gold text-white dark:text-uwc-navy flex items-center justify-center font-bold">
          <PlusCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-black text-gray-900 dark:text-white">Post New Campus Event</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Share talks, sports, workshops, or socials with UWC students & staff.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Event Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. UWC Hackathon 2026 or Varsity Cup Derby"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-uwc-blue text-gray-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-bold uppercase focus:outline-none text-gray-900 dark:text-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-uwc-gold" /> Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:outline-none text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-uwc-gold" /> Venue / Location *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Jakes Gerwel Hall, Computer Lab 3, or Student Centre Quad"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-uwc-blue text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Description *
          </label>
          <textarea
            required
            rows={4}
            placeholder="Describe the event, schedule, requirements, and who should attend..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-uwc-blue text-gray-900 dark:text-white"
          ></textarea>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-uwc-gold" /> RSVP Capacity (Optional)
            </label>
            <input
              type="number"
              placeholder="e.g. 50 (Leave blank for unlimited)"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:outline-none text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5 text-uwc-gold" /> External Link (Optional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:outline-none text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
            <Image className="w-3.5 h-3.5 text-uwc-gold" /> Image URL (Optional)
          </label>
          <input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-uwc-blue text-gray-900 dark:text-white"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => handleSubmit("DRAFT")}
            disabled={loading}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-4 h-4" /> Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSubmit("PUBLISHED")}
            disabled={loading}
            className="px-6 py-3 bg-uwc-blue hover:bg-uwc-navy text-white dark:bg-uwc-gold dark:text-uwc-navy font-black text-xs rounded-xl shadow-md transition-transform active:scale-98 flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> {loading ? "Publishing..." : "Publish Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
