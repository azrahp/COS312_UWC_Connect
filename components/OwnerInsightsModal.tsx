"use client";

import React, { useState, useEffect } from "react";
import { X, BarChart3, Eye, Heart, MessageCircle, Bookmark, Share2, Users, TrendingUp } from "lucide-react";

interface TimelinePoint {
  day: string;
  views: number;
  rsvps: number;
  likes: number;
}

interface InsightsData {
  eventId: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  rsvps: number;
  capacity?: number | null;
  capacityPercentage?: number | null;
  totalInteractions: number;
  timeline: TimelinePoint[];
}

interface OwnerInsightsModalProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function OwnerInsightsModal({ eventId, isOpen, onClose }: OwnerInsightsModalProps) {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && eventId) {
      setLoading(true);
      fetch(`/api/events/${eventId}/insights`)
        .then((res) => res.json())
        .then((data) => {
          setInsights(data.insights || null);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, eventId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-uwc-cardDark w-full max-w-xl rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 text-uwc-blue dark:text-uwc-gold font-bold text-lg">
            <BarChart3 className="w-5 h-5" />
            <h3>Event Owner Insights</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Loading engagement metrics...</div>
        ) : !insights ? (
          <div className="py-12 text-center text-sm text-gray-400">Unable to load insights</div>
        ) : (
          <div className="mt-4 space-y-6">
            <div>
              <h4 className="font-extrabold text-gray-900 dark:text-white text-base leading-tight">
                {insights.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                {insights.totalInteractions} total recorded campus interactions
              </p>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-center border border-blue-100 dark:border-blue-900/40">
                <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                <p className="text-lg font-black text-gray-900 dark:text-white">{insights.views}</p>
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Views</p>
              </div>

              <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl text-center border border-red-100 dark:border-red-900/40">
                <Heart className="w-4 h-4 text-red-500 mx-auto mb-1" />
                <p className="text-lg font-black text-gray-900 dark:text-white">{insights.likes}</p>
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Likes</p>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/40 rounded-xl text-center border border-green-100 dark:border-green-900/40">
                <Users className="w-4 h-4 text-green-600 dark:text-green-400 mx-auto mb-1" />
                <p className="text-lg font-black text-gray-900 dark:text-white">{insights.rsvps}</p>
                <p className="text-[10px] text-gray-500 uppercase font-semibold">RSVPs</p>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-center border border-purple-100 dark:border-purple-900/40">
                <MessageCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                <p className="text-lg font-black text-gray-900 dark:text-white">{insights.comments}</p>
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Comments</p>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-center border border-amber-100 dark:border-amber-900/40">
                <Bookmark className="w-4 h-4 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
                <p className="text-lg font-black text-gray-900 dark:text-white">{insights.saves}</p>
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Saves</p>
              </div>

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-center border border-indigo-100 dark:border-indigo-900/40">
                <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mx-auto mb-1" />
                <p className="text-lg font-black text-gray-900 dark:text-white">{insights.shares}</p>
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Shares</p>
              </div>
            </div>

            {/* Capacity Progress Bar */}
            {insights.capacity ? (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-gray-700 dark:text-gray-300">RSVP Capacity Filled</span>
                  <span className="text-uwc-blue dark:text-uwc-gold">
                    {insights.rsvps} / {insights.capacity} ({insights.capacityPercentage}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-uwc-blue to-uwc-gold transition-all duration-500"
                    style={{ width: `${insights.capacityPercentage}%` }}
                  ></div>
                </div>
              </div>
            ) : null}

            {/* Engagement Chart (Bar visualization) */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700">
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                7-Day Engagement Activity
              </h5>
              <div className="flex items-end justify-between h-36 gap-2 pt-4 px-2">
                {insights.timeline.map((t, idx) => {
                  const maxVal = Math.max(1, ...insights.timeline.map((x) => x.views + x.rsvps * 2));
                  const heightPercent = Math.min(100, Math.max(15, Math.round(((t.views + t.rsvps * 2) / maxVal) * 100)));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="w-full flex items-end justify-center h-28 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg p-1">
                        <div
                          className="w-full bg-gradient-to-t from-uwc-blue to-uwc-gold dark:from-uwc-gold dark:to-yellow-300 rounded-md transition-all duration-300 group-hover:brightness-110 relative flex items-center justify-center text-[9px] font-bold text-white dark:text-uwc-navy"
                          style={{ height: `${heightPercent}%` }}
                        >
                          {t.views + t.rsvps > 0 ? t.views + t.rsvps : ""}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{t.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
