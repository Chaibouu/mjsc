// Interface pour les informations de géolocalisation
export interface GeoInfo {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

// Fonction pour extraire l'IP de manière compatible avec tous les hébergeurs
export function getClientIP(req: { headers: Headers }): string {
  const headers = [
    "x-forwarded-for",
    "x-real-ip",
    "x-client-ip",
    "cf-connecting-ip", // Cloudflare
    "x-forwarded",
    "forwarded-for",
    "forwarded"
  ];

  for (const header of headers) {
    const value = req.headers.get(header);
    if (value) {
      const ip = value.split(",")[0].trim();
      if (ip && ip !== "unknown") {
        return ip;
      }
    }
  }

  return "127.0.0.1";
}

// Adresses locales ou privées : aucune géolocalisation possible
export function isPrivateIP(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    /^f[cd][0-9a-f]{2}:/i.test(ip)
  );
}

/**
 * Géolocalise une adresse IP via un service HTTPS (ipwho.is), avec un délai maximal
 * de 3 secondes. Retourne null si l'IP est locale ou si le service ne répond pas.
 */
export async function lookupIpLocation(ip: string | null): Promise<GeoInfo | null> {
  if (!ip || isPrivateIP(ip)) return null;

  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    const data = await response.json();

    if (data?.success) {
      return {
        country: data.country,
        region: data.region,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone?.id,
      };
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de la géolocalisation:", error);
  }

  return null;
}

// Fonction pour obtenir les informations de géolocalisation d'une requête
export async function getGeoInfo(req: { headers: Headers }): Promise<GeoInfo> {
  const ip = getClientIP(req);
  if (isPrivateIP(ip)) {
    return { country: "Local", city: "Development" };
  }
  return (await lookupIpLocation(ip)) ?? {};
}

// Fonction pour vérifier si l'IP est dans une liste de pays autorisés
export function isCountryAllowed(geoInfo: GeoInfo, allowedCountries: string[]): boolean {
  if (!allowedCountries.length) return true;
  if (!geoInfo.country) return true; // Si on ne peut pas déterminer le pays, autoriser
  
  return allowedCountries.includes(geoInfo.country);
}

// Fonction pour obtenir le fuseau horaire de l'utilisateur
export function getUserTimezone(geoInfo: GeoInfo): string {
  return geoInfo.timezone || "UTC";
} 