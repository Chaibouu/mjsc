/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/uploads/associations/[id]/[kind]/[filename]/route'
import { getObject } from '@/lib/storage'
import { checkAssociationAccess } from '@/lib/api-association-auth'
import { NextResponse } from 'next/server'

jest.mock('@/lib/storage', () => ({ getObject: jest.fn() }))
jest.mock('@/lib/api-association-auth', () => ({ checkAssociationAccess: jest.fn() }))

const mockGetObject = getObject as jest.Mock
const mockAccess = checkAssociationAccess as jest.Mock

function get(kind: string, filename: string, init?: { auth?: string; cookie?: string }) {
  const h: Record<string, string> = {}
  if (init?.auth) h.Authorization = `Bearer ${init.auth}`
  if (init?.cookie) h.Cookie = `accessToken=${init.cookie}`
  const r = new NextRequest(`http://localhost/api/uploads/associations/a1/${kind}/${filename}`, { headers: h })
  return GET(r, { params: Promise.resolve({ id: 'a1', kind, filename }) })
}

describe('GET /api/uploads/associations/[id]/[kind]/[filename]', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockGetObject.mockResolvedValue({ body: new Uint8Array([1, 2, 3]) })
  })

  it('sert le logo sans authentification', async () => {
    const res = await get('logo', 'logo.png')
    expect(res.status).toBe(200)
    expect(mockAccess).not.toHaveBeenCalled()
    expect(mockGetObject).toHaveBeenCalledWith('associations/a1/logo/logo.png')
  })

  it('refuse une pièce d’identité sans authentification', async () => {
    mockAccess.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Token manquant' }, { status: 401 }),
    })
    const res = await get('dirigeants', 'd1.pdf')
    expect(res.status).toBe(401)
    expect(mockAccess).toHaveBeenCalledWith(null, 'a1')
    expect(mockGetObject).not.toHaveBeenCalled()
  })

  it('accepte le token du cookie de session pour un document', async () => {
    mockAccess.mockResolvedValue({ ok: true, userId: 'u1', isAdmin: false, associationId: 'a1' })
    const res = await get('statuts', 'statuts.pdf', { cookie: 'tok' })
    expect(res.status).toBe(200)
    expect(mockAccess).toHaveBeenCalledWith('tok', 'a1')
    expect(res.headers.get('Content-Type')).toBe('application/pdf')
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
  })

  it('rejette un type de fichier inconnu', async () => {
    const res = await get('secrets', 'x.pdf')
    expect(res.status).toBe(400)
  })

  it('renvoie 404 si le fichier n’existe pas', async () => {
    mockAccess.mockResolvedValue({ ok: true, userId: 'u1', isAdmin: true })
    mockGetObject.mockResolvedValue(null)
    const res = await get('documents', 'inconnu.pdf', { auth: 'tok' })
    expect(res.status).toBe(404)
  })
})
