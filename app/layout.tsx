import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/context/SessionContext";
import { getUser } from "@/actions/getUser";
import { generateMetadata as generateAppMetadata } from "@/lib/generateMetadata";
import { Suspense } from "react";
import { unstable_rethrow } from "next/navigation";
import { ErrorBoundary } from "@/components/error-boundary";
import NextTopLoader from 'nextjs-toploader';
import appConfig from "@/settings";

const inter = Inter({ subsets: ["latin"] });

// Utiliser la nouvelle API de métadonnées de Next.js 15
export async function generateMetadata() {
  return await generateAppMetadata();
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null;
  
  try {
    const result = await getUser();
    user = result?.user;
  } catch (error) {
    // Laisser passer les erreurs internes de Next (rendu dynamique, redirect...)
    unstable_rethrow(error);
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <Suspense fallback={<div>Loading...</div>}>
            <SessionProvider user={user?.user}>
            <NextTopLoader
            color={appConfig.secondaryColor}
            showSpinner={false}
            />
              {children}
              <Toaster />
            </SessionProvider>
          </Suspense>
        </ErrorBoundary>
      </body>
    </html>
  );
}
