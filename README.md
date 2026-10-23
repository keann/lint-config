<div align="center">

# @keann/lint-config

<img alt="npm" src="https://img.shields.io/npm/v/@keann/lint-config" align="absmiddle" /> ·
[Releases](https://github.com/keann/lint-config/releases)

</div>

A strict, type-aware lint config for [Oxlint](https://oxc.rs/docs/guide/usage/linter) and
`bun lint`, written for TypeScript, React, and Vitest. The same config file runs under both linters
and turns on the same rules in each.

## Table of contents

- [Setup](#setup)
- [Presets](#presets)
- [JSDoc rules under Bun](#jsdoc-rules-under-bun)
- [Tests with bun test](#tests-with-bun-test)
- [Extending configs](#extending-configs)
- [Linter versions](#linter-versions)

## Setup

```ts
// oxlint.config.ts
import { defineConfig, presets } from '@keann/lint-config'

export default defineConfig({
    extends: [presets.base, presets.react, presets.vitest],
})
```

This file is the same for both linters.

### bun lint

```sh
bun add -dE @keann/lint-config
bun lint
```

`bun lint` ships in Bun canary only, so far. `bun upgrade --canary` installs it. `bun lint` runs the
type-aware rules with its own type checker, and needs neither `oxlint` nor `oxlint-tsgolint`.

### Oxlint

```sh
bun add -dE @keann/lint-config oxlint oxlint-tsgolint
bunx oxlint
```

Any package manager works: `npm install -DE` or `pnpm add -DE` with the same packages.
`oxlint-tsgolint` runs the type-aware rules.

Oxlint has to run on Node. `bun --bun oxlint` runs it on the Bun runtime, which loads the `bun lint`
build of this package, and that build fails under oxlint because `eslint` is missing.

### Options

`presets.base` sets `typeAware: true` and `reportUnusedDisableDirectives: 'error'` in `options`. A
config's own `options` override them key by key.

The presets turn every rule on by name, so a config's `categories` can only turn more rules on. Turn
a rule off by name in `rules`.

## Presets

`presets.react` and `presets.vitest` add to `presets.base`:

- `presets.react` turns on the React, accessibility, and effect rules. JSX is allowed in `.tsx`
  files only.
- `presets.vitest` turns on the Vitest rules.

The presets also run four ESLint plugins as JS plugins:

- [`eslint-plugin-de-morgan`](https://github.com/azat-io/eslint-plugin-de-morgan) in
  `presets.base`, with both of its rules.
- [`@e18e/eslint-plugin`](https://github.com/e18e/eslint-plugin) in `presets.base`, with
  `ban-dependencies` only.
- [`eslint-plugin-react-you-might-not-need-an-effect`](https://github.com/NickvanDyke/eslint-plugin-react-you-might-not-need-an-effect)
  in `presets.react`, with its recommended rules.
- [`eslint-plugin-jsdoc`](https://github.com/gajus/eslint-plugin-jsdoc) in `presets.base`, under
  `bun lint` only. See [JSDoc rules under Bun](#jsdoc-rules-under-bun).

`presets.base` relaxes rules for these kinds of files, with the globs in `FILE_GLOBS`:

- `storybookAndTests`: stories, docs, Storybook setups (`.storybook*/`, `.rnstorybook/`), tests,
  and benchmarks.
- `tests`: `*.test.*` and `*.spec.*` files, and the `__tests__/`, `__mocks__/`, `e2e/`, and
  `tests/` folders.
- `benchmarks`: Vitest benchmarks.
- `tooling`: the `scripts/`, `tasks/`, and `tools/` folders outside `src/`.
- `javascript`: plain JavaScript files, with the `no-unsafe-*` rules off.

`FILE_GLOBS` also has `stories`. A config can use any of the globs in its own `overrides`:

```ts
import { FILE_GLOBS, defineConfig, presets } from '@keann/lint-config'

export default defineConfig({
    extends: [presets.base, presets.react, presets.vitest],
    overrides: [{ files: FILE_GLOBS.tests, rules: { 'typescript/no-explicit-any': 'off' } }],
})
```

## JSDoc rules under Bun

```ts
// oxlint-disable-next-line js-doc/require-param
```

Under `bun lint` the JSDoc rules are named `js-doc/…`, and under oxlint they are named `jsdoc/…`.
`bun lint` has no built-in JSDoc rules, so its build of this package runs the same rules, with the
same options, from `eslint-plugin-jsdoc`. Both linters reserve the plugin name `jsdoc`, so the
plugin runs as `js-doc`.

A config's `rules` and `overrides` use `jsdoc/…` for both linters. Under `bun lint`, this
package's `defineConfig` renames them to `js-doc/…`. A disable comment uses the name of the linter
that runs it, because the linter reads it from the source file.

The `bun` export condition picks the build. `bun lint` applies it when it loads a config, and
oxlint on Node never does.

## Tests with bun test

```ts
// types/vitest.d.ts
declare module 'vitest' {
    export * from 'bun:test'
}
```

`presets.vitest` checks test files that import from `vitest`. Both linters skip the Vitest rules
for calls imported from `bun:test`. `bun test` serves an import from `vitest` with `bun:test`, with
no Vitest installed. The declaration above types that import, and the tsconfig's `include` has to
cover its file. Test files then import from `vitest`, and the Vitest rules check them:

```ts
import { describe, expect, it } from 'vitest'
```

## Extending configs

Import `defineConfig` from this package, not from `oxlint`. The `extends` of both linters drops
`env`, `globals`, and `settings`, and this `defineConfig` merges them from every config in the
`extends` tree. A config's own fields win over its `extends`, and a later config in `extends` wins
over an earlier one. `settings` merge by top-level key, such as `jsdoc` or `react`.

A folder config extends the root config or the presets:

```ts
// packages/<folder>/oxlint.config.ts
import { defineConfig } from '@keann/lint-config'

import rootConfig from '../../oxlint.config.ts'

export default defineConfig({
    extends: [rootConfig],
})
```

A folder config can't set `options` itself, because the linter reads them from the root config
only.

The linter uses the nearest config file for each folder. The root's `ignorePatterns` and
path-specific override globs don't reach into a folder that has its own config. Globs like
`**/*.stories.tsx` match at any depth.

## Linter versions

| Oxlint rules | Bun                     | Releases        |
| ------------ | ----------------------- | --------------- |
| 1.89         | 1.4.4-canary.20261022.1 | 1.0.0 and later |

Each release turns on the rules of one oxlint version and needs that oxlint or newer. A newer oxlint
adds no rules until a release of this package reviews them. The Bun column names the Bun build that
the release is tested with, which runs every rule of the presets.

```sh
npm view @keann/lint-config@1.0.0 devDependencies.oxlint packageManager
```

This prints the oxlint version and the Bun build of one release.

Oxlint's [versioning policy](https://oxc.rs/docs/guide/usage/linter/versioning) lets a minor
release remove a nursery or type-aware rule. A config that extends the presets then fails to load
until a release of this package drops that rule.
