import { isRouteProtected } from '@/utils/is-route-protected'

describe('isRouteProtected', () => {
  it('bloque /users pour un USER', () => {
    expect(isRouteProtected('USER', '/users')).toBe(true)
  })

  it('autorise /users pour un ADMIN', () => {
    expect(isRouteProtected('ADMIN', '/users')).toBe(false)
  })

  it('bloque les sous-pages réservées du portail pour un USER', () => {
    expect(isRouteProtected('USER', '/portail/actualites')).toBe(true)
    expect(isRouteProtected('USER', '/portail/medias')).toBe(true)
  })

  it('autorise /association pour le rôle ASSOCIATION', () => {
    expect(isRouteProtected('ASSOCIATION', '/association')).toBe(false)
  })

  it('autorise le WEBMASTER sur le portail web mais pas sur /users', () => {
    expect(isRouteProtected('WEBMASTER', '/portail/actualites')).toBe(false)
    expect(isRouteProtected('WEBMASTER', '/portail/articles')).toBe(false)
    expect(isRouteProtected('WEBMASTER', '/users')).toBe(true)
  })

  it('autorise le SUPER_ADMIN partout', () => {
    for (const path of ['/users', '/association', '/portail/medias', '/dashboard/settings']) {
      expect(isRouteProtected('SUPER_ADMIN', path)).toBe(false)
    }
  })

  it('ne bloque pas une route absente de la navigation', () => {
    expect(isRouteProtected('USER', '/route-inconnue')).toBe(false)
  })
})
