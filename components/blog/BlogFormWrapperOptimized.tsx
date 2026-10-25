import { Suspense, use } from "react";
import { getBlogAction } from "@/actions/blog-actions";
import { BlogForm } from "./BlogForm";
import { BlogFormEdit } from "./BlogFormEdit";
import { Card, CardContent } from "@/components/ui/card";
import type { Blog } from "@/types/blog";
import Loader from "@/components/loader"

interface BlogFormWrapperProps {
  blogId?: string;
  mode: "create" | "edit";
}

// Composant optimisé avec use hook
function BlogFormWithData({ blogId, mode }: BlogFormWrapperProps) {
  if (mode === "create") {
    return <BlogForm />;
  }

  if (!blogId) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">ID du blog manquant</p>
      </div>
    );
  }

  // Utilisation du hook use pour une meilleure performance
  const blogData = use(getBlogAction(blogId));

  if (!blogData.success) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Erreur: {blogData.error}</p>
      </div>
    );
  }

  if (!blogData.data) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Blog non trouvé</p>
      </div>
    );
  }

  const blog = blogData.data.data;

  return <BlogFormEdit blogId={blogId} initialData={blog} />;
}

export function BlogFormWrapperOptimized({ blogId, mode }: BlogFormWrapperProps) {
  return (
    <Suspense fallback={<Loader />}>
      <BlogFormWithData blogId={blogId} mode={mode} />
    </Suspense>
  );
} 