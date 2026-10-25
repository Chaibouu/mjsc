/**
 * Utilitaires pour la gestion des uploads de fichiers
 */

import { deleteObject, putObject } from "@/lib/storage";

export interface UploadOptions {
  maxSize?: number; // Taille maximale en bytes
  allowedTypes?: string[]; // Types MIME autorisés
}

export interface UploadResult {
  filename: string;
  path: string;
  size: number;
  mimetype: string;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Valide un fichier avant l'upload
 */
export function validateFile(
  file: File,
  options: UploadOptions = {}
): { valid: boolean; error?: string } {
  const maxSize =
    options.maxSize ||
    parseInt(process.env.MAX_UPLOAD_SIZE || String(DEFAULT_MAX_SIZE));

  // Vérifier la taille
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Le fichier est trop volumineux. Taille maximale: ${maxSize / 1024 / 1024}MB`,
    };
  }

  // Vérifier le type MIME
  if (options.allowedTypes && options.allowedTypes.length > 0) {
    if (!options.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Type de fichier non autorisé. Types autorisés: ${options.allowedTypes.join(", ")}`,
      };
    }
  }

  return { valid: true };
}

// Images publiques (profils, actualités, articles, projets, médias) : stockées via lib/storage
// (R2 si configuré, sinon disque local sous uploads/). La clé reprend le chemin public
// /api/uploads/{clé}, ce qui garde les chemins déjà enregistrés en base valides.

const IMAGE_MAX = 5 * 1024 * 1024; // 5MB
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const IMAGE_EXTS = ["jpg", "png", "webp", "gif"];

const PROFILE_MAX_SIZE = 2 * 1024 * 1024; // 2MB

function imageExt(file: File): string {
  const raw = (file.name?.split(".").pop() || "jpg").toLowerCase();
  return ["jpg", "jpeg", "png", "webp", "gif"].includes(raw) ? (raw === "jpeg" ? "jpg" : raw) : "jpg";
}

/**
 * Enregistre une image sous {dir}/{basename}.{ext}. Avec replaceVariants, supprime la même
 * image enregistrée sous une autre extension (image unique remplacée).
 */
async function storeImage(
  file: File,
  dir: string,
  basename: string,
  { maxSize = IMAGE_MAX, replaceVariants = false } = {}
): Promise<UploadResult> {
  const v = validateFile(file, { maxSize, allowedTypes: IMAGE_TYPES });
  if (!v.valid) throw new Error(v.error);

  const ext = imageExt(file);
  const filename = `${basename}.${ext}`;

  if (replaceVariants) {
    for (const other of IMAGE_EXTS) {
      if (other !== ext) await deleteObject(`${dir}/${basename}.${other}`);
    }
  }

  const bytes = await file.arrayBuffer();
  await putObject(`${dir}/${filename}`, new Uint8Array(bytes), file.type);

  return {
    filename,
    path: `/api/uploads/${dir}/${filename}`,
    size: file.size,
    mimetype: file.type,
  };
}

