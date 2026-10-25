'use client';

import React from 'react';
import { ScaleLoader } from 'react-spinners';
import appConfig from '@/settings';
import { cn } from '@/lib/utils';

interface LoaderProps {
  /** Occupe tout l'écran (chargement d'une page entière) */
  fullScreen?: boolean;
  /** Texte affiché sous le loader */
  message?: string;
  className?: string;
  color?: string;
}

/**
 * Loader principal du projet (pages et zones en chargement), dans la couleur principale.
 */
const Loader: React.FC<LoaderProps> = ({ fullScreen = false, message, className, color }) => {
  const content = (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center justify-center gap-4', !fullScreen && 'py-16', className)}
    >
      <ScaleLoader color={color ?? appConfig.primaryColor} aria-hidden />
      <span className={message ? 'text-sm font-medium text-gray-600' : 'sr-only'}>
        {message ?? 'Chargement…'}
      </span>
    </div>
  );

  if (fullScreen) {
    return <div className="flex min-h-screen items-center justify-center bg-white">{content}</div>;
  }
  return content;
};

/**
 * Petit loader pour les boutons en cours d'action ; prend la couleur du texte du bouton.
 */
export function ButtonLoader({ className, color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <span className={cn('inline-flex items-center', className)} aria-hidden>
      <ScaleLoader color={color} height={14} width={2} radius={1} margin={1} />
    </span>
  );
}

export default Loader;
