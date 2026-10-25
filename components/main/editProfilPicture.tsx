"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { User } from "@prisma/client";
import { AVATAR_PATHS } from "@/settings/avatars";
import { updateProfilePictureAvatar, updateProfilePictureFile } from "@/actions/updateProfilePicture";
import { Upload, Check } from "lucide-react";
import { shrinkImage } from "@/lib/image-resize";

type EditProfilPictureProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User;
};

export function EditProfilPicture({
  isOpen,
  onClose,
  onSuccess,
  user,
}: EditProfilPictureProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentImage = (user.profilePicture ?? user.image) as string | null;

  const handleAvatarClick = (path: string) => {
    setCustomFile(null);
    setPreview(null);
    setSelectedAvatar(path);
    setError(null);
  };

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(picked.type)) {
      setError("Format accepté : JPEG, PNG, WebP, GIF.");
      return;
    }
    // Réduite avant le contrôle de taille : une photo de téléphone passe sous 2 Mo
    const f = await shrinkImage(picked);
    if (f.size > 2 * 1024 * 1024) {
      setError("Image trop volumineuse (max 2 Mo).");
      return;
    }
    setSelectedAvatar(null);
    setCustomFile(f);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (customFile) {
        const formData = new FormData();
        formData.set("file", customFile);
        const res = await updateProfilePictureFile(formData);
        if (res.success) {
          onSuccess();
          handleClose();
        } else {
          setError(res.error);
        }
      } else if (selectedAvatar) {
        const res = await updateProfilePictureAvatar(selectedAvatar);
        if (res.success) {
          onSuccess();
          handleClose();
        } else {
          setError(res.error);
        }
      } else {
        setError("Choisissez un avatar ou une image depuis votre appareil.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedAvatar(null);
    setCustomFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Changer la photo de profil</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatars prédéfinis */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Choisir un avatar</Label>
            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {AVATAR_PATHS.map((path) => {
                const isSelected = selectedAvatar === path && !customFile;
                const isCurrent = currentImage === path;
                return (
                  <button
                    key={path}
                    type="button"
                    onClick={() => handleAvatarClick(path)}
                    className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border-2 bg-gray-100 transition hover:border-primaryColor hover:bg-gray-50 ${
                      isSelected ? "border-primaryColor ring-2 ring-primaryColor/30" : "border-gray-200"
                    }`}
                  >
                    <img
                      src={path}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {(isSelected || isCurrent) && (
                      <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primaryColor text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Depuis l'appareil */}
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Ou depuis votre appareil
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0"
              >
                <Upload className="mr-2 h-4 w-4" />
                Parcourir
              </Button>
              {preview && (
                <div className="flex items-center gap-2">
                  <img
                    src={preview}
                    alt="Aperçu"
                    className="h-12 w-12 rounded-lg object-cover ring-1 ring-gray-200"
                  />
                  <span className="truncate text-sm text-gray-600">{customFile?.name}</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" loading={loading} disabled={!selectedAvatar && !customFile}>
              {loading ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