function uniqueName(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Supprime une image de galerie à partir de son chemin public /api/uploads/{section}/gallery/{id}/{fichier}. */
async function deleteGalleryImage(section: string, path: string): Promise<void> {
  const match = new RegExp(`^/api/uploads/${section}/gallery/([a-zA-Z0-9_-]+)/([a-zA-Z0-9_.-]+)$`).exec(path);
  if (!match) return;
  await deleteObject(`${section}/gallery/${match[1]}/${match[2]}`);
}

/** Photo de profil : profiles/{userId}.{ext}, remplace l'ancienne. */
export async function uploadProfilePicture(file: File, userId: string): Promise<UploadResult> {
  return storeImage(file, "profiles", userId, { maxSize: PROFILE_MAX_SIZE, replaceVariants: true });
}

/** Image principale d'une actualité : actualites/main/{id}.{ext}, remplace l'ancienne. */
export async function uploadActualiteMainImage(file: File, actualiteId: string): Promise<UploadResult> {
  return storeImage(file, "actualites/main", actualiteId, { replaceVariants: true });
}

/** Galerie d'une actualité : actualites/gallery/{id}/{unique}.{ext}, plusieurs images. */
export async function uploadActualiteGalleryImage(file: File, actualiteId: string): Promise<UploadResult> {
  return storeImage(file, `actualites/gallery/${actualiteId}`, uniqueName());
}

export async function deleteActualiteGalleryImage(path: string): Promise<void> {
  await deleteGalleryImage("actualites", path);
}

/** Image principale d'un article : articles/main/{id}.{ext}, remplace l'ancienne. */
export async function uploadArticleMainImage(file: File, articleId: string): Promise<UploadResult> {
  return storeImage(file, "articles/main", articleId, { replaceVariants: true });
}

/** Galerie d'un article : articles/gallery/{id}/{unique}.{ext}, plusieurs images. */
export async function uploadArticleGalleryImage(file: File, articleId: string): Promise<UploadResult> {
  return storeImage(file, `articles/gallery/${articleId}`, uniqueName());
}

export async function deleteArticleGalleryImage(path: string): Promise<void> {
  await deleteGalleryImage("articles", path);
}

/** Image principale d'un projet : projets/main/{id}.{ext}, remplace l'ancienne. */
export async function uploadProjetMainImage(file: File, projetId: string): Promise<UploadResult> {
  return storeImage(file, "projets/main", projetId, { replaceVariants: true });
}

/** Galerie d'un projet : projets/gallery/{id}/{unique}.{ext}, plusieurs images. */
export async function uploadProjetGalleryImage(file: File, projetId: string): Promise<UploadResult> {
  return storeImage(file, `projets/gallery/${projetId}`, uniqueName());
}

export async function deleteProjetGalleryImage(path: string): Promise<void> {
  await deleteGalleryImage("projets", path);
}

/** Galerie médias (photos d'événements) : medias/gallery/{id}/{unique}.{ext}. */
export async function uploadMediaGalleryImage(file: File, mediaId: string): Promise<UploadResult> {
  return storeImage(file, `medias/gallery/${mediaId}`, uniqueName());
}

export async function deleteMediaGalleryImage(path: string): Promise<void> {
  await deleteGalleryImage("medias", path);
}

const ASSOCIATION_PREFIX = "associations";
const ASSOCIATION_IMAGE_MAX = 5 * 1024 * 1024;
const ASSOCIATION_DOC_MAX = 10 * 1024 * 1024;
const ASSOCIATION_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ASSOCIATION_DOC_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"];
const ASSOCIATION_EXTS = ["jpg", "png", "webp", "gif", "pdf"];

function associationExt(file: File, allowPdf = false): string {
  const raw = (file.name?.split(".").pop() || "jpg").toLowerCase();
  const exts = ["jpg", "jpeg", "png", "webp", "gif"];
  if (allowPdf) exts.push("pdf");
  if (exts.includes(raw)) return raw === "jpeg" ? "jpg" : raw;
  return allowPdf && file.type === "application/pdf" ? "pdf" : "jpg";
}

/** Enregistre un fichier d'association (R2 ou disque) et supprime ses variantes d'extension. */
async function storeAssociationFile(
  file: File,
  associationId: string,
  kind: string,
  basename: string,
  ext: string,
  replaceVariants: boolean
): Promise<UploadResult> {
  const filename = `${basename}.${ext}`;
  const dir = `${ASSOCIATION_PREFIX}/${associationId}/${kind}`;

  if (replaceVariants) {
    for (const other of ASSOCIATION_EXTS) {
      if (other !== ext) await deleteObject(`${dir}/${basename}.${other}`);
    }
  }

  const bytes = await file.arrayBuffer();
  await putObject(`${dir}/${filename}`, new Uint8Array(bytes), file.type);

  return {
    filename,
    path: `/api/uploads/${dir}/${filename}`,
    size: file.size,
    mimetype: file.type,
  };
}

type AssociationSlot = "logo" | "statuts" | "reglement" | "recepisse" | "pv";

/**
 * Fichier unique par slot (logo, statuts, règlement, récépissé, PV). Remplace l'ancien.
 */
export async function uploadAssociationSlotFile(
  file: File,
  associationId: string,
  slot: AssociationSlot
): Promise<UploadResult> {
  const isLogo = slot === "logo";
  const v = validateFile(file, {
    maxSize: isLogo ? ASSOCIATION_IMAGE_MAX : ASSOCIATION_DOC_MAX,
    allowedTypes: isLogo ? ASSOCIATION_IMAGE_TYPES : ASSOCIATION_DOC_TYPES,
  });
  if (!v.valid) throw new Error(v.error);

  return storeAssociationFile(file, associationId, slot, slot, associationExt(file, !isLogo), true);
}

/**
 * Pièce d'identité d'un dirigeant. Une par dirigeant, remplace si existante.
 */
export async function uploadAssociationDirigeantPiece(
  file: File,
  associationId: string,
  dirigeantId: string
): Promise<UploadResult> {
  const v = validateFile(file, {
    maxSize: ASSOCIATION_DOC_MAX,
    allowedTypes: ASSOCIATION_DOC_TYPES,
  });
  if (!v.valid) throw new Error(v.error);

  return storeAssociationFile(file, associationId, "dirigeants", dirigeantId, associationExt(file, true), true);
}

/**
 * Document d'archive (rapports, PV, etc.). Plusieurs autorisés.
 */
export async function uploadAssociationDocument(
  file: File,
  associationId: string
): Promise<UploadResult> {
  const v = validateFile(file, {
    maxSize: ASSOCIATION_DOC_MAX,
    allowedTypes: ASSOCIATION_DOC_TYPES,
  });
  if (!v.valid) throw new Error(v.error);

  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return storeAssociationFile(file, associationId, "documents", unique, associationExt(file, true), false);
}

/**
 * Supprime un fichier d'association (path = /api/uploads/associations/{id}/{kind}/{filename}).
 */
export async function deleteAssociationFile(path: string): Promise<void> {
  const m = /^\/api\/uploads\/associations\/([a-zA-Z0-9_-]+)\/([a-z]+)\/([a-zA-Z0-9_.-]+)$/.exec(path);
  if (!m) return;
  await deleteObject(`${ASSOCIATION_PREFIX}/${m[1]}/${m[2]}/${m[3]}`);
}

/** Image insérée dans un texte riche (éditeur) : editor/{unique}.{ext}, jamais remplacée. */
export async function uploadEditorImage(file: File): Promise<UploadResult> {
  return storeImage(file, "editor", uniqueName());
}
