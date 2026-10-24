import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import type { OxlintConfig } from 'oxlint'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * Smoke tests against the BUILT `dist` artifact — the thing that actually gets published.
 *
 * Consumer configs import the package by name, through a symlink in a temporary `node_modules`,
 * so each linter resolves the export condition it would resolve for a real install: oxlint on
 * Node loads `dist/index.js`, and `bun lint` loads `dist/bun.js`.
 */

const PACKAGE_DIR = resolve(import.meta.dirname, '../..')
const DIST = {
    oxlint: join(PACKAGE_DIR, 'dist/index.js'),
    bun: join(PACKAGE_DIR, 'dist/bun.js'),
}
const SOURCE = join(PACKAGE_DIR, 'src/index.ts')
const OXLINT_BIN = join(PACKAGE_DIR, 'node_modules/.bin/oxlint')
const BUN_BIN = process.execPath

type Linter = keyof typeof DIST

/** The fields of `--print-config` output that the tests read. */
interface ResolvedConfig {
    options: Record<string, unknown>
    plugins: string[]
    rules: Record<string, string | [string, ...unknown[]]>
}

/** The exports of a built bundle. */
interface Bundle {
    FILE_GLOBS: Record<string, string[]>
    defineConfig: unknown
    presets: Record<'base' | 'react' | 'vitest', OxlintConfig>
}

/** Imports a built bundle by path. */
const importBundle = async (path: string): Promise<Bundle> =>
    (await import(pathToFileURL(path).href)) as Bundle

/** A finding as both linters print it with `--format unix`. */
interface Finding {
    line: number
    rule: string
}

const PRESETS_IMPORT = "import { defineConfig, presets } from '@keann/lint-config'"
const ALL_PRESETS = '[presets.base, presets.react, presets.vitest]'

/** Runs a linter in `cwd` and returns its output and exit code. */
const run = (linter: Linter, cwd: string, args: string[]) => {
    const [bin, prefix] = linter === 'oxlint' ? [OXLINT_BIN, []] : [BUN_BIN, ['lint']]
    const { status, stderr, stdout } = spawnSync(bin, [...prefix, ...args], {
        cwd,
        encoding: 'utf8',
    })
    return { status, stderr, stdout }
}

/** Reads the `rule` and `line` of each finding in `--format unix` output. */
const parseFindings = (output: string): Finding[] =>
    [...output.matchAll(/^[^:\n]+:(\d+):\d+: .*\[\w+\/([\w-]+)\((?<rule>[\w-]+)\)\]$/gmu)].map(
        ([, line = '', , rule = '']) => ({ line: Number(line), rule }),
    )

/** Lists the rules a config and its `extends` tree turn on by name. */
const collectOnRules = (config: OxlintConfig): string[] => [
    ...Object.entries(config.rules ?? {})
        .filter(([, setting]) => (Array.isArray(setting) ? setting[0] : setting) !== 'off')
        .map(([name]) => name),
    ...(config.extends ?? []).flatMap(collectOnRules),
]

