/**
 * @jest-environment node
 */
import { cleanRichField, sanitizeRichHtml, toPlainText } from '@/lib/rich-content'
import { htmlToText } from '@/lib/html-text'

describe('sanitizeRichHtml', () => {
  it('retire scripts et gestionnaires d’événements', () => {
    const html = sanitizeRichHtml('<p onclick="x()">Salut<script>alert(1)</script></p><img src="https://a.org/i.png" onerror="x()">')
    expect(html).toBe('<p>Salut</p><img src="https://a.org/i.png" />')
  })

  it('garde la vidéo YouTube reconnaissable par l’éditeur (data-youtube-video)', () => {
    const html = sanitizeRichHtml(
      '<div data-youtube-video=""><iframe src="https://www.youtube-nocookie.com/embed/abc" allowfullscreen="true"></iframe></div>'
    )
    expect(html).toContain('data-youtube-video')
    expect(html).toContain('<iframe src="https://www.youtube-nocookie.com/embed/abc"')
  })

  it('refuse les iframes d’autres sites', () => {
    expect(sanitizeRichHtml('<iframe src="https://evil.example/x"></iframe>')).not.toContain('evil.example')
  })

  it('images : https ou envoyées sur le site uniquement', () => {
    expect(sanitizeRichHtml('<img src="http://a.org/i.png">')).toBe('')
    expect(sanitizeRichHtml('<img src="javascript:alert(1)">')).toBe('')
    expect(sanitizeRichHtml('<img src="/api/uploads/editor/1-a.webp">')).toBe('<img src="/api/uploads/editor/1-a.webp" />')
    expect(sanitizeRichHtml('<img src="/api/uploads/../../.env">')).toBe('')
  })

  it('liens externes : nouvel onglet sans accès à la page d’origine ; javascript: retiré', () => {
    expect(sanitizeRichHtml('<a href="https://a.org">x</a>')).toBe('<a href="https://a.org" target="_blank" rel="noopener noreferrer">x</a>')
    expect(sanitizeRichHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>')
  })

  it('styles : couleurs et alignement seulement', () => {
    const html = sanitizeRichHtml('<p style="text-align:center;position:fixed"><span style="color:#ff0000;background:url(x)">a</span></p>')
    expect(html).toBe('<p style="text-align:center"><span style="color:#ff0000">a</span></p>')
  })
})

describe('cleanRichField', () => {
  it('null si le champ est absent, "" si l’éditeur est vide', () => {
    expect(cleanRichField(null)).toBeNull()
    expect(cleanRichField('<p></p>')).toBe('')
    expect(cleanRichField('<p><script>x</script></p>')).toBe('')
  })

  it('garde une description faite seulement d’une image', () => {
    expect(cleanRichField('<p><img src="https://a.org/i.png"></p>')).toContain('<img')
  })
})

describe('aperçus texte', () => {
  it('toPlainText et htmlToText donnent le texte lisible', () => {
    const html = '<h2>Titre</h2><p>Un &amp; deux<br>trois</p><ul><li>a</li><li>b</li></ul>'
    expect(toPlainText(html)).toBe('Titre Un & deux trois a b')
    expect(htmlToText(html)).toBe('Titre Un & deux trois a b')
  })
})
