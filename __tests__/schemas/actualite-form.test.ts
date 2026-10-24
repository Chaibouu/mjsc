import { actualiteFormSchema } from '@/schemas/actualite'

const image = (type = 'image/png', size = 1000) =>
  new File([new Uint8Array(size)], 'photo', { type })

describe('actualiteFormSchema', () => {
  it('accepte une actualité avec titre seul', () => {
    expect(actualiteFormSchema.safeParse({ title: 'Mon article' }).success).toBe(true)
  })

  it('refuse un titre vide ou fait d’espaces', () => {
    expect(actualiteFormSchema.safeParse({ title: '   ' }).success).toBe(false)
  })

  it('accepte un lien vide mais refuse une URL invalide', () => {
    expect(actualiteFormSchema.safeParse({ title: 'A', link: '' }).success).toBe(true)
    expect(actualiteFormSchema.safeParse({ title: 'A', link: 'pas une url' }).success).toBe(false)
  })

  it('accepte des images JPG/PNG/WebP/GIF de 5 Mo maximum', () => {
    const r = actualiteFormSchema.safeParse({ title: 'A', mainImage: image(), gallery: [image('image/webp')] })
    expect(r.success).toBe(true)
  })

  it('refuse un fichier qui n’est pas une image', () => {
    const r = actualiteFormSchema.safeParse({ title: 'A', mainImage: image('application/pdf') })
    expect(r.success).toBe(false)
  })

  it('refuse une image de plus de 5 Mo dans la galerie', () => {
    const r = actualiteFormSchema.safeParse({ title: 'A', gallery: [image('image/png', 5 * 1024 * 1024 + 1)] })
    expect(r.success).toBe(false)
  })
})
