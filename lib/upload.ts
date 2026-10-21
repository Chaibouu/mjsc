/**
 * Utilitaires pour la gestion des uploads de fichiers
 */

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { deleteObject, putObject } from "@/lib/storage";

export interface UploadOptions {
  maxSize?: number; // Taille maximale en bytes
  allowedTypes?: string[]; // Types MIME autorisés
  destination?: string; // Dossier de destination
}

export interface UploadResult {
  filename: string;
  path: string;
  size: number;
  mimetype: string;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_DESTINATION = "public/uploads";

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

/**
 * Upload un fichier vers le système de fichiers
 */
export async function uploadFile(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  // Valider le fichier
  const validation = validateFile(file, options);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Préparer le chemin de destination
  const destination = options.destination || DEFAULT_DESTINATION;
  const uploadDir = join(process.cwd(), destination);

  // Créer le dossier s'il n'existe pas
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // Générer un nom de fichier unique
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split(".").pop();
  const filename = `${timestamp}-${randomString}.${extension}`;
  const filepath = join(uploadDir, filename);

  // Convertir le File en Uint8Array et l'écrire
  const bytes = await file.arrayBuffer();
  const buffer = new Uint8Array(bytes);
  await writeFile(filepath, buffer);

  return {
    filename,
    path: `/${destination}/${filename}`,
    size: file.size,
    mimetype: file.type,
  };
}

/**
 * Upload depuis un FormData (pour les API routes)
 */
export async function uploadFromFormData(
  formData: FormData,
  fieldName: string = "file",
  options: UploadOptions = {}
): Promise<UploadResult> {
  const file = formData.get(fieldName) as File;

  if (!file) {
    throw new Error(`Aucun fichier trouvé dans le champ "${fieldName}"`);
  }

  return uploadFile(file, options);
}

/**
 * Supprime un fichier uploadé
 */
export async function deleteUploadedFile(filepath: string): Promise<void> {
  const { unlink } = await import("fs/promises");
  const fullPath = join(process.cwd(), filepath);

  if (existsSync(fullPath)) {
    await unlink(fullPath);
  }
}

const PROFILE_UPLOAD_DIR = "uploads/profiles";
const PROFILE_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const PROFILE_ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Upload une photo de profil : stockée en local par userId, remplace l'ancienne si elle existe.
 */
export async function uploadProfilePicture(
  file: File,
  userId: string
): Promise<UploadResult> {
  const validation = validateFile(file, {
    maxSize: PROFILE_MAX_SIZE,
    allowedTypes: PROFILE_ALLOWED,
  });
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const uploadDir = join(process.cwd(), PROFILE_UPLOAD_DIR);
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const raw = (file.name?.split(".").pop() || "jpg").toLowerCase();
  const ext = ["jpg", "jpeg", "png", "webp", "gif"].includes(raw) ? raw === "jpeg" ? "jpg" : raw : "jpg";
  const filename = `${userId}.${ext}`;
  const filepath = join(uploadDir, filename);

  const { readdir, unlink } = await import("fs/promises");
  const files = await readdir(uploadDir).catch(() => []);
  for (const f of files) {
    if (f.startsWith(`${userId}.`) && f !== filename) {
      await unlink(join(uploadDir, f));
    }
  }

  const bytes = await file.arrayBuffer();
  await writeFile(filepath, new Uint8Array(bytes));

  return {
    filename,
    path: `/api/uploads/profiles/${filename}`,
    size: file.size,
    mimetype: file.type,
  };
}

const ACTUALITES_MAIN_DIR = "uploads/actualites/main";
const ACTUALITES_GALLERY_DIR = "uploads/actualites/gallery";
const ACTUALITES_IMAGE_MAX = 5 * 1024 * 1024; // 5MB
const ACTUALITES_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function actualiteExt(file: File): string {
  const raw = (file.name?.split(".").pop() || "jpg").toLowerCase();
  return ["jpg", "jpeg", "png", "webp", "gif"].includes(raw) ? (raw === "jpeg" ? "jpg" : raw) : "jpg";
}

/**
 * Image principale d'une actualité : uploads/actualites/main/{id}.{ext}, remplace l'ancienne.
 */
export async function uploadActualiteMainImage(
  file: File,
  actualiteId: string
): Promise<UploadResult> {
  const v = validateFile(file, { maxSize: ACTUALITES_IMAGE_MAX, allowedTypes: ACTUALITES_IMAGE_TYPES });
  if (!v.valid) throw new Error(v.error);

  const dir = join(process.cwd(), ACTUALITES_MAIN_DIR);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });

  const ext = actualiteExt(file);
  const filename = `${actualiteId}.${ext}`;
  const filepath = join(dir, filename);

  const { readdir, unlink } = await import("fs/promises");
  const files = await readdir(dir).catch(() => []);
  for (const f of files) {
    if (f.startsWith(`${actualiteId}.`) && f !== filename) {
      await unlink(join(dir, f));
    }
  }

  const bytes = await file.arrayBuffer();
  await writeFile(filepath, new Uint8Array(bytes));

  return {
    filename,
    path: `/api/uploads/actualites/main/${filename}`,
    size: file.size,
    mimetype: file.type,
  };
}

