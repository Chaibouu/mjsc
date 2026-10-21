/**
 * @jest-environment node
 */
import { checkAssociationAccess } from '@/lib/api-association-auth'
import { getUserIdFromToken } from '@/lib/tokens'
import { db } from '@/lib/db'

jest.mock('@/lib/tokens', () => ({ getUserIdFromToken: jest.fn() }))
jest.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: jest.fn() },
    association: { findFirst: jest.fn() },
  },
}))

const mockGetUserId = getUserIdFromToken as jest.Mock
const mockFindUser = db.user.findUnique as jest.Mock
const mockFindAssoc = db.association.findFirst as jest.Mock

function loggedAs(id: string, role: string) {
  mockGetUserId.mockResolvedValue(id)
  mockFindUser.mockResolvedValue({ id, role, isDeleted: false })
}

describe('checkAssociationAccess', () => {
  beforeEach(() => jest.resetAllMocks())

  it('refuse sans token (401)', async () => {
    const result = await checkAssociationAccess(null, 'a1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(401)
  })

  it('refuse un token invalide (403)', async () => {
    mockGetUserId.mockResolvedValue(null)
    const result = await checkAssociationAccess('faux', 'a1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })

  it('renvoie 404 si l’association n’existe pas', async () => {
    loggedAs('u1', 'ASSOCIATION')
    mockFindAssoc.mockResolvedValue(null)
    const result = await checkAssociationAccess('ok', 'a1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(404)
  })

  it('autorise le compte lié à l’association', async () => {
    loggedAs('u1', 'ASSOCIATION')
    mockFindAssoc.mockResolvedValue({ id: 'a1', userId: 'u1' })
    const result = await checkAssociationAccess('ok', 'a1')
    expect(result).toEqual({ ok: true, userId: 'u1', isAdmin: false, associationId: 'a1' })
  })

  it('refuse le compte d’une autre association (403)', async () => {
    loggedAs('u2', 'ASSOCIATION')
    mockFindAssoc.mockResolvedValue({ id: 'a1', userId: 'u1' })
    const result = await checkAssociationAccess('ok', 'a1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })

  it.each(['ADMIN', 'SUPER_ADMIN'])('autorise le rôle %s sur toute association', async (role) => {
    loggedAs('admin1', role)
    mockFindAssoc.mockResolvedValue({ id: 'a1', userId: 'u1' })
    const result = await checkAssociationAccess('ok', 'a1')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.isAdmin).toBe(true)
  })

  it('refuse un WEBMASTER sur une association qui n’est pas la sienne (403)', async () => {
    loggedAs('w1', 'WEBMASTER')
    mockFindAssoc.mockResolvedValue({ id: 'a1', userId: 'u1' })
    const result = await checkAssociationAccess('ok', 'a1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })
})
