"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { shrinkImage, shrinkImages } from '@/lib/image-resize'

/** Ajoute un horodatage aux images servies par l'API pour éviter l'ancienne version en cache. */
export function uploadSrc(path: string | null | undefined, updatedAt?: string | Date | null) {
  if (!path) return null;
  const ts = updatedAt ? new Date(updatedAt).getTime() : null;
  return path.startsWith("/api/uploads/") && ts ? `${path}?t=${ts}` : path;
}

/** URL d'aperçu d'un fichier local, libérée automatiquement. */
function useObjectUrls(files: File[]) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);
  return urls;
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

function Optimizing() {
  return <p className="text-sm text-slate-500">Optimisation des images…</p>;
}

function Thumb({ src, alt, onRemove }: { src: string; alt: string; onRemove?: () => void }) {
  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-md border bg-slate-50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover" />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
          aria-label={`Retirer ${alt}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

interface MainImageInputProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  /** Image déjà enregistrée (modification) */
  currentSrc?: string | null;
  disabled?: boolean;
}

export function MainImageInput({ value, onChange, currentSrc, disabled }: MainImageInputProps) {
  const files = useMemo(() => (value ? [value] : []), [value]);
  const [preview] = useObjectUrls(files);
  const shown = preview ?? currentSrc ?? null;
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-2">
      <Input
        type="file"
        accept={ACCEPT}
        disabled={disabled || busy}
        className="bg-white"
        onChange={async (e) => {
          const picked = e.target.files?.[0];
          if (!picked) return onChange(null);
          setBusy(true);
          try {
            onChange(await shrinkImage(picked));
          } finally {
            setBusy(false);
          }
        }}
      />
      {busy && <Optimizing />}
      {shown && (
        <Thumb
          src={shown}
          alt="Image principale"
          onRemove={value ? () => onChange(null) : undefined}
        />
      )}
    </div>
  );
}

interface GalleryInputProps {
  value?: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

/** Ajout de plusieurs images ; chaque sélection s'ajoute aux précédentes (réduites avant l'envoi). */
export function GalleryInput({ value = [], onChange, disabled }: GalleryInputProps) {
  const previews = useObjectUrls(value);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-2">
      <Input
        type="file"
        accept={ACCEPT}
        multiple
        disabled={disabled || busy}
        className="bg-white"
        onChange={async (e) => {
          const picked = Array.from(e.target.files ?? []);
          e.target.value = ""; // permet de resélectionner le même fichier
          if (!picked.length) return;
          setBusy(true);
          try {
            onChange([...value, ...(await shrinkImages(picked))]);
          } finally {
            setBusy(false);
          }
        }}
      />
      {busy && <Optimizing />}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((src, i) => (
            <Thumb
              key={src}
              src={src}
              alt={value[i]?.name ?? `Image ${i + 1}`}
              onRemove={() => onChange(value.filter((_, j) => j !== i))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ExistingGalleryProps {
  paths: string[];
  removed: string[];
  onToggle: (path: string) => void;
  updatedAt?: string | Date | null;
  disabled?: boolean;
}

/** Images déjà enregistrées : un clic les marque à supprimer (ou annule). */
export function ExistingGallery({ paths, removed, onToggle, updatedAt, disabled }: ExistingGalleryProps) {
  if (!paths.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {paths.map((p, i) => {
        const isRemoved = removed.includes(p);
        return (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(p)}
            className={`relative h-20 w-20 overflow-hidden rounded-md border ${isRemoved ? "opacity-40 ring-2 ring-red-500" : ""}`}
            aria-pressed={isRemoved}
            aria-label={isRemoved ? `Conserver l'image ${i + 1}` : `Supprimer l'image ${i + 1}`}
            title={isRemoved ? "Sera supprimée — cliquer pour conserver" : "Cliquer pour supprimer"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={uploadSrc(p, updatedAt) ?? p} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
            {isRemoved && (
              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-red-700">
                Supprimée
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