/**
 * Galerie d'une actualité : uploads/actualites/gallery/{id}/{unique}.{ext}, plusieurs images.
 */
export async function uploadActualiteGalleryImage(
  file: File,
  actualiteId: string
): Promise<UploadResult> {
  const v = validateFile(file, { maxSize: ACTUALITES_IMAGE_MAX, allowedTypes: ACTUALITES_IMAGE_TYPES });
  if (!v.valid) throw new Error(v.error);

  const base = join(process.cwd(), ACTUALITES_GALLERY_DIR, actualiteId);
  if (!existsSync(base)) await mkdir(base, { recursive: true });

  const ext = actualiteExt(file);
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const filename = `${unique}.${ext}`;
  const filepath = join(base, filename);

  const bytes = await file.arrayBuffer();
  await writeFile(filepath, new Uint8Array(bytes));

  return {
    filename,
    path: `/api/uploads/actualites/gallery/${actualiteId}/${filename}`,
    size: file.size,
    mimetype: file.type,
  };
}

/**
 * Supprime un fichier de la galerie (path = /api/uploads/actualites/gallery/{id}/{filename}).
 */
export async function deleteActualiteGalleryImage(path: string): Promise<void> {
  const match = /^\/api\/uploads\/actualites\/gallery\/([^/]+)\/([^/]+)$/.exec(path);
  if (!match) return;
  const base = join(process.cwd(), ACTUALITES_GALLERY_DIR, match[1]);
  const filepath = join(base, match[2]);
  const { unlink } = await import("fs/promises");
  if (existsSync(filepath)) await unlink(filepath);
}

const ARTICLES_MAIN_DIR = "uploads/articles/main";
const ARTICLES_GALLERY_DIR = "uploads/articles/gallery";
const ARTICLES_IMAGE_MAX = 5 * 1024 * 1024; // 5MB
const ARTICLES_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function articleExt(file: File): string {
  const raw = (file.name?.split(".").pop() || "jpg").toLowerCase();
  return ["jpg", "jpeg", "png", "webp", "gif"].includes(raw) ? (raw === "jpeg" ? "jpg" : raw) : "jpg";
}

/**
 * Image principale d'un article : uploads/articles/main/{id}.{ext}, remplace l'ancienne.
 */
export async function uploadArticleMainImage(
  file: File,
  articleId: string
): Promise<UploadResult> {
  const v = validateFile(file, { maxSize: ARTICLES_IMAGE_MAX, allowedTypes: ARTICLES_IMAGE_TYPES });
  if (!v.valid) throw new Error(v.error);

  const dir = join(process.cwd(), ARTICLES_MAIN_DIR);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });

  const ext = articleExt(file);
  const filename = `${articleId}.${ext}`;
  const filepath = join(dir, filename);

  const { readdir, unlink } = await import("fs/promises");
  const files = await readdir(dir).catch(() => []);
  for (const f of files) {
    if (f.startsWith(`${articleId}.`) && f !== filename) {
      await unlink(join(dir, f));
    }
  }

  const bytes = await file.arrayBuffer();
  await writeFile(filepath, new Uint8Array(bytes));

  return {
    filename,
    path: `/api/uploads/articles/main/${filename}`,
    size: file.size,
    mimetype: file.type,
  };
}

/**
 * Galerie d'un article : uploads/articles/gallery/{id}/{unique}.{ext}, plusieurs images.
 */
export async function uploadArticleGalleryImage(
  file: File,
  articleId: string
): Promise<UploadResult> {
  const v = validateFile(file, { maxSize: ARTICLES_IMAGE_MAX, allowedTypes: ARTICLES_IMAGE_TYPES });
  if (!v.valid) throw new Error(v.error);

  const base = join(process.cwd(), ARTICLES_GALLERY_DIR, articleId);
  if (!existsSync(base)) await mkdir(base, { recursive: true });

  const ext = articleExt(file);
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const filename = `${unique}.${ext}`;
  const filepath = join(base, filename);

  const bytes = await file.arrayBuffer();
  await writeFile(filepath, new Uint8Array(bytes));

  return {
    filename,
    path: `/api/uploads/articles/gallery/${articleId}/${filename}`,
    size: file.size,
    mimetype: file.type,
  };
}

/**
 * Supprime un fichier de la galerie (path = /api/uploads/articles/gallery/{id}/{filename}).
 */
export async function deleteArticleGalleryImage(path: string): Promise<void> {
  const match = /^\/api\/uploads\/articles\/gallery\/([^/]+)\/([^/]+)$/.exec(path);
  if (!match) return;
  const base = join(process.cwd(), ARTICLES_GALLERY_DIR, match[1]);
  const filepath = join(base, match[2]);
  const { unlink } = await import("fs/promises");
  if (existsSync(filepath)) await unlink(filepath);
}

