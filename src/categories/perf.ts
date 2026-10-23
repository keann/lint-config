import { defineConfig } from 'oxlint'

/**
 * The `perf` category covers code that can be written to run faster.
 * The whole category is on: the rules listed here are the exceptions.
 */
export default defineConfig({
    categories: {
        perf: 'error',
    },
    rules: {
        // 💭 A `{}` default matters only where it feeds memo or effect dependencies.
        'react/no-object-type-as-default-prop': 'off',
    },
})
