/**
 * @jest-environment node
 */
import { requireAdminApi, requireContentEditorApi } from '@/lib/api-users-auth'
import { getUserIdFromToken } from '@/lib/tokens'
import { db } from '@/lib/db'
import { headers } from 'next/headers'

jest.mock('next/headers', () => ({ headers: jest.fn() }))
jest.mock('@/lib/tokens', () => ({ getUserIdFromToken: jest.fn() }))
jest.mock('@/lib/db', () => ({ db: { user: { findUnique: jest.fn() } } }))

const mockHeaders = headers as jest.Mock
const mockGetUserId = getUserIdFromToken as jest.Mock
const mockFindUser = db.user.findUnique as jest.Mock

function withAuthorization(value?: string) {
  mockHeaders.mockResolvedValue(new Headers(value ? { Authorization: value } : {}))
}

describe('requireAdminApi', () => {
  beforeEach(() => jest.resetAllMocks())

  it('refuse une requête sans token (401)', async () => {
    withAuthorization()
    const result = await requireAdminApi()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(401)
  })

  it('refuse un token invalide (403)', async () => {
    withAuthorization('Bearer faux')
    mockGetUserId.mockResolvedValue(null)
    const result = await requireAdminApi()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })

  it('refuse un utilisateur supprimé (403)', async () => {
    withAuthorization('Bearer ok')
    mockGetUserId.mockResolvedValue('u1')
    mockFindUser.mockResolvedValue({ role: 'ADMIN', isDeleted: true })
    const result = await requireAdminApi()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })

  it('refuse un compte désactivé (403)', async () => {
    withAuthorization('Bearer ok')
    mockGetUserId.mockResolvedValue('u1')
    mockFindUser.mockResolvedValue({ role: 'ADMIN', isDeleted: false, isActive: false })
    const result = await requireAdminApi()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })

  it.each(['USER', 'ASSOCIATION', 'WEBMASTER'])('refuse le rôle %s (403)', async (role) => {
    withAuthorization('Bearer ok')
    mockGetUserId.mockResolvedValue('u1')
    mockFindUser.mockResolvedValue({ role, isDeleted: false })
    const result = await requireAdminApi()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })

  it.each(['ADMIN', 'SUPER_ADMIN'])('accepte le rôle %s', async (role) => {
    withAuthorization('Bearer ok')
    mockGetUserId.mockResolvedValue('admin1')
    mockFindUser.mockResolvedValue({ role, isDeleted: false, isActive: true })
    const result = await requireAdminApi()
    expect(result).toEqual({ ok: true, adminId: 'admin1', role })
  })
})

describe('requireContentEditorApi', () => {
  beforeEach(() => jest.resetAllMocks())

  it.each(['SUPER_ADMIN', 'ADMIN', 'WEBMASTER'])('accepte le rôle %s', async (role) => {
    withAuthorization('Bearer ok')
    mockGetUserId.mockResolvedValue('u1')
    mockFindUser.mockResolvedValue({ role, isDeleted: false, isActive: true })
    const result = await requireContentEditorApi()
    expect(result.ok).toBe(true)
  })

  it.each(['USER', 'ASSOCIATION'])('refuse le rôle %s (403)', async (role) => {
    withAuthorization('Bearer ok')
    mockGetUserId.mockResolvedValue('u1')
    mockFindUser.mockResolvedValue({ role, isDeleted: false, isActive: true })
    const result = await requireContentEditorApi()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })
})
