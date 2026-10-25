"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/**
 * Confirmation de succès plein écran : une coche animée au centre de la page, qui disparaît
 * seule. Appeler `showSuccess({ title, message })` depuis n'importe quel composant client ;
 * l'hôte `<SuccessOverlayHost />` est monté une fois dans le layout racine.
 */

type SuccessPayload = { id: number; title: string; message?: string; duration: number };

let current: SuccessPayload | null = null;
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function showSuccess({ title, message, duration = 3200 }: { title: string; message?: string; duration?: number }) {
  current = { id: nextId++, title, message, duration };
  emit();
}

function hideSuccess(id: number) {
  if (current?.id === id) {
    current = null;
    emit();
  }
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function SuccessOverlayHost() {
  const payload = useSyncExternalStore(subscribe, () => current, () => null);

  useEffect(() => {
    if (!payload) return;
    const timer = setTimeout(() => hideSuccess(payload.id), payload.duration);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && hideSuccess(payload.id);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [payload]);

  if (!payload) return null;

  return createPortal(
    <div
      key={payload.id}
      role="status"
      aria-live="polite"
      onClick={() => hideSuccess(payload.id)}
      className="success-overlay fixed inset-0 z-[10000] flex items-center justify-center bg-white/70 px-6 backdrop-blur-[2px]"
      style={{ ["--success-duration" as string]: `${payload.duration}ms` }}
    >
      <div className="success-card flex w-full max-w-sm flex-col items-center bg-white px-8 py-10 text-center shadow-2xl ring-1 ring-black/5">
        <svg viewBox="0 0 52 52" className="success-check h-24 w-24" aria-hidden>
          <circle className="success-check-bg" cx="26" cy="26" r="25" />
          <circle className="success-check-circle" cx="26" cy="26" r="24" fill="none" />
          <path className="success-check-mark" fill="none" d="M15 27.5l7.2 7.2L37.5 19" />
        </svg>
        <p className="success-text mt-6 text-xl font-bold text-gray-900">{payload.title}</p>
        {payload.message && <p className="success-text mt-2 text-sm leading-relaxed text-gray-600">{payload.message}</p>}
      </div>
    </div>,
    document.body
  );
}
