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

jest.mock('next/headers', () => ({ headers: jest.fn() }))
jest.mock('@/lib/tokens', () => ({ getUserIdFromToken: jest.fn() }))
jest.mock('@/lib/db', () => ({
  db: { user: { findUnique: jest.fn(), findFirst: jest.fn() } },
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
  mockFindUser.mockImplementation(async ({ where }: { where: { id: string } }) =>
    where.id === 'actor'
      ? { role: actorRole, isDeleted: false, isActive: true }
      : { id: where.id, role: targetRole, isDeleted: false }
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
})
