"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "./Providers";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Calendar,
  MapPin,
  Users,
  ExternalLink,
  Sparkles,
  MoreVertical,
  Flag,
  BarChart3,
  CheckCircle2,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { CommentModal } from "./CommentModal";
import { AttendeeModal } from "./AttendeeModal";
import { ReportModal } from "./ReportModal";
import { OwnerInsightsModal } from "./OwnerInsightsModal";

export interface EventCardProps {
  event: {
    id: string;
    authorId: string;
    title: string;
    description: string;
    category: string;
    location: string;
    startsAt: string;
    imageUrl?: string | null;
    capacity?: number | null;
    externalUrl?: string | null;
    status: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string | null;
      role?: string;
      faculty?: string | null;
      status?: string;
    };
    _count: {
      likes: number;
      rsvps: number;
      comments: number;
      shares?: number;
      saves?: number;
    };
    isRsvped?: boolean;
    isLiked?: boolean;
    isSaved?: boolean;
    isFollowing?: boolean;
    reason?: string;
    rsvps?: Array<{ user: { id: string; name: string; avatarUrl?: string | null } }>;
  };
  onEventUpdated?: () => void;
}

export function EventCard({ event, onEventUpdated }: EventCardProps) {
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);

  // Optimistic UI state
  const [isLiked, setIsLiked] = useState(event.isLiked || false);
  const [likesCount, setLikesCount] = useState(event._count.likes || 0);

  const [isSaved, setIsSaved] = useState(event.isSaved || false);
  const [savesCount, setSavesCount] = useState(event._count.saves || 0);

  const [isRsvped, setIsRsvped] = useState(event.isRsvped || false);
  const [rsvpCount, setRsvpCount] = useState(event._count.rsvps || 0);

  const [commentsCount, setCommentsCount] = useState(event._count.comments || 0);
  const [shareCount, setShareCount] = useState(event._count.shares || 0);

  const [isFollowing, setIsFollowing] = useState(event.isFollowing || false);
  const [followingLoading, setFollowingLoading] = useState(false);

  // Modals state
  const [showComments, setShowComments] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // RSVP Capacity calculations
  const spotsLeft = event.capacity ? Math.max(0, event.capacity - rsvpCount) : null;
  const isFull = event.capacity ? rsvpCount >= event.capacity : false;

  // View tracking observer (2 seconds visibility)
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            timer = setTimeout(() => {
              fetch("/api/interactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId: event.id, type: "VIEW" }),
              }).catch(() => {});
            }, 2000); // 2 second view delay
          } else {
            clearTimeout(timer);
          }
        });
      },
      { threshold: 0.6 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [event.id]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Like action handler
  const handleLike = async () => {
    if (!user) return alert("Please log in to like posts.");

    const prevLiked = isLiked;
    const prevCount = likesCount;

    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const res = await fetch(`/api/events/${event.id}/like`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setIsLiked(data.isLiked);
        setLikesCount(data.likesCount);
      } else {
        setIsLiked(prevLiked);
        setLikesCount(prevCount);
      }
    } catch {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    }
  };

  // Save action handler
  const handleSave = async () => {
    if (!user) return alert("Please log in to save events.");

    const prevSaved = isSaved;
    setIsSaved(!prevSaved);

    try {
      const res = await fetch(`/api/events/${event.id}/save`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setIsSaved(data.isSaved);
        triggerToast(data.message);
      } else {
        setIsSaved(prevSaved);
      }
    } catch {
      setIsSaved(prevSaved);
    }
  };

  // RSVP action handler
  const handleRsvp = async () => {
    if (!user) return alert("Please log in to RSVP.");

    if (!isRsvped && isFull) {
      alert("Sorry! Event RSVP capacity has been reached.");
      return;
    }

    const prevRsvped = isRsvped;
    const prevCount = rsvpCount;

    setIsRsvped(!prevRsvped);
    setRsvpCount(prevRsvped ? prevCount - 1 : prevCount + 1);

    try {
      const res = await fetch(`/api/events/${event.id}/rsvp`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setIsRsvped(data.isRsvped);
        setRsvpCount(data.rsvpCount);
        triggerToast(data.message);
      } else {
        setIsRsvped(prevRsvped);
        setRsvpCount(prevCount);
        alert(data.error || "RSVP failed");
      }
    } catch {
      setIsRsvped(prevRsvped);
      setRsvpCount(prevCount);
    }
  };

  // Share action handler
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/events/${event.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out ${event.title} on UWC Connect!`,
          url: shareUrl,
        });
        fetch(`/api/events/${event.id}/share`, {
          method: "POST",
          body: JSON.stringify({ platform: "native_share" }),
        }).catch(() => {});
        setShareCount((prev) => prev + 1);
        return;
      } catch (err) {}
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      fetch(`/api/events/${event.id}/share`, {
        method: "POST",
        body: JSON.stringify({ platform: "clipboard" }),
      }).catch(() => {});
      setShareCount((prev) => prev + 1);
      triggerToast("Event link copied to clipboard! 📋");
    } catch (err) {
      triggerToast("Failed to copy link");
    }
  };

  // Follow author action handler
  const handleFollowToggle = async () => {
    if (!user) return alert("Please log in to follow hosts.");
    if (user.id === event.authorId) return;

    setFollowingLoading(true);
    try {
      const res = await fetch(`/api/users/${event.authorId}/follow`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(data.isFollowing);
        triggerToast(data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFollowingLoading(false);
    }
  };

  const isOwner = user?.id === event.authorId;
  const eventDate = new Date(event.startsAt);
  const formattedDate = eventDate.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <div
        ref={cardRef}
        className="bg-white dark:bg-uwc-cardDark rounded-2xl border border-gray-200 dark:border-gray-800/80 shadow-xs hover:shadow-md transition-shadow overflow-hidden mb-5 max-w-xl mx-auto relative group"
      >
        {/* Toast alert overlay */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-uwc-navy text-uwc-gold dark:bg-uwc-gold dark:text-uwc-navy font-bold text-xs px-4 py-2 rounded-full shadow-lg border border-uwc-gold/30 animate-in fade-in duration-200">
            {toastMessage}
          </div>
        )}

        {/* Reason Badge ("Why am I seeing this?") */}
        {event.reason && (
          <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-1.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5 text-uwc-blue dark:text-uwc-gold">
              <Sparkles className="w-3 h-3" /> {event.reason}
            </span>
            <span className="uppercase text-[9px] tracking-wider bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
              For You
            </span>
          </div>
        )}

        {/* Card Header: Author info & Follow button */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${event.author.id}`} className="relative">
              <img
                src={event.author.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.author.name}`}
                alt={event.author.name}
                className="w-10 h-10 rounded-full object-cover bg-uwc-sky border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform"
              />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/profile/${event.author.id}`}
                  className="font-bold text-sm text-gray-900 dark:text-white hover:underline flex items-center gap-1"
                >
                  {event.author.name}
                  <CheckCircle2 className="w-3.5 h-3.5 text-uwc-blue dark:text-uwc-gold fill-uwc-blue/10" />
                </Link>
                {event.author.role && (
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-uwc-sky dark:bg-uwc-blue/40 text-uwc-blue dark:text-uwc-sky">
                    {event.author.role}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[180px] sm:max-w-xs">
                {event.author.faculty || event.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Follow Button */}
            {user && !isOwner && (
              <button
                onClick={handleFollowToggle}
                disabled={followingLoading}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                  isFollowing
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                    : "bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy hover:scale-105"
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-3 h-3" /> Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3 h-3" /> Follow
                  </>
                )}
              </button>
            )}

            {/* Menu options */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 z-20 w-44 bg-white dark:bg-uwc-cardDark border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl py-1 text-xs font-semibold">
                  {(isOwner || user?.role === "ADMIN") && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowInsights(true);
                      }}
                      className="w-full text-left px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4 text-uwc-blue dark:text-uwc-gold" /> Owner Insights
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowReport(true);
                    }}
                    className="w-full text-left px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
                  >
                    <Flag className="w-4 h-4" /> Report Event
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hero Image */}
        {event.imageUrl ? (
          <div className="relative aspect-video w-full bg-gray-900 overflow-hidden">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase font-black px-2.5 py-1 rounded-full border border-white/20">
              {event.category}
            </div>
          </div>
        ) : (
          <div className="h-28 bg-gradient-to-r from-uwc-blue to-uwc-navy p-4 flex flex-col justify-between text-white relative">
            <span className="uppercase text-[10px] font-black px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-xs w-fit">
              {event.category}
            </span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 space-y-3">
          {/* Chips line */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
            <span className="flex items-center gap-1 bg-uwc-sky/70 dark:bg-uwc-blue/30 text-uwc-blue dark:text-uwc-sky px-2.5 py-1 rounded-lg">
              <Calendar className="w-3.5 h-3.5" /> {formattedDate}
            </span>
            <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-lg truncate max-w-[200px]">
              <MapPin className="w-3.5 h-3.5 text-uwc-gold" /> {event.location}
            </span>
          </div>

          <h3 className="text-lg font-black text-gray-900 dark:text-white leading-snug">
            {event.title}
          </h3>

          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line line-clamp-3">
            {event.description}
          </p>

          {/* External Link */}
          {event.externalUrl && (
            <a
              href={event.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-uwc-blue dark:text-uwc-gold hover:underline mt-1"
            >
              Official Link <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {/* RSVP Banner */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/80 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                  {rsvpCount} Going
                </span>
                {spotsLeft !== null && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isFull
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                    }`}
                  >
                    {isFull ? "FULL CAPACITY" : `${spotsLeft} spots left`}
                  </span>
                )}
              </div>

              {/* Attendee Avatar Stack */}
              <button
                onClick={() => setShowAttendees(true)}
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:underline mt-1"
              >
                <div className="flex -space-x-1.5 overflow-hidden">
                  {[1, 2, 3].map((idx) => (
                    <img
                      key={idx}
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Attendee${event.id}${idx}`}
                      alt="Attendee"
                      className="inline-block h-5 w-5 rounded-full ring-1 ring-white dark:ring-uwc-cardDark object-cover"
                    />
                  ))}
                </div>
                <span className="text-[11px] font-medium ml-1">View attendees list</span>
              </button>
            </div>

            {/* RSVP Button */}
            <button
              onClick={handleRsvp}
              disabled={!isRsvped && isFull}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 ${
                isRsvped
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : isFull
                  ? "bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
                  : "bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy hover:scale-102 active:scale-95"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              {isRsvped ? "I'm Going ✓" : isFull ? "Full" : "I'm Going"}
            </button>
          </div>

          {/* Social Interaction Bar */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-4">
              {/* Like */}
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                  isLiked ? "text-red-500" : "hover:text-red-500"
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500 stroke-red-500" : ""}`} />
                <span>{likesCount}</span>
              </button>

              {/* Comment */}
              <button
                onClick={() => setShowComments(true)}
                className="flex items-center gap-1.5 text-xs font-bold hover:text-uwc-blue dark:hover:text-uwc-gold transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{commentsCount}</span>
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs font-bold hover:text-uwc-blue dark:hover:text-uwc-gold transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span>{shareCount}</span>
              </button>
            </div>

            {/* Save / Bookmark */}
            <button
              onClick={handleSave}
              className={`p-1.5 rounded-lg transition-colors ${
                isSaved
                  ? "text-uwc-gold dark:text-uwc-gold fill-uwc-gold"
                  : "hover:text-uwc-gold"
              }`}
              title="Save Event"
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? "fill-uwc-gold stroke-uwc-gold" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Dialog Modals */}
      <CommentModal
        eventId={event.id}
        eventTitle={event.title}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        onCommentAdded={() => setCommentsCount((prev) => prev + 1)}
      />

      <AttendeeModal
        eventId={event.id}
        eventTitle={event.title}
        isOpen={showAttendees}
        onClose={() => setShowAttendees(false)}
      />

      <ReportModal
        eventId={event.id}
        eventTitle={event.title}
        isOpen={showReport}
        onClose={() => setShowReport(false)}
      />

      <OwnerInsightsModal
        eventId={event.id}
        isOpen={showInsights}
        onClose={() => setShowInsights(false)}
      />
    </>
  );
}
