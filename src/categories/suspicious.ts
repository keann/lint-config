import { defineConfig } from 'oxlint'

/**
 * The `suspicious` category covers code that is most likely wrong or useless.
 * The whole category is on: the rules listed here are the exceptions.
 */
export default defineConfig({
    categories: {
        suspicious: 'error',
    },
    rules: {
        // Differ from the defaults
        'eslint/no-underscore-dangle': ['error', { allow: ['__DEV__'] }],
        'import/no-unassigned-import': ['error', { allow: ['**/*.{css,scss,sass,less}'] }],
        'promise/always-return': ['error', { ignoreLastCallback: true }],

        // Rejected
        // 📜 `no-var` already bans `var`.
        'eslint/block-scoped-var': 'off',
        // 📜 `typescript/no-implied-eval` reports it with types.
        'eslint/no-implied-eval': 'off',
        // 💭 Packages like `prettier` export the same names on the default and by name.
        'import/no-named-as-default-member': 'off',
        // 💭 The rule targets Node server handlers, and the presets target front-end code.
        // Revisit in a `presets.node`, if one is added.
        'oxc/no-async-endpoint-handlers': 'off',
        // 📜 `new-cap` covers it.
        'react/capitalized-calls': 'off',
        // 📜 `rules-of-hooks` also catches hooks in loops and plain functions.
        'react/hooks': 'off',
        // 📜 `no-script-url` reports the same.
        'react/jsx-no-script-url': 'off',
        // 📜 The automatic JSX runtime needs no `React` in scope.
        'react/react-in-jsx-scope': 'off',
        // 💭 An effect may return a cleanup on one path and nothing on another.
        'typescript/consistent-return': 'off',
        // 💭 Narrowing assertions at parse boundaries are deliberate, e.g. `parsed as Config`.
        'typescript/no-unsafe-type-assertion': 'off',
        // 📜 `export {}` is what makes a global augmentation file a module.
        'unicorn/require-module-specifiers': 'off',
        // 💭 It can't tell `window.postMessage` from a worker's, which takes no origin.
        'unicorn/require-post-message-target-origin': 'off',
    },
})
