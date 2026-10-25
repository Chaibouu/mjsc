import { Utilisateurs } from "@/components/main/utilisateurs";

type PageProps = {
  searchParams: Promise<{ page?: string; search?: string; role?: string; status?: string }>;
};

// La liste est chargée côté client (React Query) : la page s'affiche immédiatement,
// puis les données arrivent et restent en cache entre deux visites.
export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <Utilisateurs
      initialPage={Math.max(1, parseInt(params?.page ?? "1", 10) || 1)}
      initialSearch={typeof params?.search === "string" ? params.search : ""}
      initialRole={params?.role}
      initialStatus={params?.status}
    />
  );
}
