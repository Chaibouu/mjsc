'use client'
import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../ui/dialog'
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
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
                <DialogTitle className="sr-only">Ajouter un média</DialogTitle>
                <AddMedia onClose={handleClose} />
            </DialogContent>
        </Dialog>
  )
}
