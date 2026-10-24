import type { AllowWarnDeny, DummyRuleMap, OxlintConfig } from 'oxlint'

/** Rule names by oxlint category, for the plugins that the presets turn on. */
export type RulesByCategory = Readonly<Partial<Record<string, readonly string[]>>>

type RuleValue = AllowWarnDeny | undefined
const OFF_SEVERITIES = new Set<RuleValue>([undefined, 'off', 'allow', 0])

/**
 * Turns on by name every rule of the categories that `config` turns on as a whole, and turns the
 * categories off, so a newer oxlint adds no rules. A rule that `config` sets keeps its setting.
 */
export const expandCategories = (
    config: OxlintConfig,
    rulesByCategory: RulesByCategory,
): OxlintConfig => {
    if (config.categories === undefined) return config

    const categories: Record<string, AllowWarnDeny> = {}
    const rules: DummyRuleMap = {}
    const entries = Object.entries(config.categories) as [string, RuleValue][]

    for (const [category, severity] of entries) {
        categories[category] = 'off'
        if (OFF_SEVERITIES.has(severity)) continue
        for (const rule of rulesByCategory[category] ?? []) rules[rule] = severity
    }

    return {
        ...config,
        categories,
        rules: {
            ...rules,
            ...config.rules,
        },
    }
}
