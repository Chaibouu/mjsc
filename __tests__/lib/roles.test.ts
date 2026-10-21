import { assignableRoles, canManageUser, hasRole, ADMIN_ROLES, CONTENT_ROLES } from '@/lib/roles'

describe('hasRole', () => {
  it('reconnaît les rôles d’administration et de contenu', () => {
    expect(hasRole('SUPER_ADMIN', ADMIN_ROLES)).toBe(true)
    expect(hasRole('WEBMASTER', ADMIN_ROLES)).toBe(false)
    expect(hasRole('WEBMASTER', CONTENT_ROLES)).toBe(true)
    expect(hasRole('USER', CONTENT_ROLES)).toBe(false)
  })

  it('rejette une valeur inconnue ou vide', () => {
    expect(hasRole('ROOT', ADMIN_ROLES)).toBe(false)
    expect(hasRole(undefined, ADMIN_ROLES)).toBe(false)
  })
})

describe('assignableRoles', () => {
  it('le SUPER_ADMIN attribue tous les rôles sauf SUPER_ADMIN', () => {
    expect(assignableRoles('SUPER_ADMIN')).toEqual(['ADMIN', 'WEBMASTER', 'USER', 'ASSOCIATION'])
  })

  it('un ADMIN n’attribue que USER et ASSOCIATION', () => {
    expect(assignableRoles('ADMIN')).toEqual(['USER', 'ASSOCIATION'])
  })

  it.each(['WEBMASTER', 'USER', 'ASSOCIATION'])('%s n’attribue aucun rôle', (role) => {
    expect(assignableRoles(role)).toEqual([])
  })
})

describe('canManageUser', () => {
  it('personne ne gère un SUPER_ADMIN', () => {
    expect(canManageUser('SUPER_ADMIN', 'SUPER_ADMIN')).toBe(false)
    expect(canManageUser('ADMIN', 'SUPER_ADMIN')).toBe(false)
  })

  it('le SUPER_ADMIN gère les ADMIN, WEBMASTER et comptes standards', () => {
    for (const target of ['ADMIN', 'WEBMASTER', 'USER', 'ASSOCIATION']) {
      expect(canManageUser('SUPER_ADMIN', target)).toBe(true)
    }
  })

  it('un ADMIN ne gère que les comptes standards', () => {
    expect(canManageUser('ADMIN', 'USER')).toBe(true)
    expect(canManageUser('ADMIN', 'ASSOCIATION')).toBe(true)
    expect(canManageUser('ADMIN', 'ADMIN')).toBe(false)
    expect(canManageUser('ADMIN', 'WEBMASTER')).toBe(false)
  })

  it('un WEBMASTER ne gère aucun compte', () => {
    expect(canManageUser('WEBMASTER', 'USER')).toBe(false)
  })
})
