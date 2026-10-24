/**
 * Réduction des images dans le navigateur avant l'envoi (Vercel limite une requête à 4,5 Mo).
 * Une photo de téléphone (4 à 8 Mo) passe généralement sous 500 Ko en 1920 px.
 */

const MAX_SIDE = 1920;
const QUALITY = 0.82;
/** En dessous, une image déjà aux bonnes dimensions est laissée telle quelle. */
const SMALL_ENOUGH = 300 * 1024;

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

function renamed(name: string, ext: string): string {
  const base = name.replace(/\.[^.]+$/, "") || "image";
  return `${base}.${ext}`;
}

/**
 * Redimensionne (plus grand côté ≤ 1920 px) et recompresse une image.
 * Les GIF (animations) et les fichiers non-images sont renvoyés sans changement,
 * comme toute image que la réduction n'aurait pas allégée.
 */
export async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  if (typeof createImageBitmap === "undefined") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // image illisible : la validation du formulaire s'en chargera
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= SMALL_ENOUGH) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // JPEG reste en JPEG ; PNG/WebP passent en WebP (garde la transparence).
  // Navigateur sans encodage WebP : toBlob renvoie du PNG, on se rabat alors sur JPEG.
  let type = file.type === "image/jpeg" ? "image/jpeg" : "image/webp";
  let blob = await canvasToBlob(canvas, type);
  if (blob && blob.type !== type) {
    type = "image/jpeg";
    blob = await canvasToBlob(canvas, type);
  }
  if (!blob || blob.size >= file.size) return file;

  return new File([blob], renamed(file.name, type === "image/jpeg" ? "jpg" : "webp"), {
    type,
    lastModified: Date.now(),
  });
}

export function shrinkImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(shrinkImage));
}
