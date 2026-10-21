/**
 * Gabarit unique des emails de la plateforme.
 *
 * Bonnes pratiques de délivrabilité appliquées :
 * - version HTML ET version texte (un email HTML seul est pénalisé par les filtres anti-spam) ;
 * - mise en page en tableaux avec styles en ligne (seul format lu partout : Gmail, Outlook…) ;
 * - logo joint dans l'email (aucune image distante bloquée ou suspecte) ;
 * - texte d'aperçu, lien en clair sous le bouton, contenu dynamique échappé.
 */
import appConfig from "@/settings";

export const EMAIL_LOGO_CID = "armoirie@mjsc";

export interface EmailContent {
  /** Texte d'aperçu affiché après l'objet dans la boîte de réception */
  preheader: string;
  title: string;
  /** Paragraphes de texte brut (échappés automatiquement) */
  paragraphs: string[];
  action?: { label: string; url: string };
  /** Informations complémentaires (durée de validité, conseils) */
  notes?: string[];
  /** Mention de sécurité en bas du message */
  securityNotice?: string;
}

const COLORS = {
  primary: appConfig.primaryColor,
  secondary: appConfig.secondaryColor,
  text: "#1f2937",
  muted: "#6b7280",
  background: "#f3f4f6",
  border: "#e5e7eb",
};

const FONT = "Arial, Helvetica, sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderHtml(c: EmailContent): string {
  const p = (text: string) =>
    `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:24px;color:${COLORS.text};">${escapeHtml(text)}</p>`;

  const button = c.action
    ? `
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
            <tr>
              <td align="center" bgcolor="${COLORS.primary}" style="border-radius:6px;">
                <a href="${escapeHtml(c.action.url)}" target="_blank"
                   style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">
                  ${escapeHtml(c.action.label)}
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 6px;font-family:${FONT};font-size:13px;line-height:20px;color:${COLORS.muted};">
            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
          </p>
          <p style="margin:0 0 24px;font-family:${FONT};font-size:13px;line-height:20px;word-break:break-all;">
            <a href="${escapeHtml(c.action.url)}" target="_blank" style="color:${COLORS.primary};">${escapeHtml(c.action.url)}</a>
          </p>`
    : "";

  const notes = c.notes?.length
    ? `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
            <tr>
              <td style="background:${COLORS.background};border-radius:6px;padding:14px 16px;">
                ${c.notes
                  .map(
                    (n) =>
                      `<p style="margin:0 0 4px;font-family:${FONT};font-size:13px;line-height:20px;color:${COLORS.muted};">&bull; ${escapeHtml(n)}</p>`
                  )
                  .join("")}
              </td>
            </tr>
          </table>`
    : "";

  const security = c.securityNotice
    ? `<p style="margin:0;padding-top:16px;border-top:1px solid ${COLORS.border};font-family:${FONT};font-size:13px;line-height:20px;color:${COLORS.muted};">${escapeHtml(c.securityNotice)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(c.title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.background};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(c.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.background};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- En-tête -->
          <tr>
            <td align="center" bgcolor="${COLORS.primary}" style="padding:24px 24px 20px;">
              <img src="cid:${EMAIL_LOGO_CID}" width="60" height="41" alt="Armoiries du Niger" style="display:block;border:0;margin:0 auto 10px;">
              <p style="margin:0;font-family:${FONT};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#d1fae5;">République du Niger</p>
              <p style="margin:4px 0 0;font-family:${FONT};font-size:16px;font-weight:bold;line-height:22px;color:#ffffff;">${escapeHtml(appConfig.appName)}</p>
            </td>
          </tr>
          <tr><td height="4" bgcolor="${COLORS.secondary}" style="font-size:0;line-height:0;">&nbsp;</td></tr>
          <!-- Contenu -->
          <tr>
            <td style="padding:32px 32px 28px;">
              <h1 style="margin:0 0 20px;font-family:${FONT};font-size:20px;line-height:28px;color:${COLORS.text};">${escapeHtml(c.title)}</h1>
              ${c.paragraphs.map(p).join("\n              ")}
              ${button}
              ${notes}
              ${security}
            </td>
          </tr>
          <!-- Pied de page -->
          <tr>
            <td style="padding:20px 32px;background:${COLORS.background};border-top:1px solid ${COLORS.border};">
              <p style="margin:0 0 4px;font-family:${FONT};font-size:12px;line-height:18px;color:${COLORS.muted};">${escapeHtml(appConfig.appName)} — République du Niger</p>
              <p style="margin:0;font-family:${FONT};font-size:12px;line-height:18px;color:${COLORS.muted};">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderText(c: EmailContent): string {
  const lines = [
    `${appConfig.appName} — République du Niger`,
    "",
    c.title,
    "",
    ...c.paragraphs.flatMap((p) => [p, ""]),
  ];
  if (c.action) lines.push(`${c.action.label} :`, c.action.url, "");
  if (c.notes?.length) lines.push(...c.notes.map((n) => `- ${n}`), "");
  if (c.securityNotice) lines.push(c.securityNotice, "");
  lines.push("Cet email a été envoyé automatiquement, merci de ne pas y répondre.");
  return lines.join("\n");
}

export function renderEmail(content: EmailContent): { html: string; text: string } {
  return { html: renderHtml(content), text: renderText(content) };
}
