import type { OxlintConfig } from 'oxlint'
import { describe, expect, it } from 'vitest'

import { expandCategories } from './expandCategories.ts'

const RULES_BY_CATEGORY = {
    correctness: ['eslint/no-debugger', 'eslint/no-unused-vars'],
    style: ['eslint/curly'],
}

describe('expandCategories', () => {
    it('turns on every rule of a category that is on, and turns the category off', () => {
        const config: OxlintConfig = { categories: { correctness: 'error' } }
        expect(expandCategories(config, RULES_BY_CATEGORY)).toStrictEqual({
            categories: { correctness: 'off' },
            rules: { 'eslint/no-debugger': 'error', 'eslint/no-unused-vars': 'error' },
        })
    })

    it('keeps the setting of a rule that the config sets', () => {
        const config: OxlintConfig = {
            categories: { correctness: 'error' },
            rules: {
                'eslint/no-debugger': 'off',
                'eslint/no-unused-vars': ['error', { args: 'none' }],
            },
        }
        expect(expandCategories(config, RULES_BY_CATEGORY).rules).toStrictEqual(config.rules)
    })

    it('lists no rules for a category that is off', () => {
        const config: OxlintConfig = {
            categories: { style: 'off' },
            rules: { 'eslint/curly': ['error', 'multi-line'] },
        }
        expect(expandCategories(config, RULES_BY_CATEGORY)).toStrictEqual(config)
    })
})
