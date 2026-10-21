/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { getUserIdFromToken } from '@/lib/tokens'
import { db } from '@/lib/db'
import { POST as postActualite } from '@/app/api/actualites/route'
import { POST as postArticle } from '@/app/api/articles/route'
import { POST as postProjet } from '@/app/api/projets/route'
import { POST as postMedia } from '@/app/api/medias/route'
import { POST as postDiplome } from '@/app/api/diplome/route'
import { DELETE as deleteActualite } from '@/app/api/actualites/[id]/route'
import { POST as postUpload } from '@/app/api/upload/route'

jest.mock('next/headers', () => ({ headers: jest.fn() }))
jest.mock('@/lib/tokens', () => ({ getUserIdFromToken: jest.fn() }))
jest.mock('@/lib/storage', () => ({ putObject: jest.fn(), deleteObject: jest.fn() }))
jest.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: jest.fn() },
    actualite: { create: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
    diplome: { findFirst: jest.fn(), create: jest.fn() },
  },
}))

const mockHeaders = headers as jest.Mock
const mockGetUserId = getUserIdFromToken as jest.Mock
const mockFindUser = db.user.findUnique as jest.Mock

function req(url: string, method = 'POST') {
  return new NextRequest(`http://localhost${url}`, { method, body: method === 'DELETE' ? undefined : '{}' })
}

const mutations: [string, () => Promise<Response>][] = [
  ['POST /api/actualites', () => postActualite(req('/api/actualites'))],
  ['POST /api/articles', () => postArticle(req('/api/articles'))],
  ['POST /api/projets', () => postProjet(req('/api/projets'))],
  ['POST /api/medias', () => postMedia(req('/api/medias'))],
  ['POST /api/diplome', () => postDiplome(req('/api/diplome'))],
  ['POST /api/upload', () => postUpload(req('/api/upload'))],
  [
    'DELETE /api/actualites/[id]',
    () => deleteActualite(req('/api/actualites/a1', 'DELETE'), { params: Promise.resolve({ id: 'a1' }) }),
  ],
]

describe('Routes de contenu réservées aux ADMIN', () => {
  beforeEach(() => jest.resetAllMocks())

  it.each(mutations)('%s refuse une requête sans token (401)', async (_name, run) => {
    mockHeaders.mockResolvedValue(new Headers())
    const res = await run()
    expect(res.status).toBe(401)
  })

  it.each(mutations)('%s refuse un utilisateur USER (403)', async (_name, run) => {
    mockHeaders.mockResolvedValue(new Headers({ Authorization: 'Bearer ok' }))
    mockGetUserId.mockResolvedValue('u1')
    mockFindUser.mockResolvedValue({ role: 'USER', isDeleted: false })
    const res = await run()
    expect(res.status).toBe(403)
    expect(db.actualite.create).not.toHaveBeenCalled()
    expect(db.actualite.update).not.toHaveBeenCalled()
    expect(db.diplome.create).not.toHaveBeenCalled()
  })
})

describe('Routes d’administration fermées au WEBMASTER', () => {
  beforeEach(() => jest.resetAllMocks())

  it.each([
    ['POST /api/diplome', () => postDiplome(req('/api/diplome'))],
    ['POST /api/upload', () => postUpload(req('/api/upload'))],
  ] as [string, () => Promise<Response>][])('%s refuse un WEBMASTER (403)', async (_name, run) => {
    mockHeaders.mockResolvedValue(new Headers({ Authorization: 'Bearer ok' }))
    mockGetUserId.mockResolvedValue('w1')
    mockFindUser.mockResolvedValue({ role: 'WEBMASTER', isDeleted: false, isActive: true })
    const res = await run()
    expect(res.status).toBe(403)
    expect(db.diplome.create).not.toHaveBeenCalled()
  })
})
