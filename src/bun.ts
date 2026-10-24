import type { OxlintConfig } from 'oxlint'

import { defineConfig as mergeConfig } from './helpers/defineConfig.ts'
import { toBunConfig } from './helpers/toBunConfig.ts'
import { presets as oxlintPresets } from './presets.ts'

export { FILE_GLOBS } from './helpers/fileGlobs.ts'

/** Merges the `extends` tree like the oxlint build, and renames `jsdoc/` rules to `js-doc/`. */
export const defineConfig = (config: OxlintConfig): OxlintConfig => toBunConfig(mergeConfig(config))

/** The presets for `bun lint`, which the `bun` export condition picks. */
export const presets: typeof oxlintPresets = {
    base: toBunConfig(oxlintPresets.base),
    react: toBunConfig(oxlintPresets.react),
    vitest: toBunConfig(oxlintPresets.vitest),
}
