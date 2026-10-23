import type { OxlintConfig } from 'oxlint'

import { FILE_GLOBS } from './helpers/fileGlobs.ts'
import correctness from './categories/correctness.ts'
import nursery from './categories/nursery.ts'
import pedantic from './categories/pedantic.ts'
import perf from './categories/perf.ts'
import restriction from './categories/restriction.ts'
import style from './categories/style.ts'
import suspicious from './categories/suspicious.ts'
import deMorgan from './plugins/de-morgan.ts'
import e18e from './plugins/e18e.ts'
import reactEffects from './plugins/react-you-might-not-need-an-effect.ts'

/**
 * The presets to list in `extends`. The categories configure the rules of every built-in plugin,
 * and oxlint skips the rules of a plugin that no config turns on, so `react` and `vitest` turn
 * plugins on. `react` also brings the effect rules.
 */
interface Presets {
    /** The rules for any JavaScript or TypeScript code. */
    base: OxlintConfig
    /** Turns on the React, accessibility, and effect rules. */
    react: OxlintConfig
    /** Turns on the Vitest rules. */
    vitest: OxlintConfig
}

const base: OxlintConfig = {
    extends: [correctness, suspicious, perf, pedantic, style, restriction, nursery, deMorgan, e18e],
    plugins: ['eslint', 'import', 'jsdoc', 'oxc', 'promise', 'typescript', 'unicorn'],
    options: {
        reportUnusedDisableDirectives: 'error',
        typeAware: true,
    },
    overrides: [
        {
            files: FILE_GLOBS.storybookAndTests,
            rules: {
                'eslint/no-alert': 'off',
                'eslint/no-multi-str': 'off',
                'eslint/no-underscore-dangle': 'off',
                'eslint/prefer-destructuring': 'off',
                'jsdoc/empty-tags': 'off',
                'oxc/no-map-spread': 'off',
                'promise/always-return': 'off',
                'react/only-export-components': 'off',
                'typescript/no-non-null-assertion': 'off',
                'typescript/non-nullable-type-assertion-style': 'off',
                'typescript/require-await': 'off',
                'unicorn/consistent-function-scoping': 'off',
                'unicorn/prefer-set-has': 'off',
            },
        },
        {
            files: FILE_GLOBS.tests,
            rules: {
                'eslint/no-param-reassign': 'off',
            },
        },
        {
            files: FILE_GLOBS.benchmarks,
            rules: {
                'vitest/expect-expect': 'off',
            },
        },
        {
            files: FILE_GLOBS.tooling,
            // Code under `src/` ships, even in a folder named like tooling.
            excludeFiles: ['**/src/**'],
            rules: {
                'eslint/no-console': 'off',
            },
        },
        {
            // Without types, every value is `any`.
            files: FILE_GLOBS.javascript,
            rules: {
                'typescript/no-unsafe-argument': 'off',
                'typescript/no-unsafe-assignment': 'off',
                'typescript/no-unsafe-call': 'off',
                'typescript/no-unsafe-member-access': 'off',
                'typescript/no-unsafe-return': 'off',
            },
        },
    ],
}

export const presets: Presets = {
    base,
    react: {
        extends: [reactEffects],
        plugins: ['jsx-a11y', 'react'],
    },
    vitest: { plugins: ['vitest'] },
}
