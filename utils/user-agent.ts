import { headers } from "next/headers";
import { lookupIpLocation } from "@/lib/geo";

// Fonction pour récupérer l'adresse IP
export async function getIp() {
  const headersList = await headers()
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  if (realIp) {
    return realIp.trim();
  }
  return null;
}

// Fonction pour récupérer les informations de géolocalisation à partir de l'adresse IP
export async function getGeoLocation(ip: string | null) {
  const geo = await lookupIpLocation(ip);
  if (!geo) return null;
  return {
    latitude: geo.latitude,
    longitude: geo.longitude,
    city: geo.city,
    country: geo.country,
  };
}
