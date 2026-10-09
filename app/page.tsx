"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/Providers";
import { EventCard, EventCardProps } from "@/components/EventCard";
import { OnboardingModal } from "@/components/OnboardingModal";
import { Sparkles, Users, Loader2, RefreshCw } from "lucide-react";

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"for-you" | "following">("for-you");
  const [events, setEvents] = useState<EventCardProps["event"][]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if logged-in user needs interest onboarding
  useEffect(() => {
    if (user && Array.isArray(user.interests) && user.interests.length === 0) {
      setShowOnboarding(true);
    }
  }, [user]);

  const fetchFeed = async (activeTab = tab, reset = true, cursorParam?: string) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      const url = new URL("/api/feed", window.location.origin);
      url.searchParams.set("tab", activeTab);
      url.searchParams.set("limit", "6");
      if (cursorParam) url.searchParams.set("cursor", cursorParam);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (reset) {
        setEvents(data.events || []);
      } else {
        setEvents((prev) => [...prev, ...(data.events || [])]);
      }
      setNextCursor(data.nextCursor || null);
    } catch (err) {
      console.error("Feed error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFeed(tab, true);
  }, [tab]);

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      fetchFeed(tab, false, nextCursor);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Tab Switcher Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-uwc-cardDark p-1.5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
        <div className="flex items-center gap-1 w-full">
          <button
            onClick={() => setTab("for-you")}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
              tab === "for-you"
                ? "bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Sparkles className="w-4 h-4" /> For You
          </button>
          <button
            onClick={() => setTab("following")}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
              tab === "following"
                ? "bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Users className="w-4 h-4" /> Following
          </button>
        </div>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-uwc-cardDark rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-4 animate-pulse max-w-xl mx-auto"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
                </div>
              </div>
              <div className="h-44 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-uwc-cardDark rounded-2xl border border-gray-200 dark:border-gray-800 max-w-xl mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-uwc-sky text-uwc-blue mx-auto flex items-center justify-center font-bold text-xl">
            ✨
          </div>
          <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
            {tab === "following" ? "No posts from hosts you follow yet" : "No events found"}
          </h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            {tab === "following"
              ? "Follow campus organizers and student societies to see their posts here."
              : "Check back soon or discover upcoming events in the Search tab."}
          </p>
          <button
            onClick={() => fetchFeed(tab, true)}
            className="px-4 py-2 bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Feed
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {events.map((event) => (
            <EventCard key={event.id} event={event} onEventUpdated={() => fetchFeed(tab, true)} />
          ))}

          {/* Load More Pagination Button */}
          {nextCursor && (
            <div className="text-center pt-2 pb-6">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-white dark:bg-uwc-cardDark border border-gray-200 dark:border-gray-800 hover:bg-gray-100 text-gray-800 dark:text-white text-xs font-bold rounded-full shadow-xs transition-all inline-flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-uwc-blue dark:text-uwc-gold" /> Loading more...
                  </>
                ) : (
                  "Load More Events"
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Onboarding interest selector for new users */}
      <OnboardingModal
        isOpen={showOnboarding}
        initialInterests={user?.interests || []}
        onComplete={() => {
          setShowOnboarding(false);
          fetchFeed("for-you", true);
        }}
      />
    </div>
  );
}
