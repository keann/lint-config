import { defineConfig } from 'oxlint'

import { resolvePlugin } from '../helpers/resolvePlugin.ts'

/**
 * [@e18e/eslint-plugin](https://github.com/e18e/eslint-plugin) flags dependencies that have native,
 * faster, or lighter replacements. Only `ban-dependencies` is on: its other rules overlap `unicorn`.
 */
export default defineConfig({
    jsPlugins: [resolvePlugin('@e18e/eslint-plugin')],
    rules: {
        'e18e/ban-dependencies': 'error',
    },
})
