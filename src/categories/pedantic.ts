import { defineConfig } from 'oxlint'

/**
 * The `pedantic` category holds rules that are rather strict or have occasional false positives.
 * The whole category is on: the rules listed here are the exceptions.
 */
export default defineConfig({
    categories: {
        pedantic: 'error',
    },
    rules: {
        // Differ from the defaults
        'typescript/ban-ts-comment': ['error', { minimumDescriptionLength: 10 }],
        'typescript/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
        'typescript/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
        'typescript/prefer-nullish-coalescing': [
            'error',
            { ignorePrimitives: { string: true, boolean: true } },
        ],
        'typescript/restrict-plus-operands': [
            'error',
            {
                allowAny: false,
                allowBoolean: false,
                allowNullish: false,
                allowNumberAndString: false,
                allowRegExp: false,
            },
        ],
        'typescript/switch-exhaustiveness-check': ['error', { requireDefaultForNonUnion: true }],

        // Rejected
        // 💭 Size limit: parsers and state machines nest by design.
        'eslint/max-depth': 'off',
        // 💭 Size limit: components and test files run long by nature.
        'eslint/max-lines': 'off',
        // 💭 Size limit: components and `describe` blocks are long functions.
        'eslint/max-lines-per-function': 'off',
        // 💭 A short trailing note can read better than a line of its own.
        'eslint/no-inline-comments': 'off',
        // 💭 A negated guard often reads better first.
        'eslint/no-negated-condition': 'off',
        // 📜 `typescript/only-throw-error` reports it with types.
        'eslint/no-throw-literal': 'off',
        // 💭 TODO and FIXME comments are allowed.
        'eslint/no-warning-comments': 'off',
        // 📜 The `typescript/` rule of the same name reports it with types.
        'eslint/prefer-promise-reject-errors': 'off',
        // 📜 `typescript/require-await` reports it with types.
        'eslint/require-await': 'off',
        // 💭 A `u` or `v` flag on every ASCII regex is noise.
        'eslint/require-unicode-regexp': 'off',
        // 💭 The order of names in one declaration carries no meaning.
        'eslint/sort-vars': 'off',
        // 💭 Size limit: an import count says little.
        'import/max-dependencies': 'off',
        // 💭 The parameters are typed, so a description for each is optional.
        'jsdoc/require-param': 'off',
        // 📜 TypeScript holds the types.
        'jsdoc/require-param-type': 'off',
        // 💭 The return type is typed, so a `@returns` line is optional.
        'jsdoc/require-returns': 'off',
        // 📜 TypeScript holds the types.
        'jsdoc/require-returns-type': 'off',
        // 📜 TypeScript holds the types.
        'jsdoc/require-yields-type': 'off',
        // 💭 Components take the name of their variable; wrappers that need one set `displayName`.
        'react/display-name': 'off',
        // 📜 Deprecated. `no-empty-object-type`, `no-unsafe-function-type`
        // and `no-wrapper-object-types` replace it.
        'typescript/ban-types': 'off',
        // 💭 `readonly` on every parameter type is impractical.
        'typescript/prefer-readonly-parameter-types': 'off',
        // 📜 Deprecated. `ban-ts-comment` covers it.
        'typescript/prefer-ts-expect-error': 'off',
        // 💭 Truthiness checks on strings and numbers are idiomatic.
        'typescript/strict-boolean-expressions': 'off',
        // 💭 A callback may return a value where `void` is expected, e.g. `() => null`.
        'typescript/strict-void-return': 'off',
        // 📜 `no-new-wrappers` and `no-new-native-nonconstructor` report the same.
        'unicorn/new-for-builtins': 'off',
        // 💭 Passing a function to `map` or `filter` is idiomatic, and TypeScript checks it.
        'unicorn/no-array-callback-reference': 'off',
        // 📜 `unicorn/no-instanceof-builtins` reports it.
        'unicorn/no-instanceof-array': 'off',
        // 💭 A negated guard often reads better first, as for `eslint/no-negated-condition`.
        'unicorn/no-negated-condition': 'off',
        // 💭 An explicit `undefined` can be deliberate, as in `mockReturnValue(undefined)`.
        'unicorn/no-useless-undefined': 'off',
        // 📜 Its fix rewrites array-likes such as `NodeList`, which have no `.at()`.
        // Revisit when the fix checks the receiver's type.
        'unicorn/prefer-at': 'off',
        // 📜 `parseInt('12px')` is 12 and `Number('12px')` is `NaN`, so its fix changes results.
        'unicorn/prefer-number-coercion': 'off',
        // 💭 `getElementsByTagName` and `getElementById` say exactly what they select.
        'unicorn/prefer-query-selector': 'off',
        // 💭 At an entry point, a promise chain such as `main().catch(…)` reads as clearly.
        'unicorn/prefer-top-level-await': 'off',
        // 💭 Table-driven tests branch on case data.
        'vitest/no-conditional-in-test': 'off',
    },
})
