import { defineConfig } from 'oxlint'

import { resolvePlugin } from '../helpers/resolvePlugin.ts'

/**
 * [eslint-plugin-de-morgan](https://github.com/azat-io/eslint-plugin-de-morgan) rewrites negated
 * `&&` and `||` groups with De Morgan's laws. Both of its rules are on.
 */
export default defineConfig({
    jsPlugins: [resolvePlugin('eslint-plugin-de-morgan')],
    rules: {
        'de-morgan/no-negated-conjunction': 'error',
        'de-morgan/no-negated-disjunction': 'error',
    },
})
