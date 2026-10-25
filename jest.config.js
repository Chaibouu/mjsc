const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'actions/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
}

// sanitize-html s'appuie sur htmlparser2, publié uniquement en module ES : Jest doit le transformer
// (Next.js le gère seul au build).
const ESM_PACKAGES = ['htmlparser2', 'domhandler', 'domutils', 'dom-serializer', 'entities', 'domelementtype']

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = async () => {
  const config = await createJestConfig(customJestConfig)()
  // next/jest n'exclut pas `geist` ; on remplace ses règles node_modules par une seule qui
  // laisse aussi passer ces paquets (une seule règle qui correspond suffit à exclure un fichier).
  const keep = ['geist', ...ESM_PACKAGES].join('|')
  config.transformIgnorePatterns = [
    `/node_modules/(?!.pnpm)(?!(${keep})/)`,
    `/node_modules/.pnpm/(?!(${keep})@)`,
    ...config.transformIgnorePatterns.filter((pattern) => !pattern.includes('node_modules')),
  ]
  return config
}
