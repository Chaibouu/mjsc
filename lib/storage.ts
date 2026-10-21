/**
 * Stockage des fichiers : Cloudflare R2 (API compatible S3) si configuré,
 * sinon disque local sous `uploads/` (développement).
 *
 * Les clés sont relatives, ex. "associations/{id}/statuts/statuts.pdf".
 */

import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { dirname, relative, resolve } from "path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const LOCAL_ROOT = "uploads";

export interface StoredObject {
  body: Uint8Array;
  contentType?: string;
}

let client: S3Client | null = null;

export function isR2Enabled(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET
  );
}

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
      },
    });
  }
  return client;
}

/** Résout une clé en chemin local, en refusant toute sortie du dossier racine. */
function localPath(key: string): string {
  const base = resolve(process.cwd(), LOCAL_ROOT);
  const filepath = resolve(base, key);
  const rel = relative(base, filepath);
  if (!rel || rel.startsWith("..") || rel.includes("..")) {
    throw new Error("Clé de stockage invalide");
  }
  return filepath;
}

export async function putObject(
  key: string,
  body: Uint8Array,
  contentType?: string
): Promise<void> {
  if (isR2Enabled()) {
    await getClient().send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    return;
  }

  const filepath = localPath(key);
  await mkdir(dirname(filepath), { recursive: true });
  await writeFile(filepath, body);
}

async function getLocalObject(key: string): Promise<StoredObject | null> {
  const filepath = localPath(key);
  if (!existsSync(filepath)) return null;
  return { body: new Uint8Array(await readFile(filepath)) };
}

/**
 * Lit un objet. Avec R2, se replie sur le disque local si l'objet n'existe pas
 * encore dans le bucket (fichiers envoyés avant la migration).
 */
export async function getObject(key: string): Promise<StoredObject | null> {
  if (isR2Enabled()) {
    try {
      const res = await getClient().send(
        new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key })
      );
      if (!res.Body) return null;
      return {
        body: await res.Body.transformToByteArray(),
        contentType: res.ContentType,
      };
    } catch (error) {
      if (!(error instanceof NoSuchKey)) throw error;
    }
  }

  return getLocalObject(key);
}

/** Supprime un objet (dans R2 et, le cas échéant, sa copie locale). */
export async function deleteObject(key: string): Promise<void> {
  if (isR2Enabled()) {
    await getClient().send(
      new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key })
    );
  }

  const filepath = localPath(key);
  if (existsSync(filepath)) await unlink(filepath);
}
