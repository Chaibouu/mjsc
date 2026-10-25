"use client"
import React from 'react'
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { projetFormSchema } from '@/schemas/projet';
import { postProjet } from '@/actions/projets';
import { notify } from '@/lib/notify';
import { GalleryInput, MainImageInput } from '../ImageFields';
import { FormActions } from '../FormActions';
import { showSuccess } from '@/components/success-overlay';

interface AddProjetProps {
    onClose: () => void; // Fonction pour fermer le dialog
}

type ProjetForm = z.infer<typeof projetFormSchema>;

const AddProjet = ({ onClose }: AddProjetProps) => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: postProjet,
        onSuccess: (data) => {
            if (data.error) {
                notify.error(data.error);
                return;
            }
            queryClient.invalidateQueries({ queryKey: ['projets'] });
            showSuccess({ title: "Projet ajouté", message: "Le projet a bien été enregistré." });
            onClose(); // Fermer le dialog après succès
        },
        onError: (error: Error) => notify.error(error.message),
    });
    const isPending = mutation.isPending;

    const form = useForm<ProjetForm>({
        resolver: zodResolver(projetFormSchema),
        defaultValues: {
            title: "",
            description: "",
            link: "",
            mainImage: null,
            gallery: [],
        },
    })

    const onSubmit = (data: ProjetForm) => {
        const formData = new FormData();
        formData.append("title", data.title.trim());
        formData.append("description", data.description?.trim() ?? "");
        formData.append("link", data.link?.trim() ?? "");
        if (data.mainImage) formData.append("mainImage", data.mainImage);
        data.gallery?.forEach((file) => formData.append("gallery", file));

        mutation.mutate(formData);
    }

  return (
    <div>
        <Form {...form}>
            <div><h1 className="text-2xl text-slate-500 font-bold text-center">Ajouter un projet</h1></div>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                 <div className="space-y-4">
                    {/* Champ : Titre */}
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="mt-2 text-lg text-slate-400">
                            Titre <b className="text-red-500">*</b>
                            </FormLabel>
                            <FormControl>
                            <Input
                                {...field}
                                type="text"
                                placeholder="Veuillez saisir le titre du projet"
                                disabled={isPending}
                                className="bg-white"
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    {/* Champ : Description */}
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="mt-2 text-lg text-slate-400">Description</FormLabel>
                            <RichTextEditor
                                value={field.value ?? ""}
                                onChange={field.onChange}
                                placeholder="Veuillez décrire le projet"
                                disabled={isPending}
                            />
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    {/* Champ : Lien */}
                    <FormField
                        control={form.control}
                        name="link"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="mt-2 text-lg text-slate-400">Lien externe</FormLabel>
                            <FormControl>
                            <Input
                                {...field}
                                type="url"
                                placeholder="https://..."
                                disabled={isPending}
                                className="bg-white"
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    {/* Champ : Image principale */}
                    <FormField
                        control={form.control}
                        name="mainImage"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="mt-2 text-lg text-slate-400">Image principale</FormLabel>
                            <FormControl>
                            <MainImageInput value={field.value} onChange={field.onChange} disabled={isPending} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    {/* Champ : Galerie */}
                    <FormField
                        control={form.control}
                        name="gallery"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="mt-2 text-lg text-slate-400">Galerie d&apos;images</FormLabel>
                            <FormControl>
                            <GalleryInput value={field.value} onChange={field.onChange} disabled={isPending} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                <FormActions isPending={isPending} submitLabel="Ajouter le projet" onClose={onClose} />
          </form>
      </Form>
    </div>
  )
}

export default AddProjet