describe('built artifact (dist)', () => {
    let consumerDir = ''

    // Creates a consumer folder that installs this package by name.
    const createConsumer = async (name: string, config: string): Promise<string> => {
        const dir = join(consumerDir, name)
        await mkdir(join(dir, 'node_modules/@keann'), { recursive: true })
        await symlink(PACKAGE_DIR, join(dir, 'node_modules/@keann/lint-config'))
        await writeFile(join(dir, 'package.json'), '{ "type": "module", "private": true }\n')
        await writeFile(join(dir, 'oxlint.config.ts'), `${PRESETS_IMPORT}\n${config}\n`)
        return dir
    }

    // Resolves a consumer config that extends every preset, with oxlint.
    const printConfig = async (entry: string, name: string): Promise<ResolvedConfig> => {
        const configPath = join(consumerDir, name)
        await writeFile(
            configPath,
            [
                `import { defineConfig, presets } from ${JSON.stringify(pathToFileURL(entry).href)}`,
                `export default defineConfig({ extends: ${ALL_PRESETS} })`,
                '',
            ].join('\n'),
        )
        return JSON.parse(
            execFileSync(OXLINT_BIN, ['-c', configPath, '--print-config'], { encoding: 'utf8' }),
        ) as ResolvedConfig
    }

    beforeAll(async () => {
        consumerDir = await mkdtemp(join(tmpdir(), 'lint-config-smoke-'))
    })

    afterAll(async () => {
        await rm(consumerDir, { recursive: true, force: true })
    })

    it('ships both bundles and their types', () => {
        for (const path of Object.values(DIST)) {
            expect(existsSync(path), `${path} missing — run \`bun run build\` first`).toBe(true)
            expect(existsSync(path.replace(/\.js$/u, '.d.ts'))).toBe(true)
        }
    })

    it.each(Object.entries(DIST))('exports the exact public surface from %s', async (_, path) => {
        const bundle = await importBundle(path)

        expect(Object.keys(bundle).toSorted()).toStrictEqual([
            'FILE_GLOBS',
            'defineConfig',
            'presets',
        ])
        expect(bundle.defineConfig).toBeTypeOf('function')
        expect(Object.keys(bundle.presets).toSorted()).toStrictEqual(['base', 'react', 'vitest'])
        expect(Object.keys(bundle.FILE_GLOBS).toSorted()).toStrictEqual([
            'benchmarks',
            'javascript',
            'stories',
            'storybookAndTests',
            'tests',
            'tooling',
        ])
    })

    it('loads the oxlint build in oxlint and the bun build in bun lint', async () => {
        const dir = await createConsumer(
            'conditions',
            `export default defineConfig({ extends: ${ALL_PRESETS} })`,
        )
        await writeFile(join(dir, 'index.ts'), 'export const value = 1\n')

        const oxlint = JSON.parse(run('oxlint', dir, ['--print-config']).stdout) as ResolvedConfig
        const bun = JSON.parse(
            run('bun', dir, ['--print-config', 'index.ts']).stdout,
        ) as ResolvedConfig

        expect(oxlint.plugins).toContain('jsdoc')
        expect(bun.plugins).not.toContain('jsdoc')
        expect(oxlint.rules['typescript/no-floating-promises']).toBe('deny')
        expect(oxlint.options).toMatchObject({ typeAware: true })
    })

    it('runs in bun lint with no rule it lacks', async () => {
        const dir = await createConsumer(
            'bun-support',
            `export default defineConfig({ extends: ${ALL_PRESETS} })`,
        )
        await writeFile(join(dir, 'index.ts'), 'export const value = 1\n')

        const { status, stderr } = run('bun', dir, ['index.ts'])

        expect(stderr).not.toContain('not supported')
        expect(status).toBe(0)
    })

    it('turns every rule on by name, with each category off', async () => {
        const { presets } = await importBundle(DIST.oxlint)
        const severities = (presets.base.extends ?? []).flatMap(
            config => Object.values(config.categories ?? {}) as unknown[],
        )

        expect(new Set(severities)).toStrictEqual(new Set(['off']))
    })

    it('turns on the rules that the source presets turn on', async () => {
        const built = await printConfig(DIST.oxlint, 'built.config.mjs')
        const source = await printConfig(SOURCE, 'source.config.mjs')

        expect(built.rules).toStrictEqual(source.rules)
    })

    it('turns on the same jsdoc rules in both builds', async () => {
        const oxlint = await importBundle(DIST.oxlint)
        const bun = await importBundle(DIST.bun)
        const jsdocRules = (presets: Record<string, OxlintConfig>, prefix: string) =>
            Object.values(presets)
                .flatMap(collectOnRules)
                .filter(name => name.startsWith(prefix))
                .map(name => name.slice(prefix.length))
                .toSorted()

        expect(jsdocRules(bun.presets, 'js-doc/')).toStrictEqual(
            jsdocRules(oxlint.presets, 'jsdoc/'),
        )
        expect(jsdocRules(bun.presets, 'js-doc/')).toHaveLength(17)
    })

    it('reports the same jsdoc findings in both linters', async () => {
        const dir = await createConsumer(
            'jsdoc',
            'export default defineConfig({ extends: [presets.base], options: { typeAware: false } })',
        )
        await writeFile(
            join(dir, 'add.ts'),
            [
                '/**',
                ' * Adds two numbers.',
                ' * @param left',
                ' * @param right - The second number.',
                ' * @returns',
                ' * @unknown',
                ' */',
                'export const add = (left: number, right: number): number => left + right',
                '',
            ].join('\n'),
        )
        const findings = (linter: Linter) =>
            parseFindings(run(linter, dir, ['--format', 'unix', 'add.ts']).stdout).toSorted(
                (left, right) => left.line - right.line,
            )

        expect(findings('bun')).toStrictEqual(findings('oxlint'))
        expect(findings('oxlint').map(({ rule }) => rule)).toStrictEqual([
            'require-param-description',
            'require-returns-description',
            'check-tag-names',
        ])
    })

    it("turns off a `jsdoc/` rule from the consumer's config in both linters", async () => {
        const dir = await createConsumer(
            'jsdoc-off',
            [
                'export default defineConfig({',
                '    extends: [presets.base],',
                '    options: { typeAware: false },',
                "    rules: { 'jsdoc/check-tag-names': 'off' },",
                '})',
            ].join('\n'),
        )
        await writeFile(
            join(dir, 'tag.ts'),
            '/**\n * A value.\n * @unknown\n */\nexport const a = 1\n',
        )
        const findings = (linter: Linter) =>
            parseFindings(run(linter, dir, ['--format', 'unix', 'tag.ts']).stdout)

        expect(findings('oxlint')).toStrictEqual([])
        expect(findings('bun')).toStrictEqual([])
    })

    it('turns on a reviewed number of rules per category', async () => {
        const resolved = await printConfig(DIST.oxlint, 'counts.config.mjs')
        const catalog = JSON.parse(
            execFileSync(OXLINT_BIN, ['--rules', '--format', 'json'], { encoding: 'utf8' }),
        ) as { category: string; scope: string; value: string }[]
        const categories = new Map(
            catalog.map(({ category, scope, value }) => [
                scope === 'eslint' ? value : `${scope}/${value}`,
                category,
            ]),
        )
        const counts: Record<string, number> = {}
        for (const [name, setting] of Object.entries(resolved.rules)) {
            const category = categories.get(name)
            const severity = typeof setting === 'string' ? setting : setting[0]
            if (category === undefined || severity === 'allow') continue
            counts[category] = (counts[category] ?? 0) + 1
        }

        // A newer oxlint changes these counts: review its new rules before updating the snapshot.
        expect(counts).toMatchInlineSnapshot(`
          {
            "correctness": 198,
            "nursery": 10,
            "pedantic": 92,
            "perf": 10,
            "restriction": 54,
            "style": 137,
            "suspicious": 49,
          }
        `)
    })

    it.each(['oxlint', 'bun'] as const)(
        'loads folder configs that extend the root config or the presets in %s',
        async linter => {
            const dir = await createConsumer(
                `folders-${linter}`,
                'export default defineConfig({ extends: [presets.base], options: { typeAware: false } })',
            )
            const configs: Record<string, string> = {
                'extends-root/oxlint.config.ts': `import root from '../oxlint.config.ts'\nexport default defineConfig({ extends: [root] })`,
                'extends-presets/oxlint.config.ts': `export default defineConfig({ extends: [presets.base] })`,
            }
            await Promise.all(
                Object.entries(configs).map(async ([path, body]) => {
                    await mkdir(join(dir, path, '..'), { recursive: true })
                    await writeFile(join(dir, path), `${PRESETS_IMPORT}\n${body}\n`)
                    await writeFile(join(dir, path, '../index.js'), 'debugger\n')
                }),
            )

            const { stdout } = run(linter, dir, ['--format', 'unix', '.'])
            const files = [...stdout.matchAll(/^(.+?):\d+:\d+: .*no-debugger/gmu)].map(
                ([, file]) => file,
            )

            expect(files.toSorted()).toStrictEqual([
                'extends-presets/index.js',
                'extends-root/index.js',
            ])
        },
    )

    it.each(['oxlint', 'bun'] as const)(
        'runs its plugins from a consumer config in %s',
        async linter => {
            const dir = await createConsumer(
                `plugins-${linter}`,
                'export default defineConfig({ extends: [presets.base, presets.react], options: { typeAware: false } })',
            )
            await writeFile(
                join(dir, 'Item.tsx'),
                [
                    "import { useEffect, useState } from 'react'",
                    "import matter from 'gray-matter'",
                    'export const isNotBoth = (a, b) => !(a && b)',
                    'export function Item({ value }) {',
                    '    const [copy, setCopy] = useState(value)',
                    '    useEffect(() => setCopy(value), [value])',
                    '    return <p title={matter.name}>{copy}</p>',
                    '}',
                    '',
                ].join('\n'),
            )

            const { stdout } = run(linter, dir, ['--format', 'unix', 'Item.tsx'])
            const plugins = new Set(
                [...stdout.matchAll(/\[\w+\/([\w-]+)\(/gu)].map(([, name]) => name),
            )

            const expected = ['de-morgan', 'e18e', 'react-you-might-not-need-an-effect']

            expect(expected.filter(name => !plugins.has(name))).toStrictEqual([])
        },
    )
})
