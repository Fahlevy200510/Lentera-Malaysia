"use client";

import React from "react";
import { User, GraduationCap, Sparkles, Award } from "lucide-react";

interface StudentAvatarBadgeProps {
  id?: string;
  name?: string;
  avatar?: string;
  size?: "xs" | "sm" | "md" | "lg";
  theme?: "dark" | "light";
  className?: string;
}

export default function StudentAvatarBadge({
  id = "",
  name = "",
  avatar = "",
  size = "md",
  theme = "dark",
  className = "",
}: StudentAvatarBadgeProps) {
  const normalizedId = (id || "").toLowerCase();
  const normalizedName = (name || "").toLowerCase();
  const normalizedAvatar = (avatar || "").toLowerCase();

  const isVia =
    normalizedId === "via" ||
    avatar === "👧" ||
    normalizedAvatar === "via" ||
    normalizedName.includes("via");
  const isAmira =
    normalizedId === "amira" ||
    avatar === "👩" ||
    normalizedAvatar === "amira" ||
    normalizedAvatar === "graduation-cap" ||
    normalizedName.includes("amira");
  const isLuthfi =
    normalizedId === "luthfi" ||
    normalizedId === "ajib" ||
    avatar === "🧑" ||
    normalizedAvatar === "luthfi" ||
    normalizedAvatar === "ajib" ||
    normalizedAvatar === "sparkles" ||
    normalizedName.includes("luthfi") ||
    normalizedName.includes("ajib");
  const isGuest =
    normalizedId === "guest" ||
    avatar === "👤" ||
    normalizedAvatar === "guest" ||
    normalizedAvatar === "award" ||
    normalizedName.includes("tamu") ||
    normalizedName.includes("juri") ||
    normalizedName.includes("pengamat");

  const sizeClasses = {
    xs: "h-5 w-5",
    sm: "h-6 w-6",
    md: "h-7 w-7",
    lg: "h-9 w-9",
  }[size];

  const iconSizes = {
    xs: "h-3 w-3",
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size];

  let colorClasses = "";
  let IconComponent = User;

  if (isVia) {
    IconComponent = User;
    colorClasses =
      theme === "dark"
        ? "bg-rose-500/20 text-rose-300 border-rose-400/30"
        : "bg-[#EAE4FF] text-[#5840BA] border-[#735CDD]/25";
  } else if (isAmira) {
    IconComponent = GraduationCap;
    colorClasses =
      theme === "dark"
        ? "bg-violet-500/20 text-violet-300 border-violet-400/30"
        : "bg-[#EAE4FF] text-[#5840BA] border-[#735CDD]/25";
  } else if (isLuthfi) {
    IconComponent = Sparkles;
    colorClasses =
      theme === "dark"
        ? "bg-amber-500/20 text-amber-300 border-amber-400/30"
        : "bg-[#FFF3D6] text-[#9A5B00] border-[#F5B841]/45";
  } else if (isGuest) {
    IconComponent = Award;
    colorClasses =
      theme === "dark"
        ? "bg-sky-500/20 text-sky-300 border-sky-400/30"
        : "bg-[#EAE4FF] text-[#5840BA] border-[#735CDD]/25";
  } else {
    IconComponent = User;
    colorClasses =
      theme === "dark"
        ? "bg-slate-800 text-slate-300 border-slate-700"
        : "bg-[#EAE4FF] text-[#5840BA] border-[#735CDD]/25";
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border shadow-2xs shrink-0 select-none ${sizeClasses} ${colorClasses} ${className}`}
      title={name || id}
    >
      <IconComponent className={iconSizes} strokeWidth={2} />
    </span>
  );
}
