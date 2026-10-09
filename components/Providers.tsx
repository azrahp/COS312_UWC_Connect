"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "STAFF" | "ADMIN";
  avatarUrl?: string | null;
  bio?: string | null;
  faculty?: string | null;
  yearOfStudy?: number | null;
  interests?: string[];
  status?: "ACTIVE" | "SUSPENDED";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  logout: async () => {},
  theme: "light",
  toggleTheme: () => {},
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/login";
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("uwc_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("uwc_theme", "light");
    }
  };

  useEffect(() => {
    refreshUser();
    const saved = localStorage.getItem("uwc_theme") as "light" | "dark" | null;
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout, theme, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
