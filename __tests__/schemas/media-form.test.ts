import { mediaFormSchema } from '@/schemas/media'

const image = (type = 'image/png', size = 1000) =>
  new File([new Uint8Array(size)], 'photo', { type })

describe('mediaFormSchema', () => {
  it('accepte un média avec titre seul', () => {
    expect(mediaFormSchema.safeParse({ title: 'Mon album' }).success).toBe(true)
  })

  it('refuse un titre vide ou fait d’espaces', () => {
    expect(mediaFormSchema.safeParse({ title: '   ' }).success).toBe(false)
  })

  it('accepte des photos JPG/PNG/WebP/GIF de 5 Mo maximum', () => {
    const r = mediaFormSchema.safeParse({ title: 'A', gallery: [image(), image('image/webp')] })
    expect(r.success).toBe(true)
  })

  it('refuse un fichier qui n’est pas une image', () => {
    const r = mediaFormSchema.safeParse({ title: 'A', gallery: [image('application/pdf')] })
    expect(r.success).toBe(false)
  })

  it('refuse une photo de plus de 5 Mo', () => {
    const r = mediaFormSchema.safeParse({ title: 'A', gallery: [image('image/png', 5 * 1024 * 1024 + 1)] })
    expect(r.success).toBe(false)
  })
})
