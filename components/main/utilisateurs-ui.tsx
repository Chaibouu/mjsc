"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadSrc } from "@/components/Forms/ImageFields";
import { cn } from "@/lib/utils";

type NamedUser = {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string | null;
};

export function fullName(u: NamedUser): string {
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return full || u.name || u.email || "Sans nom";
}

export function initials(u: NamedUser): string {
  return (
    fullName(u)
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export function formatDate(value: string | Date | null | undefined, withTime = false) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: withTime ? "long" : "short",
    year: "numeric",
    ...(withTime && { hour: "2-digit", minute: "2-digit" }),
  });
}

export function UserAvatarImage({
  user,
  className,
}: {
  user: NamedUser & { profilePicture?: string | null; image?: string | null; updatedAt?: string | null };
  className?: string;
}) {
  const src = uploadSrc(user.profilePicture || user.image, user.updatedAt);
  return (
    <Avatar className={cn("h-10 w-10 shrink-0", className)}>
      {src && <AvatarImage src={src} alt="" className="object-cover" />}
      <AvatarFallback className="bg-primaryColor/10 font-semibold text-primaryColor">{initials(user)}</AvatarFallback>
    </Avatar>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold",
        active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-500" : "bg-red-500")} aria-hidden />
      {active ? "Actif" : "Désactivé"}
    </span>
  );
}
