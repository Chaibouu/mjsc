import Image from "next/image";
import appConfig from "@/settings";
import { cn } from "@/lib/utils";

/**
 * Panneau gauche des pages d'authentification : armoirie, devise, nom du ministère
 * et un message propre à chaque page. Masqué sur téléphone (voir AuthMobileBrand).
 */
export const AuthBrandPanel = ({ message }: { message: string }) => {
  return (
    <div
      className="hidden md:flex p-8 flex-col justify-center items-center text-white relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${appConfig.primaryColor} 0%, ${appConfig.primaryDarkColor} 100%)`,
      }}
    >
      {/* Formes décoratives */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>

      {/* Contenu */}
      <div className="relative z-10 text-center px-6">
        {/* Logo MJSC */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 md:w-28 md:h-28 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/30">
            <Image
              src="/armoirie.png"
              alt="Logo MJSC"
              width={96}
              height={96}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Titre principal */}
        <h1 className="text-xl lg:text-2xl font-bold mb-2 text-white">
          République du Niger
        </h1>

        {/* Devise */}
        <p className="text-xs mb-3 text-white/95">
          Fraternité – Travail – Progrès
        </p>

        {/* Nom du ministère */}
        <h2 className="text-base lg:text-lg font-semibold mb-6 text-white/90">
          {appConfig.appName}
        </h2>

        {/* Message propre à la page */}
        <div className="mt-6 space-y-4 text-left">
          <p className="text-white/95 text-center text-xs lg:text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Badge sécurisé */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4 text-green-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-white/95 font-medium text-xs lg:text-sm">Système sécurisé</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * En-tête des pages d'authentification sur téléphone, à la place du panneau :
 * armoirie, République du Niger et nom du ministère au-dessus du formulaire.
 */
export const AuthMobileBrand = ({ className }: { className?: string }) => {
  return (
    <div className={cn("mb-6 flex flex-col items-center text-center md:hidden", className)}>
      <Image
        src="/armoirie.png"
        alt="Armoiries du Niger"
        width={88}
        height={88}
        className="h-20 w-auto object-contain"
        priority
      />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        République du Niger
      </p>
      <p className="mt-1 text-sm font-bold leading-snug text-primaryColor">
        {appConfig.appName}
      </p>
    </div>
  );
};
