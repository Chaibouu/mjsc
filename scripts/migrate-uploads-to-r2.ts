/**
 * Copie dans Cloudflare R2 les fichiers encore présents sur le disque local (uploads/).
 * Les clés reprennent le chemin relatif (ex. articles/main/{id}.jpg), comme lib/storage
 * (script autonome : pas d'import de lib/, pour tourner directement avec ts-node).
 *
 * Usage : npm run uploads:migrate            (copie ce qui manque dans le bucket)
 *         npm run uploads:migrate -- --dry   (liste seulement)
 *
 * Les fichiers locaux ne sont pas supprimés : à faire à la main une fois la copie vérifiée.
 */
import { readdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import { join, relative, sep } from "path";
import { HeadObjectCommand, NotFound, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const ROOT = join(process.cwd(), "uploads");
const SECTIONS = ["profiles", "actualites", "articles", "projets", "medias", "associations"];
const MIMES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
};

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile()) yield full;
  }
}

async function main() {
  if (existsSync(".env")) process.loadEnvFile(".env");
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    console.error("R2 n'est pas configuré (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET).");
    process.exit(1);
  }
  const dry = process.argv.includes("--dry");

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  let copied = 0;
  let skipped = 0;
  for (const section of SECTIONS) {
    const dir = join(ROOT, section);
    if (!existsSync(dir)) continue;

    for await (const file of walk(dir)) {
      const key = relative(ROOT, file).split(sep).join("/");
      try {
        await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
        skipped++;
        continue;
      } catch (e) {
        if (!(e instanceof NotFound) && (e as { name?: string }).name !== "NotFound") throw e;
      }

      const ext = key.split(".").pop()?.toLowerCase() ?? "";
      if (dry) {
        console.log(`[à copier] ${key}`);
      } else {
        await s3.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: new Uint8Array(await readFile(file)),
            ContentType: MIMES[ext],
          })
        );
        console.log(`[copié] ${key}`);
      }
      copied++;
    }
  }

  console.log(`${dry ? "À copier" : "Copiés"} : ${copied}, déjà présents dans R2 : ${skipped}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
