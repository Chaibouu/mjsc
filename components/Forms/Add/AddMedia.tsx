"use client"
import React from 'react'
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { mediaFormSchema } from '@/schemas/media';
import { postMedia } from '@/actions/medias';
import { notify } from '@/lib/notify';
import { GalleryInput } from '../ImageFields';
import { FormActions } from '../FormActions';
import { showSuccess } from '@/components/success-overlay';

interface AddMediaProps {
    onClose: () => void; // Fonction pour fermer le dialog
}

type MediaForm = z.infer<typeof mediaFormSchema>;

const AddMedia = ({ onClose }: AddMediaProps) => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: postMedia,
        onSuccess: (data) => {
            if (data.error) {
                notify.error(data.error);
                return;
            }
            queryClient.invalidateQueries({ queryKey: ['medias'] });
            showSuccess({ title: "Média ajouté", message: "Le média a bien été enregistré." });
            onClose(); // Fermer le dialog après succès
        },
        onError: (error: Error) => notify.error(error.message),
    });
    const isPending = mutation.isPending;

    const form = useForm<MediaForm>({
        resolver: zodResolver(mediaFormSchema),
        defaultValues: {
            title: "",
            description: "",
            gallery: [],
        },
    })

    const onSubmit = (data: MediaForm) => {
        const formData = new FormData();
        formData.append("title", data.title.trim());
        formData.append("description", data.description?.trim() ?? "");
        data.gallery?.forEach((file) => formData.append("gallery", file));

        mutation.mutate(formData);
    }

  return (
    <div>
        <Form {...form}>
            <div><h1 className="text-2xl text-slate-500 font-bold text-center">Ajouter un média</h1></div>
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
                                placeholder="Veuillez saisir le titre du média"
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
                                placeholder="Veuillez décrire l'événement ou l'album"
                                disabled={isPending}
                            />
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
                <FormActions isPending={isPending} submitLabel="Ajouter le média" onClose={onClose} />
          </form>
      </Form>
    </div>
  )
}

export default AddMedia
