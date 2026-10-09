"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/Providers";
import { EventCard, EventCardProps } from "@/components/EventCard";
import {
  UserCheck,
  UserPlus,
  CheckCircle2,
  Calendar,
  Grid,
  List,
  Edit,
  LogOut,
  Sparkles,
} from "lucide-react";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  bio?: string | null;
  role: string;
  faculty?: string | null;
  yearOfStudy?: number | null;
  studentStaffNumber?: string | null;
  interests: string[];
  isSelf: boolean;
  isFollowing: boolean;
  eventsCount: number;
  followersCount: number;
  followingCount: number;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, logout } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [events, setEvents] = useState<EventCardProps["event"][]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const profileId = params.id as string;

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${profileId}/profile`);
      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
        setEvents(data.events || []);
        setIsFollowing(data.profile.isFollowing);
        setFollowersCount(data.profile.followersCount);
      }
    } catch (err) {
      console.error("Profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileId) {
      fetchProfile();
    }
  }, [profileId]);

  const handleFollowToggle = async () => {
    if (!currentUser) return router.push("/login");
    if (!profile) return;

    try {
      const res = await fetch(`/api/users/${profile.id}/follow`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.followersCount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-gray-400">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="text-center py-20 bg-white dark:bg-uwc-cardDark rounded-3xl p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">User Profile Not Found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Instagram-Style Profile Header Card */}
      <div className="bg-white dark:bg-uwc-cardDark p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <img
              src={profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`}
              alt={profile.name}
              className="w-20 h-20 rounded-full object-cover bg-uwc-sky border-2 border-uwc-blue dark:border-uwc-gold shadow-md"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                  {profile.name}
                </h1>
                <CheckCircle2 className="w-4 h-4 text-uwc-blue dark:text-uwc-gold fill-uwc-blue/10" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {profile.email}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-uwc-sky dark:bg-uwc-blue/40 text-uwc-blue dark:text-uwc-sky">
                  {profile.role}
                </span>
                {profile.faculty && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    {profile.faculty}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-around py-3 border-y border-gray-100 dark:border-gray-800 text-center">
          <div>
            <p className="text-base font-black text-gray-900 dark:text-white">{events.length}</p>
            <p className="text-[10px] font-bold uppercase text-gray-500">Events</p>
          </div>
          <div>
            <p className="text-base font-black text-gray-900 dark:text-white">{followersCount}</p>
            <p className="text-[10px] font-bold uppercase text-gray-500">Followers</p>
          </div>
          <div>
            <p className="text-base font-black text-gray-900 dark:text-white">{profile.followingCount}</p>
            <p className="text-[10px] font-bold uppercase text-gray-500">Following</p>
          </div>
        </div>

        {/* Bio & Details */}
        {profile.bio && (
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {profile.bio}
          </p>
        )}

        {/* Interests Tags */}
        {profile.interests.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-uwc-gold" /> Interests:
            </span>
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                {interest}
              </span>
            ))}
          </div>
        )}

        {/* Action Button Row */}
        <div className="flex items-center gap-2 pt-2">
          {profile.isSelf ? (
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => router.push("/create")}
                className="flex-1 py-2.5 bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy font-bold text-xs rounded-xl shadow-xs text-center"
              >
                + Create New Event
              </button>
              <button
                onClick={logout}
                className="px-4 py-2.5 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-300 font-bold text-xs rounded-xl flex items-center gap-1 hover:bg-red-100"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleFollowToggle}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                isFollowing
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200"
                  : "bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy shadow-md hover:scale-102"
              }`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-4 h-4" /> Following Host
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Follow Host
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Events View Toggle & Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-uwc-gold" /> Hosted Events ({events.length})
        </h3>
        <div className="flex items-center bg-white dark:bg-uwc-cardDark p-1 rounded-xl border border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg ${viewMode === "list" ? "bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy" : "text-gray-400"}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg ${viewMode === "grid" ? "bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy" : "text-gray-400"}`}
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hosted Events List or Grid */}
      {events.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-uwc-cardDark rounded-2xl border border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500">No events posted by this user yet.</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-5">
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} onEventUpdated={fetchProfile} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {events.map((ev) => (
            <div
              key={ev.id}
              onClick={() => router.push(`/events/${ev.id}`)}
              className="bg-white dark:bg-uwc-cardDark rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
            >
              <div className="aspect-square bg-gray-900 relative">
                {ev.imageUrl ? (
                  <img src={ev.imageUrl} alt={ev.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-uwc-blue to-uwc-navy p-3 flex items-center justify-center text-white font-black text-xs text-center">
                    {ev.title}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-extrabold text-xs">
                  {ev._count?.rsvps || 0} RSVPs
                </div>
              </div>
              <div className="p-2.5">
                <p className="font-bold text-xs text-gray-900 dark:text-white truncate">{ev.title}</p>
                <p className="text-[10px] text-gray-500 uppercase font-semibold">{ev.category}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
