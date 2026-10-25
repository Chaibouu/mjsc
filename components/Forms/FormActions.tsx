'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import appConfig from '@/settings'

interface FormActionsProps {
  isPending: boolean;
  submitLabel: string;
  /** Ferme la fenêtre sans enregistrer */
  onClose: () => void;
}

/** Boutons du bas des formulaires en fenêtre : « Fermer » et enregistrement. */
export function FormActions({ isPending, submitLabel, onClose }: FormActionsProps) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" className="rounded-none" onClick={onClose}>
        Fermer
      </Button>
      <Button
        type="submit"
        loading={isPending}
        className="rounded-none text-white hover:opacity-90 sm:min-w-48"
        style={{ backgroundColor: appConfig.secondaryColor }}
      >
        {submitLabel}
      </Button>
    </div>
  )
}
