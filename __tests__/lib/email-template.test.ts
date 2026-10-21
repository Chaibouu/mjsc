/**
 * @jest-environment node
 */
import { renderEmail, EMAIL_LOGO_CID } from '@/lib/email/template'

const sendMail = jest.fn()
jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: () => ({ sendMail }) },
}))

const content = {
  preheader: 'Aperçu du message',
  title: 'Titre <b>du</b> message',
  paragraphs: ['Bonjour,', 'Texte avec <script>alert(1)</script>'],
  action: { label: 'Confirmer', url: 'https://mjsc.example/verify?token=a&b=1' },
  notes: ['Valable 1 heure.'],
  securityNotice: 'Ignorez cet email si besoin.',
}

describe('Gabarit des emails', () => {
  it('produit une version HTML et une version texte', () => {
    const { html, text } = renderEmail(content)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('lang="fr"')
    expect(text).toContain('Confirmer :\nhttps://mjsc.example/verify?token=a&b=1')
    expect(text).toContain('Valable 1 heure.')
    // Aucune balise du gabarit dans la version texte
    expect(text).not.toMatch(/<(table|td|p|a|img|div)\b/i)
  })

  it('échappe le contenu dynamique', () => {
    const { html } = renderEmail(content)
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('Titre &lt;b&gt;du&lt;/b&gt; message')
    expect(html).toContain('verify?token=a&amp;b=1')
  })

  it('affiche le logo joint, le texte d’aperçu et le lien en clair', () => {
    const { html } = renderEmail(content)
    expect(html).toContain(`cid:${EMAIL_LOGO_CID}`)
    expect(html).toContain('Aperçu du message')
    expect(html).toContain('Si le bouton ne fonctionne pas')
  })
})

describe('Envoi des emails', () => {
  beforeEach(() => sendMail.mockReset())

  it('envoie HTML + texte, l’expéditeur nommé, le logo joint et les en-têtes d’email automatique', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://mjsc.example/'
    process.env.EMAIL_FROM = 'noreply@mjsc.example'
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { sendPasswordResetEmail } = require('@/lib/mail')
    await sendPasswordResetEmail('user@example.com', 'tok/en')

    const mail = sendMail.mock.calls[0][0]
    expect(mail.to).toBe('user@example.com')
    expect(mail.subject).toBe('Réinitialisation de votre mot de passe')
    expect(mail.from).toBe('"Ministère de la Jeunesse, des Sports et de la Culture" <noreply@mjsc.example>')
    expect(mail.text).toContain('https://mjsc.example/auth/reset-password?token=tok%2Fen')
    expect(mail.html).toContain('Choisir un nouveau mot de passe')
    expect(mail.headers['Auto-Submitted']).toBe('auto-generated')
    expect(mail.attachments[0].cid).toBe(EMAIL_LOGO_CID)
  })
})
