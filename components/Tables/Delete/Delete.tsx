'use client'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import { notify } from "@/lib/notify"

interface DeleteProps {
  id: string,
  /** Clé React Query de la liste à rafraîchir après suppression */
  queryKey: string,
  /** Ce qui est supprimé, ex. « l'article "Titre" » */
  label?: string,
  deleteFnct: (id: string) => Promise<{ message?: string; error?: string }>
}

const Delete = ({ id, queryKey, label = "cet élément", deleteFnct }: DeleteProps) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteFnct,
    onSuccess: (data) => {
      if (data?.error) {
        notify.error(data.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      notify.success(data?.message ?? "Suppression effectuée");
      setIsOpen(false);
    },
    onError: (error: Error) => notify.error(error.message),
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button type="button" aria-label="Supprimer" title="Supprimer">
          <Trash2 className="cursor-pointer" color="#ea2a2a" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[435px]">
        <DialogHeader>
          <DialogTitle>Supprimer {label} ?</DialogTitle>
          <DialogDescription className="my-4">
            Veuillez confirmer la suppression.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={mutation.isPending}>
            Annuler
          </Button>
          <Button variant="destructive" disabled={mutation.isPending} onClick={() => mutation.mutate(id)}>
            {mutation.isPending ? "Suppression…" : "Supprimer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default Delete
