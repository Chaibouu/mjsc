/**
 * @jest-environment node
 */
import { deleteObject, getObject, putObject } from '@/lib/storage'
import {
  deleteArticleGalleryImage,
  uploadArticleMainImage,
  uploadMediaGalleryImage,
  uploadProfilePicture,
} from '@/lib/upload'
import { serveImage } from '@/lib/serve-image'

jest.mock('@/lib/storage', () => ({
  putObject: jest.fn(),
  deleteObject: jest.fn(),
  getObject: jest.fn(),
}))

const mockPut = putObject as jest.Mock
const mockDelete = deleteObject as jest.Mock
const mockGet = getObject as jest.Mock

const image = (name = 'photo.png', type = 'image/png', size = 1000) =>
  new File([new Uint8Array(size)], name, { type })

beforeEach(() => jest.clearAllMocks())

describe('envoi des images de contenu via lib/storage', () => {
  it('image principale : clé {section}/main/{id}.{ext}, chemin public inchangé', async () => {
    const res = await uploadArticleMainImage(image('a.jpeg', 'image/jpeg'), 'art1')
    expect(mockPut).toHaveBeenCalledWith('articles/main/art1.jpg', expect.any(Uint8Array), 'image/jpeg')
    expect(res.path).toBe('/api/uploads/articles/main/art1.jpg')
    // l'ancienne image sous une autre extension est supprimée
    expect(mockDelete).toHaveBeenCalledWith('articles/main/art1.png')
    expect(mockDelete).not.toHaveBeenCalledWith('articles/main/art1.jpg')
  })

  it('galerie : nom unique sous {section}/gallery/{id}/', async () => {
    const res = await uploadMediaGalleryImage(image(), 'med1')
    const key = mockPut.mock.calls[0][0] as string
    expect(key).toMatch(/^medias\/gallery\/med1\/[0-9]+-[a-z0-9]+\.png$/)
    expect(res.path).toBe(`/api/uploads/${key}`)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('photo de profil : 2 Mo maximum', async () => {
    await expect(uploadProfilePicture(image('p.png', 'image/png', 3 * 1024 * 1024), 'u1')).rejects.toThrow()
    expect(mockPut).not.toHaveBeenCalled()
  })

  it('refuse un fichier qui n’est pas une image', async () => {
    await expect(uploadArticleMainImage(image('x.pdf', 'application/pdf'), 'art1')).rejects.toThrow()
    expect(mockPut).not.toHaveBeenCalled()
  })

  it('suppression de galerie : seuls les chemins valides de la section sont supprimés', async () => {
    await deleteArticleGalleryImage('/api/uploads/articles/gallery/art1/123-abc.png')
    expect(mockDelete).toHaveBeenCalledWith('articles/gallery/art1/123-abc.png')

    mockDelete.mockClear()
    await deleteArticleGalleryImage('/api/uploads/articles/gallery/../../.env/x.png')
    await deleteArticleGalleryImage('/api/uploads/projets/gallery/p1/1.png')
    expect(mockDelete).not.toHaveBeenCalled()
  })
})

describe('serveImage', () => {
  it('renvoie l’image avec un type déduit de l’extension', async () => {
    mockGet.mockResolvedValue({ body: new Uint8Array([1, 2, 3]), contentType: 'text/html' })
    const res = await serveImage('articles/gallery', '1-a.webp', 'art1')
    expect(mockGet).toHaveBeenCalledWith('articles/gallery/art1/1-a.webp')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/webp')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('404 si le fichier n’existe ni dans R2 ni sur le disque', async () => {
    mockGet.mockResolvedValue(null)
    expect((await serveImage('profiles', 'u1.png')).status).toBe(404)
  })

  it('refuse les noms dangereux ou non-images sans lire le stockage', async () => {
    expect((await serveImage('articles/main', '..%2F.env')).status).toBe(400)
    expect((await serveImage('articles/gallery', 'a.png', '../x')).status).toBe(400)
    expect((await serveImage('articles/main', 'a.html')).status).toBe(404)
    expect(mockGet).not.toHaveBeenCalled()
  })
})

describe('cache des images', () => {
  it('galerie (nom unique) : cache long ; nom fixe : cache court', async () => {
    mockGet.mockResolvedValue({ body: new Uint8Array([1]) })
    const gallery = await serveImage('medias/gallery', '1-a.png', 'm1')
    expect(gallery.headers.get('cache-control')).toContain('immutable')
    const main = await serveImage('articles/main', 'a1.png')
    expect(main.headers.get('cache-control')).toBe('public, max-age=60, stale-while-revalidate=300')
  })
})
