'use client'
import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../ui/button'
import { Dialog, DialogTitle, DialogTrigger } from '../ui/dialog'
import { FormDialogContent } from '../Forms/FormDialogContent'
import appConfig from '@/settings'
import AddMedia from '../Forms/Add/AddMedia'

export default function ButtonAddMedia() {
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
                  <Plus /> Ajouter un média
              </Button>
            </DialogTrigger>
            <FormDialogContent className="sm:max-w-3xl">
                <DialogTitle className="sr-only">Ajouter un média</DialogTitle>
                <AddMedia onClose={handleClose} />
            </FormDialogContent>
        </Dialog>
  )
}
