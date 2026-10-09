"use client";

import React, { useState, useEffect } from "react";
import { X, Send, Trash2, MessageCircle } from "lucide-react";
import { useAuth } from "./Providers";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    role: string;
  };
}

interface CommentModalProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
}

export function CommentModal({ eventId, eventTitle, isOpen, onClose, onCommentAdded }: CommentModalProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && eventId) {
      fetchComments();
    }
  }, [isOpen, eventId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/comments`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      const data = await res.json();
      if (res.ok) {
        setNewComment("");
        fetchComments();
        if (onCommentAdded) onCommentAdded();
      } else {
        alert(data.error || "Failed to post comment");
      }
    } catch (err) {
      alert("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await fetch(`/api/events/${eventId}/comments?commentId=${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchComments();
        if (onCommentAdded) onCommentAdded();
      }
    } catch (err) {
      alert("Failed to delete comment");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-uwc-cardDark w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-uwc-blue dark:text-uwc-gold" />
            <h3 className="font-bold text-gray-900 dark:text-white truncate max-w-[240px] sm:max-w-xs">
              Comments on {eventTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-sm text-gray-400">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              <p className="font-medium text-gray-600 dark:text-gray-300">No comments yet</p>
              <p className="text-xs">Be the first to start the conversation!</p>
            </div>
          ) : (
            comments.map((comment) => {
              const canDelete =
                user && (user.id === comment.userId || user.role === "ADMIN");
              return (
                <div key={comment.id} className="flex gap-3 text-sm group">
                  <img
                    src={comment.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user.name}`}
                    alt={comment.user.name}
                    className="w-8 h-8 rounded-full bg-uwc-sky object-cover flex-shrink-0"
                  />
                  <div className="flex-1 bg-gray-50 dark:bg-gray-800/70 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white text-xs">
                          {comment.user.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase font-semibold">
                          {comment.user.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 text-xs sm:text-sm leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity self-center"
                      title="Delete comment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Input box */}
        <form onSubmit={handlePostComment} className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-uwc-cardDark flex items-center gap-2">
          <input
            type="text"
            placeholder={user ? "Add a comment..." : "Log in to comment"}
            disabled={!user || submitting}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-uwc-blue dark:focus:border-uwc-gold text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={!user || !newComment.trim() || submitting}
            className="p-2.5 bg-uwc-blue dark:bg-uwc-gold text-white dark:text-uwc-navy rounded-full disabled:opacity-50 hover:scale-105 active:scale-95 transition-transform"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
