import { defineConfig } from 'oxlint'

import { resolvePlugin } from '../helpers/resolvePlugin.ts'

/**
 * [eslint-plugin-react-you-might-not-need-an-effect](https://github.com/NickvanDyke/eslint-plugin-react-you-might-not-need-an-effect)
 * flags effects that React's "You Might Not Need an Effect" guide replaces with plain code. Its
 * recommended rules are on, as errors.
 */
export default defineConfig({
    jsPlugins: [resolvePlugin('eslint-plugin-react-you-might-not-need-an-effect')],
    rules: {
        'react-you-might-not-need-an-effect/no-adjust-state-on-prop-change': 'error',
        'react-you-might-not-need-an-effect/no-chain-state-updates': 'error',
        'react-you-might-not-need-an-effect/no-derived-state': 'error',
        'react-you-might-not-need-an-effect/no-event-handler': 'error',
        'react-you-might-not-need-an-effect/no-external-store-subscription': 'error',
        'react-you-might-not-need-an-effect/no-initialize-state': 'error',
        'react-you-might-not-need-an-effect/no-pass-data-to-parent': 'error',
        'react-you-might-not-need-an-effect/no-pass-live-state-to-parent': 'error',
        'react-you-might-not-need-an-effect/no-reset-all-state-on-prop-change': 'error',
    },
})
