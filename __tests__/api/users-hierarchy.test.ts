/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { getUserIdFromToken } from '@/lib/tokens'
import { db } from '@/lib/db'
import { updateUser, softDeleteUser } from '@/data/user'
import { PATCH as patchUser, DELETE as deleteUser } from '@/app/api/users/[id]/route'
import { PATCH as patchPassword } from '@/app/api/users/[id]/password/route'
import { POST as postResetPassword } from '@/app/api/users/[id]/reset-password/route'
import { sendPasswordResetEmail } from '@/lib/mail'
import { POST as postUser } from '@/app/api/users/route'

jest.mock('next/headers', () => ({ headers: jest.fn() }))
jest.mock('@/lib/tokens', () => ({
  getUserIdFromToken: jest.fn(),
  generatePasswordResetToken: jest.fn(async () => 'reset-token'),
}))
jest.mock('@/lib/mail', () => ({ sendPasswordResetEmail: jest.fn() }))
jest.mock('@/lib/db', () => ({
  db: { user: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(async () => ({ id: 'new', email: 'nouveau@example.com' })) } },
}))
jest.mock('@/data/user', () => ({
  getUserById: jest.fn(async (id: string) => ({ id })),
  updateUser: jest.fn(async (id: string) => ({ id })),
  softDeleteUser: jest.fn(),
  setUserPassword: jest.fn(),
}))

const mockHeaders = headers as jest.Mock
const mockGetUserId = getUserIdFromToken as jest.Mock
const mockFindUser = db.user.findUnique as jest.Mock

/** Simule l'acteur connecté puis la cible lue en base. */
function setup(actorRole: string, targetRole: string) {
  mockHeaders.mockResolvedValue(new Headers({ Authorization: 'Bearer ok' }))
  mockGetUserId.mockResolvedValue('actor')
  mockFindUser.mockImplementation(async ({ where }: { where: { id?: string; email?: string } }) =>
    where.email
      ? null
      : where.id === 'actor'
        ? { role: actorRole, isDeleted: false, isActive: true }
        : { id: where.id, role: targetRole, isDeleted: false, email: 'cible@example.com' }
  )
}

const params = { params: Promise.resolve({ id: 'target' }) }
const jsonReq = (method: string, body: unknown) =>
  new NextRequest('http://localhost/api/users/target', { method, body: JSON.stringify(body) })

