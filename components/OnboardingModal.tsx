"use client";

import React, { useState } from "react";
import { Sparkles, Check } from "lucide-react";

const ALL_CATEGORIES = [
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

interface OnboardingModalProps {
  isOpen: boolean;
  initialInterests?: string[];
  onComplete: (selected: string[]) => void;
}

export function OnboardingModal({ isOpen, initialInterests = [], onComplete }: OnboardingModalProps) {
  const [selected, setSelected] = useState<string[]>(initialInterests);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const toggleCategory = (catId: string) => {
    if (selected.includes(catId)) {
      setSelected(selected.filter((c) => c !== catId));
    } else {
      setSelected([...selected, catId]);
    }
  };

  const handleSave = async () => {
    if (selected.length === 0) return alert("Please select at least 1 category to personalize your feed!");
    setSaving(true);
    try {
      const res = await fetch("/api/auth/update-interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: selected }),
      });
      if (res.ok) {
        onComplete(selected);
      }
    } catch {
      onComplete(selected);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-uwc-cardDark w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-uwc-blue to-uwc-lightBlue text-uwc-gold mx-auto flex items-center justify-center text-xl shadow-md">
            <Sparkles className="w-6 h-6 text-uwc-gold" />
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            Personalize Your Feed
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
            Pick your favorite topics so our recommendation engine can curate your custom campus feed.
          </p>
        </div>

        {/* Category Chips Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
          {ALL_CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between gap-2 ${
                  isSelected
                    ? "bg-uwc-blue text-white border-uwc-blue dark:bg-uwc-gold dark:text-uwc-navy shadow-md scale-102"
                    : "bg-gray-50 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100"
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </span>
                {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          disabled={saving || selected.length === 0}
          className="w-full py-3.5 bg-uwc-blue hover:bg-uwc-navy text-white dark:bg-uwc-gold dark:text-uwc-navy font-black text-sm rounded-2xl shadow-lg transition-transform active:scale-98 disabled:opacity-50"
        >
          {saving ? "Personalizing..." : `Continue to Feed (${selected.length} selected)`}
        </button>
      </div>
    </div>
  );
}
