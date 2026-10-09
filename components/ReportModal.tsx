"use client";

import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

interface ReportModalProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportModal({ eventId, eventTitle, isOpen, onClose }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, reason }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Report submitted successfully.");
        setReason("");
        onClose();
      } else {
        alert(data.error || "Failed to submit report");
      }
    } catch (err) {
      alert("Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-uwc-cardDark w-full max-w-md rounded-2xl p-5 shadow-2xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
            <AlertTriangle className="w-5 h-5" />
            <h3>Report Event</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Reporting <span className="font-semibold">"{eventTitle}"</span> to UWC campus moderators.
            Please describe why this content violates university guidelines.
          </p>

          <div>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Inappropriate content, misleading location, spam, policy violation..."
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-red-500 text-gray-900 dark:text-white"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