describe('Hiérarchie de gestion des utilisateurs', () => {
  beforeEach(() => jest.clearAllMocks())

  it('un ADMIN ne peut pas modifier un autre ADMIN', async () => {
    setup('ADMIN', 'ADMIN')
    const res = await patchUser(jsonReq('PATCH', { firstName: 'X' }), params)
    expect(res.status).toBe(403)
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('un ADMIN ne peut pas réinitialiser le mot de passe d’un ADMIN', async () => {
    setup('ADMIN', 'ADMIN')
    const res = await patchPassword(jsonReq('PATCH', { newPassword: 'NouveauMotDePasse1!' }), params)
    expect(res.status).toBe(403)
  })

  it('un ADMIN ne peut pas promouvoir un USER en ADMIN', async () => {
    setup('ADMIN', 'USER')
    const res = await patchUser(jsonReq('PATCH', { role: 'ADMIN' }), params)
    expect(res.status).toBe(403)
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('un ADMIN peut modifier un USER', async () => {
    setup('ADMIN', 'USER')
    const res = await patchUser(jsonReq('PATCH', { firstName: 'X' }), params)
    expect(res.status).toBe(200)
    expect(updateUser).toHaveBeenCalledWith('target', { firstName: 'X' })
  })

  it('personne ne peut attribuer le rôle SUPER_ADMIN', async () => {
    setup('SUPER_ADMIN', 'ADMIN')
    const res = await patchUser(jsonReq('PATCH', { role: 'SUPER_ADMIN' }), params)
    expect(res.status).toBe(403)
  })

  it('le SUPER_ADMIN peut nommer un WEBMASTER', async () => {
    setup('SUPER_ADMIN', 'USER')
    const res = await patchUser(jsonReq('PATCH', { role: 'WEBMASTER' }), params)
    expect(res.status).toBe(200)
    expect(updateUser).toHaveBeenCalledWith('target', { role: 'WEBMASTER' })
  })

  it('le SUPER_ADMIN peut supprimer un ADMIN', async () => {
    setup('SUPER_ADMIN', 'ADMIN')
    const res = await deleteUser(new NextRequest('http://localhost/api/users/target', { method: 'DELETE' }), params)
    expect(res.status).toBe(200)
    expect(softDeleteUser).toHaveBeenCalledWith('target')
  })

  it('le compte SUPER_ADMIN ne peut être ni modifié ni supprimé via l’API', async () => {
    setup('ADMIN', 'SUPER_ADMIN')
    expect((await patchUser(jsonReq('PATCH', { isActive: false }), params)).status).toBe(403)
    expect(
      (await deleteUser(new NextRequest('http://localhost/api/users/target', { method: 'DELETE' }), params)).status
    ).toBe(403)
    expect(softDeleteUser).not.toHaveBeenCalled()
  })

  it('un ADMIN peut envoyer un lien de réinitialisation à un USER', async () => {
    setup('ADMIN', 'USER')
    const res = await postResetPassword(new NextRequest('http://localhost/api/users/target/reset-password', { method: 'POST' }), params)
    expect(res.status).toBe(200)
    expect(sendPasswordResetEmail).toHaveBeenCalledWith('cible@example.com', 'reset-token')
  })

  it('un ADMIN ne peut pas envoyer de lien de réinitialisation à un ADMIN', async () => {
    setup('ADMIN', 'ADMIN')
    const res = await postResetPassword(new NextRequest('http://localhost/api/users/target/reset-password', { method: 'POST' }), params)
    expect(res.status).toBe(403)
    expect(sendPasswordResetEmail).not.toHaveBeenCalled()
  })

  const newUser = (role: string) =>
    new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ firstName: 'Awa', lastName: 'Issa', email: 'Nouveau@Example.com', role, password: 'MotDePasse1!' }),
    })

  it('un ADMIN peut créer un compte USER (actif, email vérifié, mot de passe haché)', async () => {
    setup('ADMIN', 'USER')
    const res = await postUser(newUser('USER'))
    expect(res.status).toBe(201)
    const data = (db.user.create as jest.Mock).mock.calls[0][0].data
    expect(data).toMatchObject({ email: 'nouveau@example.com', role: 'USER', isActive: true })
    expect(data.emailVerified).toBeInstanceOf(Date)
    expect(data.password).not.toBe('MotDePasse1!')
  })

  it('un ADMIN ne peut pas créer un compte ADMIN', async () => {
    setup('ADMIN', 'USER')
    const res = await postUser(newUser('ADMIN'))
    expect(res.status).toBe(403)
    expect(db.user.create).not.toHaveBeenCalled()
  })

  it('le SUPER_ADMIN peut créer un WEBMASTER mais jamais un SUPER_ADMIN', async () => {
    setup('SUPER_ADMIN', 'USER')
    expect((await postUser(newUser('WEBMASTER'))).status).toBe(201)
    expect((await postUser(newUser('SUPER_ADMIN'))).status).toBe(403)
  })

  it('refuse un email déjà utilisé', async () => {
    setup('ADMIN', 'USER')
    mockFindUser.mockImplementationOnce(async () => ({ role: 'ADMIN', isDeleted: false, isActive: true }))
    mockFindUser.mockImplementationOnce(async () => ({ isDeleted: false }))
    const res = await postUser(newUser('USER'))
    expect(res.status).toBe(400)
    expect(db.user.create).not.toHaveBeenCalled()
  })
})
