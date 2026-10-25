const appConfig = {
  appName: "Ministère de la Jeunesse, des Sports et de la Culture",
  websiteTitle: "MJSC Niger - Ministère de la Jeunesse, des Sports et de la Culture",
  websiteDescription:
    "Site officiel du Ministère de la Jeunesse, des Sports et de la Culture du Niger. Découvrez nos programmes, actualités et opportunités pour la jeunesse, le sport et la culture.",
  logoUrl: "/armoirie.png",
  sidebarClearlogoUrl: "/armoirie-back.png",
  adminSidebarColor: "#1C2434",
  // Serveur SMTP (variables EMAIL_SERVER_* du .env).
  // Port 465 : TLS direct ; port 587 : STARTTLS (secure doit alors être false).
  mailOptions: {
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT) || 587,
    secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  },
  publicRoutes: [
    "/",
    "/a-propos",
    "/contact",
    "/galerie",
    "/jeunesse",
    "/sports",
    "/culture",
    "/opportunites",
  ],
  defaultLoginRedirect: "/dashboard",
  primaryColor: "#035740", 
  pprimaryColor: "#146934", 
  secondaryColor: "#E26E12", 
  primaryDarkColor: "#024a36",
  secondaryDarkColor: "#d45a08",
  primaryLightColor: "#57b58f",
  secondaryLightColor: "#f7bc7a",
  primaryTransparentColor: "#03574020",
  secondaryTransparentColor: "#E26E1220",
  primaryLightTransparentColor: "#03574010",
  secondaryLightTransparentColor: "#E26E1210",

  // Ajout d'une option pour autoriser ou non les connexions multiples
  allowMultipleSessions: false, // ou false pour invalider les anciennes sessions
  // Durées de vie des jetons (en secondes)
  auth: {
    accessTokenTtl: 60 * 60, // 1 heure, à la connexion comme après un refresh
    refreshTokenTtl: 7 * 24 * 60 * 60, // 7 jours
    refreshTokenTtlRememberMe: 30 * 24 * 60 * 60, // 30 jours ("se souvenir de moi")
    // Délai pendant lequel l'ancien refresh token reste accepté après une rotation
    // (requêtes parallèles du même navigateur). Au-delà, sa réutilisation révoque la session.
    refreshReuseGraceSeconds: 60,
  },
  // Limitation de débit par IP et par route d'authentification (stockée en base)
  rateLimit: {
    login: { max: 10, windowMs: 15 * 60 * 1000 },
    signup: { max: 5, windowMs: 60 * 60 * 1000 },
    "forgot-password": { max: 5, windowMs: 60 * 60 * 1000 },
    "resend-verification": { max: 5, windowMs: 60 * 60 * 1000 },
    "reset-password": { max: 10, windowMs: 60 * 60 * 1000 },
    verify: { max: 20, windowMs: 60 * 60 * 1000 },
    "change-email": { max: 10, windowMs: 60 * 60 * 1000 },
    "change-password": { max: 10, windowMs: 60 * 60 * 1000 },
    contact: { max: 5, windowMs: 60 * 60 * 1000 },
  },
  // Configuration du Backoff progressif
  backoff: {
    maxAttempts: 5, // Nombre maximal de tentatives de connexion avant blocage
    backoffDelayFactor: 2, // Facteur de progression du backoff (multiplicateur)
  },
};

export default appConfig;
