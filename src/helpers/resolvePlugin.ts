import { fileURLToPath } from 'node:url'

/**
 * Resolves an ESLint plugin from this package's dependencies to an absolute path. Oxlint resolves
 * a bare `jsPlugins` name from the consumer's config file, which cannot reach the bundled
 * dependencies, nor the others under a strict `node_modules` layout.
 */
export const resolvePlugin = (name: string): string => fileURLToPath(import.meta.resolve(name))
