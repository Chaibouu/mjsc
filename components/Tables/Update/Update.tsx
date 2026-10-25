'use client'
import React, { ReactNode, useState } from 'react'
import { FilePenLine } from 'lucide-react'
import { Dialog, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FormDialogContent } from '@/components/Forms/FormDialogContent'

interface UpdateProps {
  /** Titre lu par les lecteurs d'écran */
  label?: string;
  /** Le formulaire de modification ; en fonction, il reçoit `onClose` pour fermer le dialogue */
  children: ReactNode | ((onClose: () => void) => ReactNode);
}

export default function Update({ label = "Modifier", children }: UpdateProps) {
  const [isOpen, setIsOpen] = useState(false); // État pour ouvrir/fermer le dialog
  const handleClose = () => setIsOpen(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button type="button" aria-label={label} title={label}>
          <FilePenLine className="cursor-pointer" color="#306ced" />
        </button>
      </DialogTrigger>
      <FormDialogContent className="sm:max-w-3xl">
        <DialogTitle className="sr-only">{label}</DialogTitle>
        {typeof children === "function" ? children(handleClose) : children}
      </FormDialogContent>
    </Dialog>
  )
}
