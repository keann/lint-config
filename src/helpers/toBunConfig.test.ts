import type { OxlintConfig } from 'oxlint'
import { describe, expect, it } from 'vitest'

import { resolvePlugin } from './resolvePlugin.ts'
import { toBunConfig } from './toBunConfig.ts'

const JSDOC_PLUGIN = { name: 'js-doc', specifier: resolvePlugin('eslint-plugin-jsdoc') }

describe('toBunConfig', () => {
    it('swaps the built-in `jsdoc` plugin for `eslint-plugin-jsdoc` as `js-doc`', () => {
        const config: OxlintConfig = {
            plugins: ['eslint', 'jsdoc'],
            jsPlugins: ['/plugins/de-morgan.js'],
        }
        expect(toBunConfig(config)).toStrictEqual({
            plugins: ['eslint'],
            jsPlugins: ['/plugins/de-morgan.js', JSDOC_PLUGIN],
        })
    })

    it('renames `jsdoc/` rules and keeps their settings', () => {
        const config: OxlintConfig = {
            rules: {
                'eslint/no-debugger': 'error',
                'jsdoc/check-tag-names': ['error', { typed: true }],
                'jsdoc/require-param': 'off',
            },
        }
        expect(toBunConfig(config).rules).toStrictEqual({
            'eslint/no-debugger': 'error',
            'js-doc/check-tag-names': ['error', { typed: true }],
            'js-doc/require-param': 'off',
        })
    })

    it('renames the rules of overrides', () => {
        const config: OxlintConfig = {
            overrides: [
                { files: ['**/*.test.ts'], rules: { 'jsdoc/empty-tags': 'off' } },
                { files: ['**/*.js'], env: { node: true } },
            ],
        }
        expect(toBunConfig(config).overrides).toStrictEqual([
            { files: ['**/*.test.ts'], rules: { 'js-doc/empty-tags': 'off' } },
            { files: ['**/*.js'], env: { node: true } },
        ])
    })

    it('rewrites the whole `extends` tree', () => {
        const grandparent: OxlintConfig = { rules: { 'jsdoc/no-defaults': 'error' } }
        const config: OxlintConfig = { extends: [{ extends: [grandparent] }] }
        expect(toBunConfig(config).extends?.[0]?.extends?.[0]?.rules).toStrictEqual({
            'js-doc/no-defaults': 'error',
        })
    })

    it('leaves a config without jsdoc untouched', () => {
        const config: OxlintConfig = {
            plugins: ['vitest'],
            rules: { 'vitest/expect-expect': 'error' },
        }
        expect(toBunConfig(config)).toStrictEqual(config)
    })

    it('does not mutate its input', () => {
        const config: OxlintConfig = {
            plugins: ['jsdoc'],
            rules: { 'jsdoc/no-defaults': 'error' },
        }
        const snapshot = structuredClone(config)
        toBunConfig(config)
        expect(config).toStrictEqual(snapshot)
    })
})
