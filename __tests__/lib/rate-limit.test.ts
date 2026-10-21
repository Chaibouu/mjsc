/**
 * @jest-environment node
 */
import { applyRateLimit } from '@/lib/rateLimit'
import { db } from '@/lib/db'
import appConfig from '@/settings'

jest.mock('@/lib/db', () => ({ db: { $queryRaw: jest.fn(), rateLimit: { deleteMany: jest.fn() } } }))

const mockQuery = db.$queryRaw as unknown as jest.Mock
const req = (ip: string) => ({ headers: new Headers({ 'x-forwarded-for': ip }) })

describe('applyRateLimit (stocké en base)', () => {
  beforeEach(() => jest.resetAllMocks())

  it('laisse passer sous la limite', async () => {
    mockQuery.mockResolvedValue([{ count: 1, windowStart: new Date() }])
    expect(await applyRateLimit(req('1.2.3.4'), 'login')).toBeNull()
  })

  it('bloque au-delà de la limite avec un en-tête Retry-After', async () => {
    mockQuery.mockResolvedValue([{ count: appConfig.rateLimit.login.max + 1, windowStart: new Date() }])
    const res = await applyRateLimit(req('1.2.3.4'), 'login')
    expect(res?.status).toBe(429)
    expect(Number(res?.headers.get('Retry-After'))).toBeGreaterThan(0)
  })

  it('compte séparément chaque IP et chaque route', async () => {
    mockQuery.mockResolvedValue([{ count: 1, windowStart: new Date() }])
    await applyRateLimit(req('1.2.3.4'), 'login')
    await applyRateLimit(req('5.6.7.8'), 'signup')
    const keys = mockQuery.mock.calls.map((c) => c[1])
    expect(keys).toEqual(['login:1.2.3.4', 'signup:5.6.7.8'])
  })

  it('ne bloque pas l’authentification si la base est indisponible', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mockQuery.mockRejectedValue(new Error('db down'))
    expect(await applyRateLimit(req('1.2.3.4'), 'login')).toBeNull()
  })
})
