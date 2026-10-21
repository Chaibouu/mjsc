/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/change-email/confirm/route'
import { verifyVerificationToken } from '@/lib/tokens'
import { getVerificationTokenByTokenId } from '@/data/verification-token'
import { db } from '@/lib/db'

jest.mock('@/lib/tokens', () => ({
  verifyVerificationToken: jest.fn(),
  generateVerificationTokenForModifyEmail: jest.fn(),
}))
jest.mock('@/lib/mail', () => ({ sendChangeEmailVerification: jest.fn() }))
jest.mock('@/lib/rateLimit', () => ({ applyRateLimit: jest.fn(async () => null) }))
jest.mock('@/data/verification-token', () => ({
  getVerificationTokenByTokenId: jest.fn(),
  getVerificationTokenByToken: jest.fn(),
}))
jest.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    verificationToken: { delete: jest.fn() },
  },
}))

const mockVerify = verifyVerificationToken as jest.Mock
const mockStored = getVerificationTokenByTokenId as jest.Mock
const mockFindUser = db.user.findUnique as jest.Mock
const mockUpdate = db.user.update as jest.Mock

function call(token = 'tok') {
  return POST(
    new Request('http://localhost/api/auth/change-email/confirm', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  )
}

describe('POST /api/auth/change-email/confirm', () => {
  beforeEach(() => jest.resetAllMocks())

  it('rejette un token d’inscription (sans userId) sans modifier personne', async () => {
    mockVerify.mockResolvedValue({ tokenPayload: { email: 'pirate@x.com', tokenId: 't1' } })
    const res = await call()
    expect(res.status).toBe(400)
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(db.user.findFirst).not.toHaveBeenCalled()
  })

  it('rejette un token dont l’enregistrement ne correspond pas au userId', async () => {
    mockVerify.mockResolvedValue({
      tokenPayload: { email: 'new@x.com', tokenId: 't1', userId: 'u1' },
    })
    mockStored.mockResolvedValue({ id: 's1', email: 'new@x.com', userId: 'u2' })
    const res = await call()
    expect(res.status).toBe(400)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('refuse une adresse déjà utilisée par un autre compte (409)', async () => {
    mockVerify.mockResolvedValue({
      tokenPayload: { email: 'new@x.com', tokenId: 't1', userId: 'u1' },
    })
    mockStored.mockResolvedValue({ id: 's1', email: 'new@x.com', userId: 'u1' })
    mockFindUser
      .mockResolvedValueOnce({ id: 'u1', isDeleted: false })
      .mockResolvedValueOnce({ id: 'u9' })
    const res = await call()
    expect(res.status).toBe(409)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('met à jour l’email du bon utilisateur avec un token valide', async () => {
    mockVerify.mockResolvedValue({
      tokenPayload: { email: 'new@x.com', tokenId: 't1', userId: 'u1' },
    })
    mockStored.mockResolvedValue({ id: 's1', email: 'new@x.com', userId: 'u1' })
    mockFindUser
      .mockResolvedValueOnce({ id: 'u1', isDeleted: false })
      .mockResolvedValueOnce(null)
    const res = await call()
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { email: 'new@x.com', emailVerified: expect.any(Date) },
    })
    expect(db.verificationToken.delete).toHaveBeenCalledWith({ where: { id: 's1' } })
  })
})
