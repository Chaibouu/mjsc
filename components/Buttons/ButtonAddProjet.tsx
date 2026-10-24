'use client'
import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../ui/dialog'
import appConfig from '@/settings'
import AddProjet from '../Forms/Add/AddProjet'

export default function ButtonAddProjet() {
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
                  <Plus /> Ajouter un projet
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
                <DialogTitle className="sr-only">Ajouter un projet</DialogTitle>
                <AddProjet onClose={handleClose} />
            </DialogContent>
        </Dialog>
  )
}
