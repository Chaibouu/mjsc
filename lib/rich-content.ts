import sanitizeHtml from "sanitize-html";
import { htmlToText } from "@/lib/html-text";

const COLOR = [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s,.%]+\)$/i, /^hsla?\([\d\s,.%]+\)$/i];

/** Images envoyées depuis l'éditeur, servies par le site (voir /api/editor/images). */
const LOCAL_IMAGE = /^\/api\/uploads\/editor\/[a-zA-Z0-9_.-]+$/;

/**
 * Nettoie le HTML produit par l'éditeur riche (components/ui/rich-text-editor.tsx) avant
 * enregistrement : seules les balises et propriétés de mise en forme sont conservées
 * (pas de script ni de gestionnaire d'événement ; liens http(s)/mailto/tel ; images en https
 * ou envoyées sur le site ; vidéos YouTube uniquement).
 */
export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "hr", "span", "div",
      "h1", "h2", "h3", "h4",
      "strong", "b", "em", "i", "u", "s", "code", "pre", "mark", "sub", "sup",
      "blockquote",
      "ul", "ol", "li", "label", "input",
      "a", "img",
      "table", "thead", "tbody", "tfoot", "tr", "th", "td", "colgroup", "col",
      "iframe",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height"],
      // data-youtube-video : sans lui, l'éditeur ne reconnaît plus la vidéo à la réouverture
      div: ["data-youtube-video"],
      "*": ["style", "data-type", "data-checked", "data-color", "colspan", "rowspan", "colwidth"],
      input: ["type", "checked", "disabled"],
      iframe: ["src", "width", "height", "allowfullscreen", "frameborder", "title"],
      col: ["span", "style"],
    },
    allowedStyles: {
      "*": {
        color: COLOR,
        "background-color": COLOR,
        "text-align": [/^(left|right|center|justify)$/],
        width: [/^\d+(\.\d+)?(px|%)$/],
        "min-width": [/^\d+(\.\d+)?px$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https"], iframe: ["https"] },
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com"],
    exclusiveFilter: (frame) =>
      // Image sans adresse valide : https, ou fichier envoyé sur le site
      frame.tag === "img" &&
      !(/^https:\/\//i.test(frame.attribs.src ?? "") || LOCAL_IMAGE.test(frame.attribs.src ?? "")),
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          // Les liens externes s'ouvrent dans un nouvel onglet sans accès à la page d'origine
          ...(attribs.href && /^https?:/i.test(attribs.href)
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {}),
        },
      }),
      input: (tagName, attribs) => ({
        tagName,
        attribs: {
          type: "checkbox",
          disabled: "disabled",
          ...(attribs.checked !== undefined ? { checked: "checked" } : {}),
        },
      }),
    },
  });
}

/** Texte brut d'un contenu HTML (aperçu court, ou savoir s'il est vide). */
export function toPlainText(content: string | null | undefined): string {
  if (!content) return "";
  return htmlToText(sanitizeRichHtml(content));
}

/**
 * Description reçue d'un formulaire : null si le champ est absent (rien à modifier),
 * "" si l'éditeur est vide, sinon le HTML nettoyé.
 */
export function cleanRichField(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const html = sanitizeRichHtml(value).trim();
  const hasMedia = /<(img|iframe)\b/i.test(html);
  return toPlainText(html) || hasMedia ? html : "";
}
