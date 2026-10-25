'use client'
import * as React from 'react'
import { DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/**
 * Contenu des fenêtres de formulaire du back-office : coins droits, et fermeture uniquement
 * par la croix ou le bouton « Fermer » (ni clic à côté, ni touche Échap), pour ne pas perdre
 * une saisie en cours.
 */
export const FormDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof DialogContent>
>(({ className, children, ...props }, ref) => (
  <DialogContent
    ref={ref}
    onInteractOutside={(e) => e.preventDefault()}
    onEscapeKeyDown={(e) => e.preventDefault()}
    className={cn('max-h-[90vh] overflow-y-auto rounded-none sm:rounded-none', className)}
    {...props}
  >
    {children}
  </DialogContent>
))
FormDialogContent.displayName = 'FormDialogContent'
