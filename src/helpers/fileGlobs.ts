/** Globs for the `files` of an `overrides` entry, by the kind of file they match. */
interface FileGlobs {
    /** Vitest benchmarks. */
    benchmarks: string[]
    /** Plain JavaScript files, which have no types. */
    javascript: string[]
    /** Storybook stories. */
    stories: string[]
    /**
     * Stories, docs and Storybook setups, plus tests and benchmarks: files that never ship to
     * consumers. Presets relax rules for them in an `overrides` entry.
     */
    storybookAndTests: string[]
    /** Tests, their mocks, and the helpers in their folders. */
    tests: string[]
    /** Repo tooling: scripts, tasks and tools folders. */
    tooling: string[]
}

const benchmarks = ['**/*.bench.{ts,tsx}']
const stories = ['**/*.stories.{ts,tsx}']
const tests = [
    '**/*.test.{ts,tsx}',
    '**/*.spec.{ts,tsx}',
    '**/__mocks__/**',
    '**/__tests__/**',
    '**/e2e/**',
    '**/tests/**',
]

export const FILE_GLOBS: FileGlobs = {
    benchmarks,
    javascript: ['**/*.{js,cjs,mjs,jsx}'],
    stories,
    storybookAndTests: [
        ...stories,
        '**/docs/**',
        '**/.storybook*/**',
        '**/.rnstorybook/**',
        ...tests,
        ...benchmarks,
    ],
    tests,
    tooling: ['**/scripts/**', '**/tasks/**', '**/tools/**'],
}
