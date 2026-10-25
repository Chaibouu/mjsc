import Loader from "@/components/loader";

/** Chargement d'une page du back-office, dans la zone de contenu (le menu reste affiché). */
export default function Loading() {
  return <Loader className="min-h-[60vh]" />;
}
