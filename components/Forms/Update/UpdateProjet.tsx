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
import { putProjet } from '@/actions/projets';
import { notify } from '@/lib/notify';
import type { Projet } from '@/types/projet';
import { ExistingGallery, GalleryInput, MainImageInput, uploadSrc } from '../ImageFields';
import { FormActions } from '../FormActions';

interface UpdateProjetProps {
    projet: Projet;
    onClose: () => void; // Fonction pour fermer le dialog
}

type ProjetForm = z.infer<typeof projetFormSchema>;

const UpdateProjet = ({ projet, onClose }: UpdateProjetProps) => {
    const queryClient = useQueryClient();
    const existingGallery = Array.isArray(projet.gallery) ? projet.gallery : [];

    const mutation = useMutation({
        mutationFn: putProjet,
        onSuccess: (data) => {
            if (data.error) {
                notify.error(data.error);
                return;
            }
            queryClient.invalidateQueries({ queryKey: ['projets'] });
            notify.success(data.message ?? "Projet mis à jour avec succès");
            onClose(); // Fermer le dialog après succès
        },
        onError: (error: Error) => notify.error(error.message),
    });
    const isPending = mutation.isPending;

    const form = useForm<ProjetForm>({
        resolver: zodResolver(projetFormSchema),
        defaultValues: {
            title: projet.title ?? "",
            description: projet.description ?? "",
            link: projet.link ?? "",
            mainImage: null,
            gallery: [],
            galleryRemove: [],
        },
    })

    const onSubmit = (data: ProjetForm) => {
        const formData = new FormData();
        formData.append("title", data.title.trim());
        formData.append("description", data.description?.trim() ?? "");
        formData.append("link", data.link?.trim() ?? "");
        if (data.mainImage) formData.append("mainImage", data.mainImage);
        data.gallery?.forEach((file) => formData.append("galleryAdd", file));
        if (data.galleryRemove?.length) {
            formData.append("galleryRemove", JSON.stringify(data.galleryRemove));
        }

        mutation.mutate({ body: formData, id: projet.id });
    }

  return (
    <div>
        <Form {...form}>
            <div><h1 className="text-2xl text-slate-500 font-bold text-center">Modifier le projet</h1></div>
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

                    {/* Champ : Image principale (remplace l'actuelle si une nouvelle est choisie) */}
                    <FormField
                        control={form.control}
                        name="mainImage"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="mt-2 text-lg text-slate-400">Image principale</FormLabel>
                            <FormControl>
                            <MainImageInput
                                value={field.value}
                                onChange={field.onChange}
                                currentSrc={uploadSrc(projet.image, projet.updatedAt)}
                                disabled={isPending}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    {/* Galerie : images existantes (cliquer pour supprimer) + nouvelles images */}
                    <FormField
                        control={form.control}
                        name="galleryRemove"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="mt-2 text-lg text-slate-400">Galerie d&apos;images</FormLabel>
                            {existingGallery.length > 0 && (
                                <p className="text-sm text-slate-500">Cliquez sur une image pour la supprimer.</p>
                            )}
                            <FormControl>
                            <ExistingGallery
                                paths={existingGallery}
                                removed={field.value ?? []}
                                updatedAt={projet.updatedAt}
                                disabled={isPending}
                                onToggle={(path) => {
                                    const current = field.value ?? [];
                                    field.onChange(
                                        current.includes(path)
                                            ? current.filter((p) => p !== path)
                                            : [...current, path]
                                    );
                                }}
                            />
                            </FormControl>
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="gallery"
                        render={({ field }) => (
                        <FormItem>
                            <FormControl>
                            <GalleryInput value={field.value} onChange={field.onChange} disabled={isPending} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                <FormActions isPending={isPending} submitLabel="Enregistrer les modifications" onClose={onClose} />
          </form>
      </Form>
    </div>
  )
}

export default UpdateProjet
