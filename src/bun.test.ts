import type { OxlintConfig } from 'oxlint'
import { describe, expect, it } from 'vitest'

import { defineConfig } from './bun.ts'

describe('defineConfig for bun lint', () => {
    it('renames the `jsdoc/` rules of the config and its overrides', () => {
        const result = defineConfig({
            rules: { 'jsdoc/check-tag-names': 'off' },
            overrides: [{ files: ['**/*.ts'], rules: { 'jsdoc/empty-tags': 'off' } }],
        })

        expect(result.rules).toStrictEqual({ 'js-doc/check-tag-names': 'off' })
        expect(result.overrides?.[0]?.rules).toStrictEqual({ 'js-doc/empty-tags': 'off' })
    })

    it('merges `env`, `globals`, and `settings` from the `extends` tree', () => {
        const parent: OxlintConfig = { env: { node: true }, settings: { react: { version: '19' } } }
        const result = defineConfig({ extends: [parent], env: { browser: true } })

        expect(result.env).toStrictEqual({ browser: true, node: true })
        expect(result.settings).toStrictEqual({ react: { version: '19' } })
    })

    it('leaves a config that extends a renamed config unchanged', () => {
        const root = defineConfig({ plugins: ['jsdoc'], rules: { 'jsdoc/no-defaults': 'off' } })

        expect(defineConfig({ extends: [root] }).extends).toStrictEqual([root])
    })
})
