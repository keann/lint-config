import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { BunPlugin } from 'bun'
import { defineConfig } from 'bunup'
import type { OxlintConfig } from 'oxlint'

import { expandCategories } from './src/helpers/expandCategories.ts'
import { presets } from './src/presets.ts'

/** A rule as `oxlint --rules` and `bun lint --rules` list it. */
interface ListedRule {
    category: string | null
    scope: string
    value: string
}

const OFF_SETTINGS = new Set<unknown>(['off', 'allow', 0])

const PRESETS: OxlintConfig[] = [presets.base, presets.react, presets.vitest]

/** The built-in plugins that the presets turn on. */
const PLUGINS = new Set<string>(PRESETS.flatMap(preset => preset.plugins ?? []))

export default defineConfig({
    entry: ['./src/index.ts', './src/bun.ts'],
    outDir: './dist',
    format: ['esm'],
    target: 'node',
    dts: true,
    minify: true,
    plugins: [expandCategoryFiles()],
})

/**
 * Replaces each `categories/*.ts` with its config run through `expandCategories`, against the
 * rules that the installed oxlint lists. Fails the build when `bun lint` can't run a rule that
 * the presets turn on.
 */
function expandCategoryFiles(): BunPlugin {
    return {
        name: 'expand-category-files',
        async setup(build) {
            const rulesByCategory = groupByCategory(listRules(oxlintBin()))
            await assertBunRunsRules(rulesByCategory)
            build.onLoad({ filter: /\/categories\/\w+\.ts$/u }, async ({ path }) => {
                const { default: config } = (await import(path)) as { default: OxlintConfig }
                return {
                    contents: `export default ${JSON.stringify(expandCategories(config, rulesByCategory))}`,
                    loader: 'js',
                }
            })
        },
    }
}

/** The path of the oxlint binary from this package's `oxlint` devDependency. */
function oxlintBin(): string {
    const manifestPath = fileURLToPath(import.meta.resolve('oxlint/package.json'))
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { bin: { oxlint: string } }
    return join(dirname(manifestPath), manifest.bin.oxlint)
}

/** Lists the built-in rules of a linter, as `scope/value` names with their category. */
function listRules(bin: string, ...args: string[]): Map<string, ListedRule> {
    const output = execFileSync(bin, [...args, '--rules', '--format', 'json'], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
    })
    const rules = JSON.parse(output) as ListedRule[]
    return new Map(rules.map(rule => [`${rule.scope.replaceAll('_', '-')}/${rule.value}`, rule]))
}

/** The plugin of a `plugin/rule` name. */
const pluginOf = (name: string): string => name.slice(0, name.indexOf('/'))

/** Groups the rules of the presets' plugins by category. */
function groupByCategory(rules: Map<string, ListedRule>): Record<string, string[]> {
    const rulesByCategory: Record<string, string[]> = {}

    for (const [name, { category }] of rules) {
        if (category !== null && PLUGINS.has(pluginOf(name))) {
            ;(rulesByCategory[category] ??= []).push(name)
        }
    }

    return rulesByCategory
}

/**
 * Checks that `bun lint` runs every built-in rule the presets turn on, by category or by name.
 * The `jsdoc/` rules run from `eslint-plugin-jsdoc` under Bun, so they are checked against its
 * rules instead. `bun lint` reports an unknown built-in rule only at lint time, and ignores an
 * unknown plugin rule silently.
 */
async function assertBunRunsRules(rulesByCategory: Record<string, string[]>): Promise<void> {
    const bunRules = listRules(process.execPath, 'lint')
    const { default: jsdocPlugin } = await import('eslint-plugin-jsdoc')
    const jsdocRules = jsdocPlugin.rules ?? {}
    const names = new Set(PRESETS.flatMap(preset => collectOnRules(preset, rulesByCategory)))
    const missing = [...names].filter(name =>
        name.startsWith('jsdoc/')
            ? !Object.hasOwn(jsdocRules, name.slice('jsdoc/'.length))
            : PLUGINS.has(pluginOf(name)) && !bunRules.has(name),
    )

    if (missing.length > 0) {
        throw new Error(
            `bun ${Bun.version} can't run these rules, so turn them off: ${missing.join(', ')}`,
        )
    }
}

/** Lists the rules that a config and its `extends` tree turn on, overrides included. */
function collectOnRules(config: OxlintConfig, rulesByCategory: Record<string, string[]>): string[] {
    const { overrides, rules } = expandCategories(config, rulesByCategory)
    const ruleMaps = [rules, ...(overrides ?? []).map(override => override.rules)]
    const own = ruleMaps.flatMap(ruleMap =>
        Object.entries(ruleMap ?? {})
            .filter(
                ([, setting]) => !OFF_SETTINGS.has(Array.isArray(setting) ? setting[0] : setting),
            )
            .map(([name]) => name),
    )
    const inherited = (config.extends ?? []).flatMap(parent =>
        collectOnRules(parent, rulesByCategory),
    )
    return [...own, ...inherited]
}
