import { defineConfig } from 'oxlint'

/**
 * The `correctness` category covers code that is outright wrong or useless.
 * The whole category is on: the rules listed here are the exceptions.
 */
export default defineConfig({
    categories: {
        correctness: 'error',
    },
    rules: {
        // Differ from the defaults
        'jsdoc/check-tag-names': ['error', { typed: true, jsxTags: true }],
        'typescript/restrict-template-expressions': [
            'error',
            { allowAny: false, allowNullish: false, allowRegExp: false },
        ],
        'vitest/expect-expect': [
            'error',
            { assertFunctionNames: ['expect', 'expect*', 'assert*'] },
        ],
        'vitest/no-standalone-expect': [
            'error',
            { additionalTestBlockFunctions: ['beforeAll', 'beforeEach', 'afterEach', 'afterAll'] },
        ],
        'vitest/valid-expect': ['error', { maxArgs: 2 }],
        'vitest/valid-title': ['error', { allowArguments: true }],

        // Rejected
        // 📜 `no-labels` already bans labels.
        'eslint/no-unused-labels': 'off',
        // 📜 TypeScript checks namespace members, and the rule can't follow a computed key.
        'import/namespace': 'off',
        // 📜 TypeScript holds the types.
        'jsdoc/require-property-type': 'off',
        // 💭 Styled `div`s carry roles on purpose, e.g. `role="status"` instead of `<output>`.
        'jsx-a11y/prefer-tag-over-role': 'off',
        // 📜 `no-constant-binary-expression` reports the same comparisons.
        'oxc/bad-object-literal-comparison': 'off',
        // 📜 `exhaustive-effect-dependencies` and `memo-dependencies` cover it.
        'react/exhaustive-deps': 'off',
        // 📜 `typescript/await-thenable` reports it with types.
        'unicorn/no-unnecessary-await': 'off',
        // 📜 The `typescript/` rule of the same name reports it with types.
        'unicorn/prefer-string-starts-ends-with': 'off',
        // 💭 A bare `vi.fn()` stand-in needs no type parameters to do its job.
        'vitest/require-mock-type-parameters': 'off',
        // 💭 `test.todo` is a deliberate placeholder.
        'vitest/warn-todo': 'off',
    },
})
