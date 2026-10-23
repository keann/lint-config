import { defineConfig } from 'oxlint'

/**
 * The `nursery` category holds new rules that are still under development.
 * The category is off: only the rules set to `'error'` here are on.
 */
export default defineConfig({
    categories: {
        nursery: 'off',
    },
    rules: {
        'eslint/no-restricted-exports': ['error', { restrictDefaultExports: { named: true } }],
        'eslint/no-unreachable-loop': 'error',
        'eslint/no-useless-assignment': 'error',
        'import/export': 'error',
        'import/named': 'error',
        'promise/no-return-in-finally': 'error',
        'react/require-render-return': 'error',
        'typescript/no-unnecessary-condition': 'error',
        'typescript/prefer-optional-chain': 'error',
        'unicorn/no-useless-iterator-to-array': 'error',
    },
})
