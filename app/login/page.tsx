"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/Providers";
import { LogIn, UserPlus, Shield, Sparkles, Check } from "lucide-react";

const CATEGORIES = [
  { id: "workshops", label: "Workshops & Tech", icon: "💻" },
  { id: "talks", label: "Talks & Seminars", icon: "🎤" },
  { id: "sports", label: "Sports & Fitness", icon: "🏉" },
  { id: "careers", label: "Careers & Expos", icon: "💼" },
  { id: "internships", label: "Internships & Jobs", icon: "🚀" },
  { id: "society", label: "Societies & Clubs", icon: "🎨" },
  { id: "parties", label: "Parties & Socials", icon: "🎉" },
  { id: "fundraisers", label: "Charity & Drives", icon: "🤝" },
  { id: "other", label: "Wellness & Campus", icon: "✨" },
];

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [studentStaffNumber, setStudentStaffNumber] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("1");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>(["workshops", "talks"]);

  const toggleInterest = (id: string) => {
    if (interests.includes(id)) {
      setInterests(interests.filter((i) => i !== id));
    } else {
      setInterests([...interests, id]);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        router.push("/");
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (interests.length === 0) {
      setError("Please select at least 1 interest category.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          faculty,
          studentStaffNumber,
          yearOfStudy,
          bio,
          interests,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        router.push("/");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
    setMode("login");
  };

  return (
    <div className="max-w-md mx-auto my-6 p-6 bg-white dark:bg-uwc-cardDark rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-uwc-blue to-uwc-lightBlue text-uwc-gold mx-auto flex items-center justify-center font-black text-2xl shadow-lg">
          UWC
        </div>
        <h1 className="text-2xl font-black tracking-tight text-uwc-blue dark:text-white">
          Welcome to UWC Connect
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Discover, create, and engage with UWC campus life.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800/80 p-1 rounded-2xl">
        <button
          onClick={() => {
            setMode("login");
            setError(null);
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
            mode === "login"
              ? "bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy shadow-sm"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => {
            setMode("register");
            setError(null);
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
            mode === "register"
              ? "bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy shadow-sm"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          Register
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium rounded-xl">
          {error}
        </div>
      )}

      {mode === "login" ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              UWC Email Address
            </label>
            <input
              type="email"
              required
              placeholder="username@myuwc.ac.za or @uwc.ac.za"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-uwc-blue text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-uwc-blue text-gray-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-uwc-blue hover:bg-uwc-navy text-white dark:bg-uwc-gold dark:text-uwc-navy font-black text-sm rounded-xl shadow-lg transition-transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" /> {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Thabo Mokoena"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-uwc-blue text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              UWC Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="student@myuwc.ac.za or staff@uwc.ac.za"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-uwc-blue text-gray-900 dark:text-white"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              @myuwc.ac.za = Student Account | @uwc.ac.za = Staff/Admin Account
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-uwc-blue text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Faculty
              </label>
              <input
                type="text"
                placeholder="Natural Sciences"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:outline-none text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Student/Staff No.
              </label>
              <input
                type="text"
                placeholder="3981245"
                value={studentStaffNumber}
                onChange={(e) => setStudentStaffNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:outline-none text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Onboarding Interest Pickers */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-uwc-gold" /> Pick Interest Categories *
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              {CATEGORIES.map((cat) => {
                const isSelected = interests.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleInterest(cat.id)}
                    className={`p-2 rounded-lg text-[11px] font-semibold flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span>{cat.icon} {cat.label}</span>
                    {isSelected && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-uwc-blue hover:bg-uwc-navy text-white dark:bg-uwc-gold dark:text-uwc-navy font-black text-sm rounded-xl shadow-lg transition-transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> {loading ? "Creating Account..." : "Complete Registration"}
          </button>
        </form>
      )}

      {/* Quick Demo Credentials Bar */}
      <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
        <p className="text-[11px] font-bold text-center text-gray-400 uppercase tracking-wider">
          Quick Demo Login Buttons
        </p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          <button
            onClick={() => fillDemoAccount("thabo@myuwc.ac.za")}
            className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-lg hover:bg-blue-100"
          >
            🎓 Student (Thabo)
          </button>
          <button
            onClick={() => fillDemoAccount("prof.smith@uwc.ac.za")}
            className="px-2.5 py-1 text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded-lg hover:bg-purple-100"
          >
            👩‍🏫 Staff (Prof Smith)
          </button>
          <button
            onClick={() => fillDemoAccount("admin@uwc.ac.za")}
            className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 rounded-lg hover:bg-amber-100"
          >
            🛡️ Admin (Dean Van Wyk)
          </button>
        </div>
      </div>
    </div>
  );
}
