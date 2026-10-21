/**
 * @jest-environment node
 */
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { POST as login } from '@/app/api/auth/login/route'
import { POST as forgotPassword } from '@/app/api/auth/forgot-password/route'
import { POST as resendVerification } from '@/app/api/auth/resend-verification/route'
import { getUserByEmail } from '@/data/user'
import { applyRateLimit } from '@/lib/rateLimit'
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/mail'
import { issueSession } from '@/data/session'

jest.mock('@/data/user', () => ({ getUserByEmail: jest.fn() }))
jest.mock('@/lib/rateLimit', () => ({ applyRateLimit: jest.fn() }))
jest.mock('@/lib/mail', () => ({ sendVerificationEmail: jest.fn(), sendPasswordResetEmail: jest.fn() }))
jest.mock('@/lib/tokens', () => ({
  generateVerificationToken: jest.fn(async () => 'vt'),
  generatePasswordResetToken: jest.fn(async () => 'rt'),
}))
jest.mock('@/data/session', () => ({ issueSession: jest.fn() }))
jest.mock('@/lib/backoff', () => ({
  getBackoffDelay: jest.fn(() => 0),
  getFailedAttempts: jest.fn(async () => 0),
  incrementFailedAttempt: jest.fn(),
  resetFailedAttempts: jest.fn(),
}))
jest.mock('@/utils/user-agent', () => ({ getIp: jest.fn(async () => null), getGeoLocation: jest.fn(async () => null) }))
jest.mock('@/lib/db', () => ({
  db: { session: { deleteMany: jest.fn() }, userDevice: { create: jest.fn() }, failedLoginAttempt: { findFirst: jest.fn() } },
}))

const mockGetUser = getUserByEmail as jest.Mock
const PASSWORD = 'Bon-MotDePasse1'
const hash = bcrypt.hashSync(PASSWORD, 4)
const user = (over: Record<string, unknown> = {}) => ({
  id: 'u1', email: 'a@b.com', password: hash, emailVerified: new Date(), isActive: true, isDeleted: false, ...over,
})

const post = (handler: (r: Request) => Promise<Response>, body: unknown) =>
  handler(new Request('http://localhost/api/auth/x', { method: 'POST', body: JSON.stringify(body) }))

describe('Connexion : aucune information sur l’existence d’un compte', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(applyRateLimit as jest.Mock).mockResolvedValue(null)
    ;(issueSession as jest.Mock).mockResolvedValue({
      accessToken: 'a', refreshToken: 'r', accessTokenExpiresAt: 3600, refreshTokenExpiresAt: 604800,
    })
  })

  it('même réponse pour un email inconnu et un mauvais mot de passe', async () => {
    mockGetUser.mockResolvedValueOnce(null)
    const unknown = await post(login, { email: 'x@y.com', password: 'Nimporte-quoi1' })
    mockGetUser.mockResolvedValueOnce(user())
    const wrong = await post(login, { email: 'a@b.com', password: 'Mauvais-pass1' })

    expect(unknown.status).toBe(401)
    expect(wrong.status).toBe(401)
    expect(await unknown.json()).toEqual(await wrong.json())
  })

  it('un compte non vérifié avec un mauvais mot de passe reçoit la même réponse', async () => {
    mockGetUser.mockResolvedValue(user({ emailVerified: null }))
    const res = await post(login, { email: 'a@b.com', password: 'Mauvais-pass1' })
    expect(res.status).toBe(401)
    expect(sendVerificationEmail).not.toHaveBeenCalled()
  })

  it('un compte désactivé avec un mauvais mot de passe reçoit la même réponse', async () => {
    mockGetUser.mockResolvedValue(user({ isActive: false }))
    const res = await post(login, { email: 'a@b.com', password: 'Mauvais-pass1' })
    expect(res.status).toBe(401)
  })

  it('un compte supprimé est traité comme inexistant', async () => {
    mockGetUser.mockResolvedValue(user({ isDeleted: true }))
    const res = await post(login, { email: 'a@b.com', password: PASSWORD })
    expect(res.status).toBe(401)
    expect(issueSession).not.toHaveBeenCalled()
  })

  it('le bon mot de passe ouvre une session', async () => {
    mockGetUser.mockResolvedValue(user())
    const res = await post(login, { email: 'a@b.com', password: PASSWORD })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(expect.objectContaining({ accessToken: 'a', refreshToken: 'r', accessTokenExpiresAt: 3600 }))
  })

  it('applique la limitation de débit', async () => {
    ;(applyRateLimit as jest.Mock).mockResolvedValue(NextResponse.json({ error: 'Trop' }, { status: 429 }))
    const res = await post(login, { email: 'a@b.com', password: PASSWORD })
    expect(res.status).toBe(429)
    expect(mockGetUser).not.toHaveBeenCalled()
  })
})

describe('Mot de passe oublié et renvoi de vérification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(applyRateLimit as jest.Mock).mockResolvedValue(null)
  })

  it('mot de passe oublié : même réponse que le compte existe ou non', async () => {
    mockGetUser.mockResolvedValueOnce(null)
    const unknown = await post(forgotPassword, { email: 'x@y.com' })
    mockGetUser.mockResolvedValueOnce(user())
    const known = await post(forgotPassword, { email: 'a@b.com' })

    expect(unknown.status).toBe(200)
    expect(await unknown.json()).toEqual(await known.json())
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1)
  })

  it('mot de passe oublié : une panne de base de données renvoie une erreur, pas un faux succès', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mockGetUser.mockRejectedValueOnce(new Error("Can't reach database server"))
    const res = await post(forgotPassword, { email: 'a@b.com' })
    expect(res.status).toBe(500)
    expect(sendPasswordResetEmail).not.toHaveBeenCalled()
  })

  it('renvoi de vérification : même réponse pour un compte inconnu, vérifié ou non vérifié', async () => {
    mockGetUser.mockResolvedValueOnce(null)
    const unknown = await (await post(resendVerification, { email: 'x@y.com' })).json()
    mockGetUser.mockResolvedValueOnce(user())
    const verified = await (await post(resendVerification, { email: 'a@b.com' })).json()
    mockGetUser.mockResolvedValueOnce(user({ emailVerified: null }))
    const pending = await (await post(resendVerification, { email: 'a@b.com' })).json()

    expect(unknown).toEqual(verified)
    expect(verified).toEqual(pending)
    expect(sendVerificationEmail).toHaveBeenCalledTimes(1)
  })
})
