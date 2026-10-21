/**
 * @jest-environment node
 */
import crypto from 'node:crypto'

// Vraies clés RSA / AES générées pour le test, avant le chargement de lib/tokens
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})
process.env.RSA_PRIVATE_KEY = privateKey
process.env.RSA_PUBLIC_KEY = publicKey
process.env.AES_SECRET_KEY = crypto.randomBytes(32).toString('hex')

jest.mock('@/lib/db', () => ({ db: { session: { findUnique: jest.fn() } } }))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createEncryptedJWT, getSessionFromToken, getUserIdFromToken } = require('@/lib/tokens')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { db } = require('@/lib/db')

const mockFindSession = db.session.findUnique as jest.Mock
const future = () => new Date(Date.now() + 60_000)

describe('Jeton d’accès lié à la session', () => {
  beforeEach(() => jest.resetAllMocks())

  it('accepte un jeton dont la session existe', async () => {
    mockFindSession.mockResolvedValue({ userId: 'u1', refreshTokenExpires: future() })
    const token = createEncryptedJWT({ userId: 'u1', sid: 's1' }, 3600)
    expect(await getSessionFromToken(token)).toEqual({ userId: 'u1', sessionId: 's1' })
    expect(mockFindSession).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 's1' } }))
  })

  it('refuse le jeton dès que la session est supprimée (déconnexion)', async () => {
    mockFindSession.mockResolvedValue(null)
    const token = createEncryptedJWT({ userId: 'u1', sid: 's1' }, 3600)
    expect(await getUserIdFromToken(token)).toBeNull()
  })

  it('refuse un ancien jeton sans identifiant de session', async () => {
    const token = createEncryptedJWT({ userId: 'u1' }, 3600)
    expect(await getUserIdFromToken(token)).toBeNull()
    expect(mockFindSession).not.toHaveBeenCalled()
  })

  it('refuse un jeton dont la session appartient à un autre utilisateur', async () => {
    mockFindSession.mockResolvedValue({ userId: 'u2', refreshTokenExpires: future() })
    const token = createEncryptedJWT({ userId: 'u1', sid: 's1' }, 3600)
    expect(await getUserIdFromToken(token)).toBeNull()
  })

  it('refuse un jeton dont la session a expiré', async () => {
    mockFindSession.mockResolvedValue({ userId: 'u1', refreshTokenExpires: new Date(Date.now() - 1000) })
    const token = createEncryptedJWT({ userId: 'u1', sid: 's1' }, 3600)
    expect(await getUserIdFromToken(token)).toBeNull()
  })

  it('refuse un jeton falsifié', async () => {
    const token = createEncryptedJWT({ userId: 'u1', sid: 's1' }, 3600)
    const [iv, tag, data] = token.split('.')
    const tampered = `${iv}.${tag}.${data.slice(0, -4)}AAAA`
    expect(await getUserIdFromToken(tampered)).toBeNull()
  })
})
