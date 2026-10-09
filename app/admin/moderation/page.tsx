"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/Providers";
import { ShieldAlert, Trash2, CheckCircle, UserX, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ReportItem {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  event: {
    id: string;
    title: string;
    category: string;
    status: string;
    author: {
      id: string;
      name: string;
      email: string;
      status: string;
    };
  };
  reporter: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminModerationPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchReports();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleAction = async (reportId: string, action: "REMOVE_POST" | "DISMISS_REPORT" | "SUSPEND_ACCOUNT") => {
    if (!confirm(`Are you sure you want to perform action: ${action}?`)) return;

    setActionLoading(reportId);
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchReports();
      } else {
        alert(data.error || "Action failed");
      }
    } catch {
      alert("Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-uwc-cardDark rounded-3xl border border-gray-200 dark:border-gray-800 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Admin Access Restricted</h2>
        <p className="text-xs text-gray-500">Only UWC Campus Moderation Admins can access this queue.</p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-uwc-blue text-white dark:bg-uwc-gold dark:text-uwc-navy font-bold text-xs rounded-xl"
        >
          Return to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-uwc-cardDark p-4 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300 flex items-center justify-center font-bold">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white">Admin Moderation Queue</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Review reported posts & manage campus safety.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading moderation queue...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-uwc-cardDark rounded-2xl border border-gray-200 dark:border-gray-800 max-w-xl mx-auto space-y-2">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
          <p className="font-bold text-gray-700 dark:text-gray-200">Moderation Queue Clear</p>
          <p className="text-xs text-gray-500">No pending event reports found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white dark:bg-uwc-cardDark p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    Report Status: {report.status}
                  </span>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white mt-1">
                    Event: {report.event.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Author: <span className="font-semibold text-gray-800 dark:text-gray-200">{report.event.author.name}</span> ({report.event.author.email})
                  </p>
                </div>

                <Link
                  href={`/events/${report.event.id}`}
                  target="_blank"
                  className="text-xs font-bold text-uwc-blue dark:text-uwc-gold flex items-center gap-1 hover:underline"
                >
                  View Event <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Report Reason Box */}
              <div className="p-3 bg-red-50/70 dark:bg-red-950/40 rounded-xl border border-red-100 dark:border-red-900/40 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-300">
                  <AlertTriangle className="w-4 h-4" /> Reported by {report.reporter.name} ({report.reporter.email}):
                </div>
                <p className="text-xs text-red-800 dark:text-red-200 leading-relaxed italic">
                  "{report.reason}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => handleAction(report.id, "DISMISS_REPORT")}
                  disabled={actionLoading === report.id}
                  className="px-3.5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  <CheckCircle className="w-4 h-4 text-green-600" /> Dismiss Report
                </button>

                <button
                  onClick={() => handleAction(report.id, "REMOVE_POST")}
                  disabled={actionLoading === report.id}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Remove Post
                </button>

                <button
                  onClick={() => handleAction(report.id, "SUSPEND_ACCOUNT")}
                  disabled={actionLoading === report.id}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  <UserX className="w-4 h-4" /> Suspend Account
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
