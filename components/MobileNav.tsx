"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./Providers";
import { Home, Compass, PlusCircle, Bell, User as UserIcon, Sun, Moon, CalendarDays } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();
  const { user, theme, toggleTheme } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => {
          if (data.unreadCount !== undefined) {
            setUnreadCount(data.unreadCount);
          }
        })
        .catch(() => {});
    }
  }, [user, pathname]);

  const tabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Compass },
    { href: "/create", label: "Create", icon: PlusCircle, highlight: true },
    { href: "/notifications", label: "Alerts", icon: Bell, badge: unreadCount },
    { href: user ? `/profile/${user.id}` : "/login", label: "Profile", icon: UserIcon },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-uwc-cardDark/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-xs">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-uwc-blue text-uwc-gold flex items-center justify-center font-black text-sm shadow-xs">
            UWC
          </div>
          <span className="font-extrabold text-base tracking-tight text-uwc-blue dark:text-white">
            UWC Connect
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/calendar"
            aria-label="Event calendar"
            title="Event calendar"
            className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors ${
              pathname === "/calendar" ? "text-uwc-blue dark:text-uwc-gold" : "text-gray-600 dark:text-gray-300"
            }`}
          >
            <CalendarDays className="w-5 h-5" />
          </Link>
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-uwc-gold" /> : <Moon className="w-5 h-5 text-uwc-blue" />}
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-uwc-cardDark border-t border-gray-200 dark:border-gray-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          if (tab.highlight) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center p-1"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-uwc-blue to-uwc-lightBlue text-uwc-gold dark:from-uwc-gold dark:to-uwc-yellow dark:text-uwc-navy flex items-center justify-center shadow-md -mt-4 active:scale-95 transition-transform">
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold text-uwc-blue dark:text-uwc-gold mt-1">
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
                isActive ? "text-uwc-blue dark:text-uwc-gold" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
              <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"} mt-0.5`}>
                {tab.label}
              </span>
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute top-0 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
                  {tab.badge > 9 ? "9+" : tab.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
