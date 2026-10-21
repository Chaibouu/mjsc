/**
 * @jest-environment node
 */
import { rotateRefreshToken, issueSession } from '@/data/session'
import { db } from '@/lib/db'
import { createEncryptedJWT } from '@/lib/tokens'
import appConfig from '@/settings'

jest.mock('@/lib/tokens', () => ({ createEncryptedJWT: jest.fn(() => 'access-token') }))
jest.mock('@/lib/db', () => ({
  db: {
    session: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: { findUnique: jest.fn() },
  },
}))

const s = db.session as unknown as Record<string, jest.Mock>
const mockFindUser = db.user.findUnique as jest.Mock

const session = (over: Record<string, unknown> = {}) => ({
  id: 's1',
  userId: 'u1',
  refreshToken: 'current',
  previousRefreshToken: 'old',
  refreshRotatedAt: new Date(),
  refreshTokenExpires: new Date(Date.now() + 3_600_000),
  ...over,
})

describe('issueSession', () => {
  beforeEach(() => jest.resetAllMocks())

  it('crée une session et lie le jeton d’accès à son identifiant, durée 1 h', async () => {
    ;(createEncryptedJWT as jest.Mock).mockReturnValue('access-token')
    const tokens = await issueSession('u1')
    const created = s.create.mock.calls[0][0].data
    expect(createEncryptedJWT).toHaveBeenCalledWith({ userId: 'u1', sid: created.id }, appConfig.auth.accessTokenTtl)
    expect(tokens.accessTokenExpiresAt).toBe(3600)
    expect(tokens.refreshToken).toHaveLength(128)
  })
})

describe('rotateRefreshToken', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    ;(createEncryptedJWT as jest.Mock).mockReturnValue('access-token')
    mockFindUser.mockResolvedValue({ isActive: true, isDeleted: false })
  })

  it('remplace le refresh token et garde l’ancien pour détecter sa réutilisation', async () => {
    s.findUnique.mockResolvedValueOnce(session())
    s.updateMany.mockResolvedValue({ count: 1 })
    const result = await rotateRefreshToken('current')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.tokens.refreshToken).not.toBe('current')
    expect(result.tokens.accessTokenExpiresAt).toBe(3600)
    expect(s.updateMany).toHaveBeenCalledWith({
      where: { id: 's1', refreshToken: 'current' },
      data: expect.objectContaining({
        refreshToken: result.tokens.refreshToken,
        previousRefreshToken: 'current',
      }),
    })
  })

  it('accepte l’ancien token pendant le délai de grâce, sans nouvelle rotation', async () => {
    s.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(session({ refreshRotatedAt: new Date() }))
    const result = await rotateRefreshToken('old')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.tokens.refreshToken).toBe('current')
    expect(s.updateMany).not.toHaveBeenCalled()
    expect(s.deleteMany).not.toHaveBeenCalled()
  })

  it('révoque la session si un ancien token est réutilisé après le délai de grâce', async () => {
    const longAgo = new Date(Date.now() - (appConfig.auth.refreshReuseGraceSeconds + 5) * 1000)
    s.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(session({ refreshRotatedAt: longAgo }))
    const result = await rotateRefreshToken('old')
    expect(result).toEqual(expect.objectContaining({ ok: false, status: 403 }))
    expect(s.deleteMany).toHaveBeenCalledWith({ where: { id: 's1' } })
  })

  it('refuse un token inconnu', async () => {
    s.findUnique.mockResolvedValue(null)
    const result = await rotateRefreshToken('inconnu')
    expect(result.ok).toBe(false)
  })

  it('refuse et supprime une session expirée', async () => {
    s.findUnique.mockResolvedValueOnce(session({ refreshTokenExpires: new Date(Date.now() - 1000) }))
    const result = await rotateRefreshToken('current')
    expect(result.ok).toBe(false)
    expect(s.deleteMany).toHaveBeenCalledWith({ where: { id: 's1' } })
  })

  it('refuse un compte désactivé', async () => {
    s.findUnique.mockResolvedValueOnce(session())
    mockFindUser.mockResolvedValue({ isActive: false, isDeleted: false })
    const result = await rotateRefreshToken('current')
    expect(result.ok).toBe(false)
    expect(s.deleteMany).toHaveBeenCalled()
  })

  it('reprend le token émis par une requête parallèle au lieu de l’écraser', async () => {
    s.findUnique
      .mockResolvedValueOnce(session())
      .mockResolvedValueOnce(session({ refreshToken: 'emis-en-parallele' }))
    s.updateMany.mockResolvedValue({ count: 0 })
    const result = await rotateRefreshToken('current')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.tokens.refreshToken).toBe('emis-en-parallele')
  })
})
