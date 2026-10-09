"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./Providers";
import {
  Home,
  Compass,
  PlusSquare,
  Bell,
  User as UserIcon,
  LogOut,
  Sun,
  Moon,
  ShieldAlert,
  BookmarkCheck,
  Calendar,
  CalendarDays,
  Sparkles,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, theme, toggleTheme } = useAuth();
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

  const navItems = [
    { href: "/", label: "For You Feed", icon: Home },
    { href: "/search", label: "Discover & Filter", icon: Compass },
    { href: "/calendar", label: "Event Calendar", icon: CalendarDays },
    { href: "/create", label: "Create Event", icon: PlusSquare },
    { href: "/my-rsvps", label: "My RSVPs", icon: Calendar },
    { href: "/saved", label: "Saved Posts", icon: BookmarkCheck },
    { href: "/notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { href: user ? `/profile/${user.id}` : "/login", label: "Profile", icon: UserIcon },
  ];

  if (user?.role === "ADMIN") {
    navItems.push({ href: "/admin/moderation", label: "Moderation Queue", icon: ShieldAlert });
  }

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-uwc-cardDark h-screen sticky top-0 p-4 justify-between z-30 shadow-sm">
        <div className="space-y-6">
          {/* UWC Logo Brand */}
          <Link href="/" className="flex items-center gap-3 px-3 py-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-uwc-blue to-uwc-lightBlue text-uwc-gold flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              UWC
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-uwc-blue dark:text-white leading-tight">
                UWC Connect
              </h1>
              <p className="text-xs text-uwc-yellow dark:text-uwc-gold font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Campus Pulse
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-3 rounded-xl font-medium text-sm transition-colors ${
                    isActive
                      ? "bg-uwc-blue text-white shadow-sm font-semibold dark:bg-uwc-gold dark:text-uwc-navy"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 ? (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Theme Toggle */}
        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              {theme === "dark" ? <Sun className="w-4 h-4 text-uwc-gold" /> : <Moon className="w-4 h-4 text-uwc-blue" />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </div>
          </button>

          {user ? (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                  alt={user.name}
                  className="w-8 h-8 rounded-full bg-uwc-sky object-cover flex-shrink-0"
                />
                <div className="truncate">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">{user.role.toLowerCase()}</p>
                </div>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="w-full block text-center py-2.5 bg-uwc-blue hover:bg-uwc-navy text-white dark:bg-uwc-gold dark:text-uwc-navy font-bold rounded-xl text-sm transition-all shadow-md"
            >
              Log In / Sign Up
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