const PROJETS_MAIN_DIR = "uploads/projets/main";
const PROJETS_GALLERY_DIR = "uploads/projets/gallery";
const PROJETS_IMAGE_MAX = 5 * 1024 * 1024; // 5MB
const PROJETS_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function projetExt(file: File): string {
  const raw = (file.name?.split(".").pop() || "jpg").toLowerCase();
  return ["jpg", "jpeg", "png", "webp", "gif"].includes(raw) ? (raw === "jpeg" ? "jpg" : raw) : "jpg";
}

/**
 * Image principale d'un projet : uploads/projets/main/{id}.{ext}, remplace l'ancienne.
 */
export async function uploadProjetMainImage(
  file: File,
  projetId: string
): Promise<UploadResult> {
  const v = validateFile(file, { maxSize: PROJETS_IMAGE_MAX, allowedTypes: PROJETS_IMAGE_TYPES });
  if (!v.valid) throw new Error(v.error);

  const dir = join(process.cwd(), PROJETS_MAIN_DIR);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });

  const ext = projetExt(file);
  const filename = `${projetId}.${ext}`;
  const filepath = join(dir, filename);

  const { readdir, unlink } = await import("fs/promises");
  const files = await readdir(dir).catch(() => []);
  for (const f of files) {
    if (f.startsWith(`${projetId}.`) && f !== filename) {
      await unlink(join(dir, f));
    }
  }

  const bytes = await file.arrayBuffer();
  await writeFile(filepath, new Uint8Array(bytes));

  return {
    filename,
    path: `/api/uploads/projets/main/${filename}`,
    size: file.size,
    mimetype: file.type,
  };
}

/**
 * Galerie d'un projet : uploads/projets/gallery/{id}/{unique}.{ext}, plusieurs images.
 */
export async function uploadProjetGalleryImage(
  file: File,
  projetId: string
): Promise<UploadResult> {
  const v = validateFile(file, { maxSize: PROJETS_IMAGE_MAX, allowedTypes: PROJETS_IMAGE_TYPES });
  if (!v.valid) throw new Error(v.error);

  const base = join(process.cwd(), PROJETS_GALLERY_DIR, projetId);
  if (!existsSync(base)) await mkdir(base, { recursive: true });

  const ext = projetExt(file);
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const filename = `${unique}.${ext}`;
  const filepath = join(base, filename);

  const bytes = await file.arrayBuffer();
  await writeFile(filepath, new Uint8Array(bytes));

  return {
    filename,
    path: `/api/uploads/projets/gallery/${projetId}/${filename}`,
    size: file.size,
    mimetype: file.type,
  };
}

/**
 * Supprime un fichier de la galerie (path = /api/uploads/projets/gallery/{id}/{filename}).
 */
export async function deleteProjetGalleryImage(path: string): Promise<void> {
  const match = /^\/api\/uploads\/projets\/gallery\/([^/]+)\/([^/]+)$/.exec(path);
  if (!match) return;
  const base = join(process.cwd(), PROJETS_GALLERY_DIR, match[1]);
  const filepath = join(base, match[2]);
  const { unlink } = await import("fs/promises");
  if (existsSync(filepath)) await unlink(filepath);
}

const MEDIAS_GALLERY_DIR = "uploads/medias/gallery";
const MEDIAS_IMAGE_MAX = 5 * 1024 * 1024; // 5MB
const MEDIAS_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function mediaExt(file: File): string {
  const raw = (file.name?.split(".").pop() || "jpg").toLowerCase();
  return ["jpg", "jpeg", "png", "webp", "gif"].includes(raw) ? (raw === "jpeg" ? "jpg" : raw) : "jpg";
}

/**
 * Galerie médias (photos d'événements) : uploads/medias/gallery/{id}/{unique}.{ext}.
 */
export async function uploadMediaGalleryImage(
  file: File,
  mediaId: string
): Promise<UploadResult> {
  const v = validateFile(file, { maxSize: MEDIAS_IMAGE_MAX, allowedTypes: MEDIAS_IMAGE_TYPES });
  if (!v.valid) throw new Error(v.error);

  const base = join(process.cwd(), MEDIAS_GALLERY_DIR, mediaId);
  if (!existsSync(base)) await mkdir(base, { recursive: true });

  const ext = mediaExt(file);
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const filename = `${unique}.${ext}`;
  const filepath = join(base, filename);

  const bytes = await file.arrayBuffer();
  await writeFile(filepath, new Uint8Array(bytes));

  return {
    filename,
    path: `/api/uploads/medias/gallery/${mediaId}/${filename}`,
    size: file.size,
    mimetype: file.type,
  };
}

/**
 * Supprime un fichier de la galerie (path = /api/uploads/medias/gallery/{id}/{filename}).
 */
export async function deleteMediaGalleryImage(path: string): Promise<void> {
  const match = /^\/api\/uploads\/medias\/gallery\/([^/]+)\/([^/]+)$/.exec(path);
  if (!match) return;
  const base = join(process.cwd(), MEDIAS_GALLERY_DIR, match[1]);
  const filepath = join(base, match[2]);
  const { unlink } = await import("fs/promises");
  if (existsSync(filepath)) await unlink(filepath);
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
