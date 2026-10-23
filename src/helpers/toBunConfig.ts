import type { OxlintConfig } from 'oxlint'

import { resolvePlugin } from './resolvePlugin.ts'

type Rules = NonNullable<OxlintConfig['rules']>

/** Renames the `jsdoc/` rules to the `js-doc/` rules of `eslint-plugin-jsdoc`. */
const renameRules = (rules: Rules): Rules =>
    Object.fromEntries(
        Object.entries(rules).map(([name, setting]) => [
            name.replace(/^jsdoc\//u, 'js-doc/'),
            setting,
        ]),
    )

type Override = NonNullable<OxlintConfig['overrides']>[number]

/** Renames the `jsdoc/` rules of an `overrides` entry. */
const renameOverrideRules = (override: Override): Override =>
    override.rules === undefined ? override : { ...override, rules: renameRules(override.rules) }

/**
 * Rewrites a config and its `extends` tree for `bun lint`, which has no built-in `jsdoc` plugin
 * and reserves its name. The `jsdoc/` rules run from `eslint-plugin-jsdoc` instead, as the JS
 * plugin `js-doc`, with the same settings.
 */
export const toBunConfig = (config: OxlintConfig): OxlintConfig => {
    const { extends: parents, jsPlugins, overrides, plugins, rules } = config
    const result: OxlintConfig = { ...config }

    if (parents !== undefined) result.extends = parents.map(toBunConfig)
    if (rules !== undefined) result.rules = renameRules(rules)
    if (overrides !== undefined) {
        result.overrides = overrides.map(renameOverrideRules)
    }
    if (plugins?.includes('jsdoc')) {
        result.plugins = plugins.filter(plugin => plugin !== 'jsdoc')
        result.jsPlugins = [
            ...(jsPlugins ?? []),
            { name: 'js-doc', specifier: resolvePlugin('eslint-plugin-jsdoc') },
        ]
    }

    return result
}
