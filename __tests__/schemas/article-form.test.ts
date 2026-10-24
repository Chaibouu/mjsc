import { articleFormSchema } from '@/schemas/article'

const image = (type = 'image/png', size = 1000) =>
  new File([new Uint8Array(size)], 'photo', { type })

describe('articleFormSchema', () => {
  it('accepte un article avec titre seul', () => {
    expect(articleFormSchema.safeParse({ title: 'Mon article' }).success).toBe(true)
  })

  it('refuse un titre vide ou fait d’espaces', () => {
    expect(articleFormSchema.safeParse({ title: '   ' }).success).toBe(false)
  })

  it('accepte un lien vide mais refuse une URL invalide', () => {
    expect(articleFormSchema.safeParse({ title: 'A', link: '' }).success).toBe(true)
    expect(articleFormSchema.safeParse({ title: 'A', link: 'pas une url' }).success).toBe(false)
  })

  it('accepte des images JPG/PNG/WebP/GIF de 5 Mo maximum', () => {
    const r = articleFormSchema.safeParse({ title: 'A', mainImage: image(), gallery: [image('image/webp')] })
    expect(r.success).toBe(true)
  })

  it('refuse un fichier qui n’est pas une image', () => {
    const r = articleFormSchema.safeParse({ title: 'A', mainImage: image('application/pdf') })
    expect(r.success).toBe(false)
  })

  it('refuse une image de plus de 5 Mo dans la galerie', () => {
    const r = articleFormSchema.safeParse({ title: 'A', gallery: [image('image/png', 5 * 1024 * 1024 + 1)] })
    expect(r.success).toBe(false)
  })
})

describe('limite totale par envoi (Vercel)', () => {
  it('refuse plus de 4 Mo d’images au total, avec le message sous la galerie', () => {
    const r = articleFormSchema.safeParse({
      title: 'A',
      mainImage: image('image/jpeg', 2 * 1024 * 1024),
      gallery: [image('image/png', 1.5 * 1024 * 1024), image('image/png', 1024 * 1024)],
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues[0].path).toEqual(['gallery'])
      expect(r.error.issues[0].message).toMatch(/4 Mo maximum/)
    }
  })

  it('accepte 4 Mo au total', () => {
    const r = articleFormSchema.safeParse({
      title: 'A',
      gallery: [image('image/png', 2 * 1024 * 1024), image('image/png', 2 * 1024 * 1024)],
    })
    expect(r.success).toBe(true)
  })
})
