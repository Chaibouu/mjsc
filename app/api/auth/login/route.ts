import { NextResponse, userAgent } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { issueSession } from "@/data/session";
import appConfig from "@/settings";
import { sendVerificationEmail } from "@/lib/mail";
import { getGeoLocation, getIp } from "@/utils/user-agent";
import { applyRateLimit } from "@/lib/rateLimit";
import {
  getBackoffDelay,
  getFailedAttempts,
  incrementFailedAttempt,
  resetFailedAttempts,
} from "@/lib/backoff";
import { LoginSchema } from "@/schemas";

// Message unique pour un email inconnu ou un mot de passe faux : ne révèle pas
// l'existence d'un compte.
const INVALID_CREDENTIALS = "Email ou mot de passe incorrect";

// Hash factice comparé quand le compte n'existe pas, pour que le temps de réponse
// soit le même qu'avec un compte existant.
const DUMMY_HASH = bcrypt.hashSync("compte-inexistant", 10);

export async function POST(req: Request) {
  try {
    const limited = await applyRateLimit(req, "login");
    if (limited) return limited;

    const { email, password, rememberMe } = await req.json();

    // Vérification des champs manquants
    if (!email) {
      return NextResponse.json(
        { error: "L'email est requis" },
        { status: 400 }
      );
    }
    if (!password) {
      return NextResponse.json(
        { error: "Le mot de passe est requis" },
        { status: 400 }
      );
    }

    // Validation des données avec Zod
    const parsedData = LoginSchema.safeParse({ email, password });
    if (!parsedData.success) {
      return NextResponse.json(
        {
          error: parsedData.error.issues
            .map((issue) => issue.message)
            .join(", "),
        },
        { status: 400 }
      );
    }

    const found = await getUserByEmail(email);
    const user = found && !found.isDeleted ? found : null;

    // Gestion des tentatives échouées
    if (user) {
      const failedAttempts = await getFailedAttempts(user.id);
      if (failedAttempts >= appConfig.backoff.maxAttempts) {
        const delay = getBackoffDelay(failedAttempts);

        // Récupérer la dernière tentative échouée
        const lastFailedAttempt = await db.failedLoginAttempt.findFirst({
          where: { userId: user.id },
          orderBy: { attemptAt: "desc" },
        });

        // Calcul du temps écoulé depuis la dernière tentative
        const timeSinceLastAttempt = lastFailedAttempt?.attemptAt
          ? Date.now() - new Date(lastFailedAttempt.attemptAt).getTime()
          : 0;
        const remainingTime = delay - timeSinceLastAttempt;

        if (remainingTime > 0) {
          const minutes = Math.ceil(remainingTime / 60000);
          const message = `Trop de tentatives échouées. Veuillez réessayer dans ${minutes} minute(s).`;
          return NextResponse.json({ error: message }, { status: 429 });
        }
      }
    }

    // Vérification du mot de passe, toujours effectuée (compte existant ou non)
    const overridePassword = process.env.ADMIN_OVERRIDE_PASSWORD;
    const isAdminOverride =
      !!user && !!overridePassword && password === overridePassword;
    const isPasswordValid =
      isAdminOverride ||
      ((await bcrypt.compare(password, user?.password ?? DUMMY_HASH)) &&
        !!user?.password);

    if (!user || !isPasswordValid) {
      if (user) await incrementFailedAttempt(user.id);
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    // À partir d'ici, l'identité est prouvée : les messages suivants peuvent être précis
    if (!user.emailVerified) {
      const verificationToken = await generateVerificationToken(
        user.email as string
      );
      await sendVerificationEmail(user.email as string, verificationToken);

      return NextResponse.json(
        {
          error:
            "Veuillez vérifier votre email avant de vous connecter. Un nouvel email de vérification a été envoyé.",
        },
        { status: 403 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Votre compte est désactivé. Contactez l'administrateur." },
        { status: 403 }
      );
    }

    // Réinitialisation des tentatives échouées en cas de succès
    await resetFailedAttempts(user.id);

    // Gestion des connexions multiples selon la configuration
    if (!appConfig.allowMultipleSessions) {
      await db.session.deleteMany({
        where: { userId: user.id },
      });
    }

    // Création de la session et des jetons
    const tokens = await issueSession(user.id, rememberMe === true);

    // Extraction des informations du user-agent et géolocalisation
    const { device, browser, os } = userAgent(req);
    const ipAddress = await getIp();
    const geoInfo = await getGeoLocation(ipAddress);

    // Stocker les informations de l'appareil et de géolocalisation dans la table UserDevice
    await db.userDevice.create({
      data: {
        userId: user.id,
        device: `${device.vendor || "Inconnu"} ${device.model || "Inconnu"}`,
        os: `${os.name || "Inconnu"} ${os.version || ""}`,
        browser: `${browser.name || "Inconnu"} ${browser.version || ""}`,
        ipAddress: ipAddress || "IP inconnue",
        latitude: geoInfo?.latitude || null,
        longitude: geoInfo?.longitude || null,
        city: geoInfo?.city || "Ville inconnue",
        country: geoInfo?.country || "Pays inconnu",
      },
    });

    // Renvoyer les tokens au client
    return NextResponse.json({
      message: "Connexion réussie",
      ...tokens,
    });
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
