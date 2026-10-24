"use client"
import React from 'react'
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { articleFormSchema } from '@/schemas/article';
import { putArticle } from '@/actions/articles';
import { notify } from '@/lib/notify';
import appConfig from '@/settings';
import type { Article } from '@/types/article';
import { ExistingGallery, GalleryInput, MainImageInput, uploadSrc } from '../ImageFields';
import { Spinner } from '../Spinner';

interface UpdateArticleProps {
    article: Article;
    onClose: () => void; // Fonction pour fermer le dialog
}

type ArticleForm = z.infer<typeof articleFormSchema>;

const UpdateArticle = ({ article, onClose }: UpdateArticleProps) => {
    const queryClient = useQueryClient();
    const existingGallery = Array.isArray(article.gallery) ? article.gallery : [];

    const mutation = useMutation({
        mutationFn: putArticle,
        onSuccess: (data) => {
            if (data.error) {
                notify.error(data.error);
                return;
            }
            queryClient.invalidateQueries({ queryKey: ['articles'] });
            notify.success(data.message ?? "Article mis à jour avec succès");
            onClose(); // Fermer le dialog après succès
        },
        onError: (error: Error) => notify.error(error.message),
    });
    const isPending = mutation.isPending;

    const form = useForm<ArticleForm>({
        resolver: zodResolver(articleFormSchema),
        defaultValues: {
            title: article.title ?? "",
            description: article.description ?? "",
            link: article.link ?? "",
            mainImage: null,
            gallery: [],
            galleryRemove: [],
        },
    })

    const onSubmit = (data: ArticleForm) => {
        const formData = new FormData();
        formData.append("title", data.title.trim());
        formData.append("description", data.description?.trim() ?? "");
        formData.append("link", data.link?.trim() ?? "");
        if (data.mainImage) formData.append("mainImage", data.mainImage);
        data.gallery?.forEach((file) => formData.append("galleryAdd", file));
        if (data.galleryRemove?.length) {
            formData.append("galleryRemove", JSON.stringify(data.galleryRemove));
        }

        mutation.mutate({ body: formData, id: article.id });
    }

  return (
    <div>
        <Form {...form}>
            <div><h1 className="text-2xl text-slate-500 font-bold text-center">Modifier l&apos;article</h1></div>
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
                                placeholder="Veuillez saisir le titre de l'article"
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
                            <FormControl>
                            <Textarea
                                {...field}
                                rows={5}
                                placeholder="Veuillez saisir le contenu de l'article"
                                disabled={isPending}
                                className="bg-white"
                            />
                            </FormControl>
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
                                currentSrc={uploadSrc(article.image, article.updatedAt)}
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
                                updatedAt={article.updatedAt}
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
                <div>
                    <Button
                        type="submit"
                        disabled={isPending}
                        className={`w-full mt-8 text-white ${isPending ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}`}
                        style={{ backgroundColor: appConfig.secondaryColor }}
                    >
                        {isPending ? <Spinner /> : "Enregistrer les modifications"}
                    </Button>
                </div>
          </form>
      </Form>
    </div>
  )
}

export default UpdateArticle
