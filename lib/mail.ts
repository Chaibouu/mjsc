import path from "node:path";
import nodemailer, { TransportOptions } from "nodemailer";
import appConfig from "@/settings";
import { EMAIL_LOGO_CID, renderEmail, type EmailContent } from "@/lib/email/template";

const domain = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");
const transporter = nodemailer.createTransport(
  appConfig.mailOptions as TransportOptions
);

// Expéditeur : EMAIL_FROM, sinon le compte SMTP
const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER;
const sender = `"${appConfig.appName}" <${fromAddress}>`;

const SECURITY_NOTICE =
  "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : aucune modification ne sera faite sur votre compte.";

/** Envoie un email transactionnel au gabarit de la plateforme (HTML + texte, logo joint). */
async function sendTemplatedEmail(
  to: string,
  subject: string,
  content: EmailContent,
  options: { replyTo?: string } = {}
) {
  const replyTo = options.replyTo || process.env.EMAIL_REPLY_TO;
  const { html, text } = renderEmail(content);

  await transporter.sendMail({
    from: sender,
    to,
    subject,
    html,
    text,
    ...(replyTo && { replyTo }),
    // Signale un email automatique (évite les réponses automatiques d'absence)
    headers: {
      "Auto-Submitted": "auto-generated",
      "X-Auto-Response-Suppress": "OOF, AutoReply",
    },
    attachments: [
      {
        filename: "armoirie.png",
        path: path.join(process.cwd(), "public/email/armoirie-email.png"),
        cid: EMAIL_LOGO_CID,
      },
    ],
  });
}

export const sendTwoFactorTokenEmail = async (email: string, token: string) => {
  await sendTemplatedEmail(email, "Votre code de connexion", {
    preheader: `Votre code de connexion : ${token}`,
    title: "Votre code de connexion",
    paragraphs: [
      "Saisissez le code ci-dessous pour terminer votre connexion :",
      token,
    ],
    notes: ["Ce code est valable 5 minutes.", "Ne le communiquez à personne."],
    securityNotice:
      "Si vous n'avez pas tenté de vous connecter, changez votre mot de passe dès que possible.",
  });
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${domain}/auth/reset-password?token=${encodeURIComponent(token)}`;

  await sendTemplatedEmail(email, "Réinitialisation de votre mot de passe", {
    preheader: "Choisissez un nouveau mot de passe pour votre compte.",
    title: "Réinitialisation de votre mot de passe",
    paragraphs: [
      "Bonjour,",
      "Nous avons reçu une demande de réinitialisation du mot de passe de votre compte. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.",
    ],
    action: { label: "Choisir un nouveau mot de passe", url: resetLink },
    notes: [
      "Ce lien est valable 1 heure et ne peut servir qu'une fois.",
      "Après la réinitialisation, toutes vos sessions ouvertes seront fermées.",
    ],
    securityNotice: SECURITY_NOTICE,
  });
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${domain}/auth/verify?token=${encodeURIComponent(token)}`;

  await sendTemplatedEmail(email, "Confirmez votre adresse email", {
    preheader: "Une dernière étape pour activer votre compte.",
    title: "Confirmez votre adresse email",
    paragraphs: [
      "Bonjour,",
      `Merci de vous être inscrit sur la plateforme du ${appConfig.appName}. Pour activer votre compte, confirmez votre adresse email en cliquant sur le bouton ci-dessous.`,
    ],
    action: { label: "Confirmer mon adresse email", url: confirmLink },
    notes: ["Ce lien est valable 1 heure."],
    securityNotice:
      "Si vous n'avez pas créé de compte, ignorez cet email : aucun compte ne sera activé.",
  });
};

export const sendChangeEmailVerification = async (
  email: string,
  verificationToken: string
) => {
  const verificationLink = `${domain}/auth/verify-email?token=${encodeURIComponent(verificationToken)}`;

  await sendTemplatedEmail(email, "Confirmez votre nouvelle adresse email", {
    preheader: "Confirmez le changement d'adresse email de votre compte.",
    title: "Confirmez votre nouvelle adresse email",
    paragraphs: [
      "Bonjour,",
      "Vous avez demandé à utiliser cette adresse pour votre compte. Cliquez sur le bouton ci-dessous pour confirmer le changement.",
    ],
    action: { label: "Confirmer cette adresse", url: verificationLink },
    notes: ["Ce lien est valable 1 heure.", "Votre ancienne adresse reste active tant que vous n'avez pas confirmé."],
    securityNotice: SECURITY_NOTICE,
  });
};

/** Transmet un message du formulaire de contact du site (réponse directe à l'expéditeur). */
export const sendContactMessageEmail = async (message: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) => {
  const to = process.env.CONTACT_EMAIL || process.env.SUPER_ADMIN_EMAIL || fromAddress;
  if (!to) throw new Error("Aucune adresse de réception configurée (CONTACT_EMAIL)");

  await sendTemplatedEmail(
    to,
    `[Contact] ${message.subject}`,
    {
      preheader: `Message de ${message.name} : ${message.subject}`,
      title: "Nouveau message depuis le site",
      paragraphs: [
        `De : ${message.name} <${message.email}>`,
        `Sujet : ${message.subject}`,
        ...message.message.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean),
      ],
      notes: ["Répondez directement à cet email pour écrire à l'expéditeur."],
    },
    { replyTo: message.email }
  );
};
