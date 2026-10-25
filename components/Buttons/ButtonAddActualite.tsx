'use client'
import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../ui/button'
import { Dialog, DialogTitle, DialogTrigger } from '../ui/dialog'
import { FormDialogContent } from '../Forms/FormDialogContent'
import appConfig from '@/settings'
import AddActualite from '../Forms/Add/AddActualite'

export default function ButtonAddActualite() {
  const [isOpen, setIsOpen] = useState(false); // État pour ouvrir/fermer le dialog

  const handleClose = () => {
    setIsOpen(false); // Ferme le dialog
  };

  return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                className='flex items-center gap-2 text-white hover:opacity-90'
                style={{ backgroundColor: appConfig.secondaryColor }}
              >
                  <Plus /> Ajouter une actualité
              </Button>
            </DialogTrigger>
            <FormDialogContent className="sm:max-w-3xl">
                <DialogTitle className="sr-only">Ajouter une actualité</DialogTitle>
                <AddActualite onClose={handleClose} />
            </FormDialogContent>
        </Dialog>
  )
}
