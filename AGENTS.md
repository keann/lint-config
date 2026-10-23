# AGENTS.md

`@keann/lint-config` is a published lint config with two builds: `dist/index.js` for oxlint on Node
and `dist/bun.js` for `bun lint`. Bun is the only tool: the pinned canary in `packageManager` is
the one `bun lint` needs.

## Checks

Run these after every change, all from the repo root:

```sh
bun fmt --check
bun lint
bun check
bun run test:unit
bun run build
bun run test:smoke
```

`test:smoke` tests the built files, so it runs after `build`. `bun fmt` fixes the formatting.

## Release notes

A change to `src/` adds an entry to `UNRELEASED.md` under one of its four headings: `⚠️ Breaking
Changes`, `✨ Added`, `🔧 Changed`, or `🐛 Fixed`. Write each entry for the package's consumers,
one fact per entry, with the noun or the verb first. A PR without an entry needs the `no changelog`
label, and CI fails it otherwise. After a release the file holds only a comment that lists the
headings, so the first entry under a heading adds the heading too.

## Tests

Test files import from `vitest`, and `bun test` serves that import from `bun:test`.
`types/vitest.d.ts` types it. The Vitest rules of `presets.vitest` skip calls imported from
`bun:test`, so the `vitest` import keeps them checking the repo's own tests.

## Rules

Read `MAINTAINING.md` before you change a rule, a category file, or the oxlint or Bun version. A
rule change is the user's decision: present it with its reason, and apply it once they pick.
