import { headers } from "next/headers";

/**
 * En-têtes du navigateur à transmettre quand une server action appelle l'API
 * d'authentification depuis le serveur : sans eux, l'API verrait l'IP et le
 * navigateur du serveur (limitation de débit commune à tous, appareil enregistré faux).
 */
export async function clientRequestHeaders(): Promise<Record<string, string>> {
  const h = await headers();
  const out: Record<string, string> = {};

  const ip = h.get("x-forwarded-for") ?? h.get("x-real-ip");
  if (ip) out["x-forwarded-for"] = ip;

  const ua = h.get("user-agent");
  if (ua) out["user-agent"] = ua;

  return out;
}
