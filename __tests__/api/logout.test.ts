/**
 * @jest-environment node
 */
import { POST as logout } from '@/app/api/auth/logout/route'
import { getSessionFromToken } from '@/lib/tokens'
import { deleteSessionById, deleteSessionByRefreshToken } from '@/data/session'

jest.mock('@/lib/tokens', () => ({ getSessionFromToken: jest.fn() }))
jest.mock('@/data/session', () => ({ deleteSessionById: jest.fn(), deleteSessionByRefreshToken: jest.fn() }))

const post = (body: unknown) =>
  logout(new Request('http://localhost/api/auth/logout', { method: 'POST', body: JSON.stringify(body) }))

describe('POST /api/auth/logout', () => {
  beforeEach(() => jest.resetAllMocks())

  it('supprime la session du jeton d’accès et du refresh token', async () => {
    ;(getSessionFromToken as jest.Mock).mockResolvedValue({ userId: 'u1', sessionId: 's1' })
    const res = await post({ token: 'a', refreshToken: 'r' })
    expect(res.status).toBe(200)
    expect(deleteSessionByRefreshToken).toHaveBeenCalledWith('r')
    expect(deleteSessionById).toHaveBeenCalledWith('s1')
  })

  it('fonctionne avec le seul refresh token (jeton d’accès expiré)', async () => {
    const res = await post({ refreshToken: 'r' })
    expect(res.status).toBe(200)
    expect(deleteSessionByRefreshToken).toHaveBeenCalledWith('r')
  })

  it('refuse une requête sans aucun jeton', async () => {
    const res = await post({})
    expect(res.status).toBe(400)
  })
})
