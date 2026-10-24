import type { OxlintConfig } from 'oxlint'
import { describe, expect, it } from 'vitest'

import { defineConfig } from './defineConfig.ts'

describe('defineConfig', () => {
    it('is a no-op when there is no `extends`', () => {
        const config: OxlintConfig = { rules: { 'eslint/no-console': 'error' } }
        const result = defineConfig(config)
        expect(result).toEqual(config)
    })

    it('preserves the `extends` array on the output (so oxlint resolves plugins/rules/overrides natively)', () => {
        const parent = defineConfig({ env: { browser: true } })
        const result = defineConfig({ extends: [parent] })
        expect(result.extends).toEqual([parent])
    })

    describe('with a single parent', () => {
        const parent = defineConfig({
            env: { browser: true, node: true },
            globals: { __DEV__: 'readonly', __TEST__: 'readonly' },
            settings: {
                jsdoc: { tagNamePreference: { returns: 'return' } },
                react: { version: '18.0' },
            },
        })

        it('shallow-merges `env`, child wins on conflicts', () => {
            const result = defineConfig({
                extends: [parent],
                env: { browser: false, es2024: true },
            })
            expect(result.env).toEqual({
                browser: false,
                es2024: true,
                node: true,
            })
        })

        it('shallow-merges `globals`, child wins on conflicts', () => {
            const result = defineConfig({
                extends: [parent],
                globals: { __DEV__: 'writable', MY_GLOBAL: 'readonly' },
            })
            expect(result.globals).toEqual({
                __DEV__: 'writable',
                __TEST__: 'readonly',
                MY_GLOBAL: 'readonly',
            })
        })

        it('shallow-merges `settings` by top-level plugin key (whole-plugin replacement)', () => {
            const result = defineConfig({
                extends: [parent],
                settings: {
                    jsdoc: { ignorePrivate: true },
                },
            })
            expect(result.settings).toEqual({
                jsdoc: { ignorePrivate: true },
                react: { version: '18.0' },
            })
        })

        it('inherits parent fields when child does not specify them', () => {
            const result = defineConfig({ extends: [parent] })
            expect(result.env).toEqual({ browser: true, node: true })
            expect(result.globals).toEqual({ __DEV__: 'readonly', __TEST__: 'readonly' })
            expect(result.settings).toEqual({
                jsdoc: { tagNamePreference: { returns: 'return' } },
                react: { version: '18.0' },
            })
        })
    })

    describe('with multiple parents', () => {
        const first = defineConfig({
            env: { browser: true, node: true },
            globals: { A: 'readonly', B: 'readonly' },
            settings: { react: { version: '17.0' } },
        })
        const second = defineConfig({
            env: { node: false, es2024: true },
            globals: { B: 'writable', C: 'readonly' },
            settings: { react: { version: '18.0' }, jsdoc: { ignorePrivate: true } },
        })

        it('respects precedence: own > extends[last] > ... > extends[first]', () => {
            const result = defineConfig({
                extends: [first, second],
                env: { es2024: false },
                globals: { C: 'writable' },
                settings: { jsdoc: { tagNamePreference: { returns: 'return' } } },
            })

            expect(result.env).toEqual({
                browser: true,
                es2024: false,
                node: false,
            })
            expect(result.globals).toEqual({
                A: 'readonly',
                B: 'writable',
                C: 'writable',
            })
            expect(result.settings).toEqual({
                jsdoc: { tagNamePreference: { returns: 'return' } },
                react: { version: '18.0' },
            })
        })

        it('merges across parents even when the child does not override anything', () => {
            const result = defineConfig({ extends: [first, second] })
            expect(result.env).toEqual({
                browser: true,
                es2024: true,
                node: false,
            })
            expect(result.globals).toEqual({
                A: 'readonly',
                B: 'writable',
                C: 'readonly',
            })
            expect(result.settings).toEqual({
                jsdoc: { ignorePrivate: true },
                react: { version: '18.0' },
            })
        })
    })

    describe('with a multi-level chain (grandparent -> parent -> child)', () => {
        const grandparent = defineConfig({
            env: { browser: true, node: true },
            globals: { GP: 'readonly' },
            settings: { react: { version: '17.0' }, jsdoc: { ignorePrivate: true } },
        })
        const parent = defineConfig({
            extends: [grandparent],
            env: { es2024: true },
            globals: { P: 'readonly' },
            settings: { react: { version: '18.0' } },
        })

        it('flattens grandparent fields onto each intermediate level so merges compose', () => {
            expect(parent.env).toEqual({ browser: true, es2024: true, node: true })
            expect(parent.globals).toEqual({ GP: 'readonly', P: 'readonly' })
            expect(parent.settings).toEqual({
                jsdoc: { ignorePrivate: true },
                react: { version: '18.0' },
            })
        })

        it('child sees the full transitive merge', () => {
            const child = defineConfig({
                extends: [parent],
                env: { browser: false },
                globals: { C: 'writable' },
                settings: { react: { version: '19.0' } },
            })
            expect(child.env).toEqual({ browser: false, es2024: true, node: true })
            expect(child.globals).toEqual({
                C: 'writable',
                GP: 'readonly',
                P: 'readonly',
            })
            expect(child.settings).toEqual({
                jsdoc: { ignorePrivate: true },
                react: { version: '19.0' },
            })
        })

        it('collects fields through a parent built without `defineConfig`', () => {
            const plainParent: OxlintConfig = { extends: [grandparent], globals: { P: 'readonly' } }
            const child = defineConfig({ extends: [plainParent] })
            expect(child.env).toEqual({ browser: true, node: true })
            expect(child.globals).toEqual({ GP: 'readonly', P: 'readonly' })
            expect(child.settings).toEqual({
                jsdoc: { ignorePrivate: true },
                react: { version: '17.0' },
            })
        })
    })

    describe('non-inherited fields', () => {
        it('does not inherit `ignorePatterns` from parent', () => {
            const parent = defineConfig({ ignorePatterns: ['build/**', 'dist/**'] })
            const child = defineConfig({ extends: [parent] })
            expect(child.ignorePatterns).toBeUndefined()
        })

        it('keeps the child\u2019s own `ignorePatterns` untouched', () => {
            const parent = defineConfig({ ignorePatterns: ['build/**'] })
            const child = defineConfig({
                extends: [parent],
                ignorePatterns: ['coverage/**'],
            })
            expect(child.ignorePatterns).toEqual(['coverage/**'])
        })
    })

    describe('fields that oxlint merges itself', () => {
        it('leaves `options` to oxlint\u2019s own `extends`', () => {
            const parent = defineConfig({
                options: { reportUnusedDisableDirectives: 'off' },
            })
            const child = defineConfig({ extends: [parent] })
            expect(child.options).toBeUndefined()
        })

        it('keeps the child\u2019s own `options` untouched', () => {
            const parent = defineConfig({
                options: { reportUnusedDisableDirectives: 'error' },
            })
            const child = defineConfig({
                extends: [parent],
                options: { reportUnusedDisableDirectives: 'off' },
            })
            expect(child.options).toEqual({ reportUnusedDisableDirectives: 'off' })
        })
    })

    describe('mutation safety', () => {
        it('does not mutate the parent config when extending', () => {
            const parent = defineConfig({
                env: { browser: true, node: true },
                globals: { GLOBAL_A: 'readonly' },
                settings: { react: { version: '18.0' } },
            })
            const snapshot = structuredClone(parent)

            defineConfig({
                extends: [parent],
                env: { browser: false },
                globals: { GLOBAL_A: 'writable', GLOBAL_B: 'readonly' },
                settings: { react: { version: '19.0' }, jsdoc: { ignorePrivate: true } },
            })

            expect(parent).toEqual(snapshot)
        })

        it('does not mutate parent\u2019s nested settings objects', () => {
            const parent = defineConfig({
                settings: { react: { version: '18.0' } },
            })
            const reactSettingsRef = parent.settings?.react

            defineConfig({
                extends: [parent],
                settings: { react: { version: '19.0' } },
            })

            expect(reactSettingsRef).toEqual({ version: '18.0' })
        })
    })
})
