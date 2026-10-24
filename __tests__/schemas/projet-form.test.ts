import { projetFormSchema } from '@/schemas/projet'

const image = (type = 'image/png', size = 1000) =>
  new File([new Uint8Array(size)], 'photo', { type })

describe('projetFormSchema', () => {
  it('accepte un projet avec titre seul', () => {
    expect(projetFormSchema.safeParse({ title: 'Mon projet' }).success).toBe(true)
  })

  it('refuse un titre vide ou fait d’espaces', () => {
    expect(projetFormSchema.safeParse({ title: '   ' }).success).toBe(false)
  })

  it('accepte un lien vide mais refuse une URL invalide', () => {
    expect(projetFormSchema.safeParse({ title: 'A', link: '' }).success).toBe(true)
    expect(projetFormSchema.safeParse({ title: 'A', link: 'pas une url' }).success).toBe(false)
  })

  it('accepte des images JPG/PNG/WebP/GIF de 5 Mo maximum', () => {
    const r = projetFormSchema.safeParse({ title: 'A', mainImage: image(), gallery: [image('image/webp')] })
    expect(r.success).toBe(true)
  })

  it('refuse un fichier qui n’est pas une image', () => {
    const r = projetFormSchema.safeParse({ title: 'A', mainImage: image('application/pdf') })
    expect(r.success).toBe(false)
  })

  it('refuse une image de plus de 5 Mo dans la galerie', () => {
    const r = projetFormSchema.safeParse({ title: 'A', gallery: [image('image/png', 5 * 1024 * 1024 + 1)] })
    expect(r.success).toBe(false)
  })
})
