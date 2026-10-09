"use client";

import React, { useState, useEffect } from "react";
import { EventCard, EventCardProps } from "@/components/EventCard";
import { Search, Filter, Calendar, BookmarkCheck, Sparkles, X } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "workshops", label: "Workshops" },
  { id: "talks", label: "Talks" },
  { id: "sports", label: "Sports" },
  { id: "careers", label: "Careers" },
  { id: "internships", label: "Internships" },
  { id: "society", label: "Societies" },
  { id: "parties", label: "Parties" },
  { id: "fundraisers", label: "Fundraisers" },
  { id: "other", label: "Other" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "this-week" | "saved">("all");

  const [events, setEvents] = useState<EventCardProps["event"][]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSearchEvents = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/events", window.location.origin);
      if (query.trim()) url.searchParams.set("query", query.trim());
      if (selectedCategory !== "all") url.searchParams.set("category", selectedCategory);
      if (timeFilter !== "all") url.searchParams.set("timeFilter", timeFilter);

      const res = await fetch(url.toString());
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSearchEvents();
    }, 300);
    return () => clearTimeout(timer);
  }, [query, selectedCategory, timeFilter]);

  return (
    <div className="space-y-4">
      {/* Search Header Bar */}
      <div className="bg-white dark:bg-uwc-cardDark p-4 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search campus events, talks, workshops, sports..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-uwc-blue text-gray-900 dark:text-white"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Time Window Toggles */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setTimeFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeFilter === "all"
                ? "bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
            }`}
          >
            All Upcoming
          </button>
          <button
            onClick={() => setTimeFilter("today")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              timeFilter === "today"
                ? "bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Today
          </button>
          <button
            onClick={() => setTimeFilter("this-week")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              timeFilter === "this-week"
                ? "bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> This Week
          </button>
          <button
            onClick={() => setTimeFilter("saved")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              timeFilter === "saved"
                ? "bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" /> Saved
          </button>
        </div>

        {/* Category Chips Horizontal Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-gray-100 dark:border-gray-800">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-uwc-sky text-uwc-blue dark:bg-uwc-blue dark:text-white font-bold ring-1 ring-uwc-blue"
                  : "bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 hover:bg-gray-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results List */}
      {loading ? (
        <div className="text-center py-12 text-sm text-gray-400">Searching events...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-uwc-cardDark rounded-2xl border border-gray-200 dark:border-gray-800 max-w-xl mx-auto space-y-2">
          <p className="font-bold text-gray-700 dark:text-gray-200">No events matched your search filters</p>
          <p className="text-xs text-gray-500">Try changing keywords or selecting "All Categories".</p>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 px-1">
            Found {events.length} event{events.length === 1 ? "" : "s"}
          </p>
          {events.map((event) => (
            <EventCard key={event.id} event={event} onEventUpdated={fetchSearchEvents} />
          ))}
        </div>
      )}
    </div>
  );
}
