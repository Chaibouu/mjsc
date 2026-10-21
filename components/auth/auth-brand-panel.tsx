import Image from "next/image";
import appConfig from "@/settings";

/**
 * Panneau gauche des pages d'authentification : armoirie, devise, nom du ministère
 * et un message propre à chaque page.
 */
export const AuthBrandPanel = ({ message }: { message: string }) => {
  return (
    <div
      className="p-8 flex flex-col justify-center items-center text-white relative overflow-hidden"
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
        <h1 className="text-2xl md:text-3xl font-bold mb-3 text-white">
          République du Niger
        </h1>

        {/* Devise */}
        <p className="text-sm mb-4 text-white/95">
          Fraternité – Travail – Progrès
        </p>

        {/* Nom du ministère */}
        <h2 className="text-lg md:text-xl font-semibold mb-8 text-white/90">
          {appConfig.appName}
        </h2>

        {/* Message propre à la page */}
        <div className="mt-8 space-y-4 text-left">
          <p className="text-white/95 text-center text-sm md:text-base leading-relaxed">
            {message}
          </p>
        </div>

        {/* Badge sécurisé */}
        <div className="mt-10 space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4 text-green-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-white/95 font-medium text-[9px] md:text-base">Système sécurisé</span>
          </div>
        </div>
      </div>
    </div>
  );
};
