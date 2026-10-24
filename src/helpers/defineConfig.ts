import type { OxlintConfig } from 'oxlint'

/** Merges `field` from every config in the `extends` tree of `config`, and from `config` last. */
const inherit = <Field extends 'env' | 'globals' | 'settings'>(
    config: OxlintConfig,
    field: Field,
): OxlintConfig[Field] =>
    Object.assign(
        {},
        ...(config.extends ?? []).map(parent => inherit(parent, field)),
        config[field],
    ) as OxlintConfig[Field]

/**
 * Drop-in replacement for oxlint's own `defineConfig` that fixes the
 * three path-independent fields oxlint silently drops when resolving
 * `extends`: `settings`, `env`, `globals`. The upstream fix-PR was
 * closed as "we'll let users merge in userland" — see
 * https://github.com/oxc-project/oxc/pull/14940#issuecomment-3777516259
 *
 * The other inherited fields (`plugins`, `jsPlugins`, `categories`,
 * `rules`, `overrides`, `options`) are still merged by oxlint's native
 * `extends` machinery.
 *
 * `ignorePatterns` is deliberately NOT inherited: oxlint resolves those
 * globs relative to each config file's own path, and propagating a
 * parent's patterns would silently change which directory each glob
 * matches at every level. Each config owns its own ignore globs.
 *
 * Inheritance precedence (last wins on conflicts):
 *   own > extends[last] > ... > extends[first]
 * The fields come from the whole `extends` tree, so a parent built
 * without this `defineConfig` still passes on its own parents' fields.
 *
 * `settings` shallow-merges by top-level plugin key — defining
 * `settings.jsdoc` in the child fully replaces a parent's `settings.jsdoc`,
 * while leaving e.g. `settings.react` untouched.
 */
export const defineConfig = (config: OxlintConfig): OxlintConfig =>
    config.extends === undefined
        ? config
        : {
              ...config,
              env: inherit(config, 'env'),
              globals: inherit(config, 'globals'),
              settings: inherit(config, 'settings'),
          }
