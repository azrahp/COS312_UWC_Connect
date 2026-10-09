"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/Providers";
import { Bell, CheckCheck, Sparkles, MessageCircle, Calendar, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchNotifications();
    else setLoading(false);
  }, [user]);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markSingleRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-uwc-cardDark rounded-3xl border border-gray-200 dark:border-gray-800 text-center space-y-4">
        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Sign In Required</h2>
        <p className="text-xs text-gray-500">Log in to view campus notifications and event alerts.</p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy font-bold text-xs rounded-xl"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "FOLLOW_POST":
        return <Sparkles className="w-5 h-5 text-uwc-gold" />;
      case "EVENT_REMINDER":
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case "COMMENT":
        return <MessageCircle className="w-5 h-5 text-purple-500" />;
      case "MODERATION":
        return <ShieldAlert className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-uwc-blue" />;
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="bg-white dark:bg-uwc-cardDark p-4 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-uwc-sky text-uwc-blue dark:bg-uwc-blue/40 dark:text-uwc-sky flex items-center justify-center font-bold">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Campus updates & event alerts.</p>
          </div>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={markAllRead}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-uwc-cardDark rounded-2xl border border-gray-200 dark:border-gray-800 max-w-xl mx-auto space-y-2">
          <Bell className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="font-bold text-gray-700 dark:text-gray-200">No notifications yet</p>
          <p className="text-xs text-gray-500">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => markSingleRead(item.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                !item.isRead
                  ? "bg-white dark:bg-uwc-cardDark border-uwc-blue/30 dark:border-uwc-gold/30 shadow-xs"
                  : "bg-gray-50/50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800/80 opacity-80"
              }`}
            >
              <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 flex-shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white leading-relaxed">
                  {item.message}
                </p>
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                  {item.linkUrl && (
                    <Link
                      href={item.linkUrl}
                      className="text-uwc-blue dark:text-uwc-gold font-bold hover:underline"
                    >
                      View Event →
                    </Link>
                  )}
                </div>
              </div>
              {!item.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-uwc-blue dark:bg-uwc-gold flex-shrink-0 mt-2"></span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
