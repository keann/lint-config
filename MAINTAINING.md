# Maintaining @keann/lint-config

## How the rules are wired

`src/categories/` has one file per oxlint category, and `presets.base` extends them all.

- `correctness`, `suspicious`, `perf`, and `pedantic` turn their category on. Their `rules` hold
  only the exceptions, in two groups: `// Differ from the defaults` for options and `// Rejected`
  for `'off'`.
- `style`, `restriction`, and `nursery` keep their category off. Their `rules` list every rule that
  is on.

Each rejected rule has a comment above it with the reason, and what would bring the rule back
when something would. The comment opens with a marker for how strong the reason is:

- 📜 Ruled out on evidence: the rule duplicates one that's on, is deprecated, or breaks or misreads
  code it was run against.
- 💭 A judgment call: the rule doesn't fit how front-end code is usually written, or its reason
  rests on an assumption and common sense rather than a check.

The build (`bunup.config.ts`) reads `oxlint --rules` from this package's `oxlint` devDependency,
names every rule of an on-category, and turns the categories off. The published presets therefore
name every rule, and a consumer's newer linter turns on no rule they do not list. The repo lints
itself through the source presets, which keep `categories`, so a new rule of an on-category fires
here as soon as oxlint or Bun is bumped.

An older oxlint rejects a config that names a rule it does not know, so the `oxlint` peer range
starts at the devDependency version.

## The two builds

`dist/index.js` is built from `src/index.ts` and serves oxlint on Node. `dist/bun.js` is built from
`src/bun.ts` and serves `bun lint`, which picks it through the `bun` export condition.

`src/bun.ts` runs each preset through `toBunConfig`. It swaps oxlint's built-in `jsdoc` plugin for
`eslint-plugin-jsdoc`, loaded as the JS plugin `js-doc`, and renames every `jsdoc/` rule to
`js-doc/` with the same settings.

The build fails when the presets turn on a rule that the running Bun can't run. It checks built-in
rules against `bun lint --rules`, and `js-doc/` rules against the `rules` of `eslint-plugin-jsdoc`.
`bun lint` itself reports neither: it fails on an unknown built-in rule only at lint time, and it
ignores an unknown plugin rule without a word. The fix is a rule turned off in its category file,
with a 📜 reason that names the Bun build.

## Moving to a newer oxlint

1. Save both current rule lists to a scratch folder:
   `bunx oxlint --rules --format json > /tmp/oxlint-old.json` and
   `bun lint --rules --format json > /tmp/bun-old.json`.
2. Set the new version as the `oxlint` devDependency and as the lower bound of the `oxlint` peer
   range. When the new oxlint's own `oxlint-tsgolint` peer range is above ours, raise the
   `oxlint-tsgolint` devDependency and peer range too. Run `bun install`.
3. Diff the new oxlint rule list against the saved one by `scope/value`, for the plugins in
   `src/presets.ts`. Done when you hold three lists: new rules, removed rules, and rules that moved
   category.
4. Delete every removed rule from the category files. Oxlint fails to load a config that names
   one.
5. Count each new rule's hits with `bun lint`. A rule of an off-category needs a temporary `'error'`
   in its category file first.
6. Present every new and moved rule to the user: name, category, `docs_url`, hit count, and your
   recommendation (on, off, or on with options). The user decides. Done when every rule on the
   list has a decision.
7. Apply the decisions to the category files, each in its group, with a marked reason above each
   rule turned off. Fix the hits of each rule that stays on.
8. Run `bun run build`. When it fails because Bun can't run a rule, move to a newer Bun first (see
   below), or turn the rule off with a 📜 reason.
9. Run `bun run test:unit && bun run test:smoke`, then update the per-category counts with
   `bun test tests/smoke --update-snapshots`. Each count moves by exactly the rules turned on or off
   in its category.
10. In the README's "Linter versions" table, add a row for the new oxlint and end the previous row's
    range at the last release before this one.
11. Under `### ⚠️ Breaking Changes` in `UNRELEASED.md`, list the rules turned on, the rules left
    off, and "Requires `oxlint` X or newer." New rules and a higher oxlint floor break consumers'
    lint, so this release is a major one.
12. Run `bun fmt --check`, `bun lint`, and `bun check`.

## Moving to a newer Bun

1. Set the new build in `packageManager`, and install it with `bun upgrade --canary` or from npm
   (`bun@<version>`).
2. Diff `bun lint --rules --format json` against the list of the previous Bun, by `scope/value`.
   A rule that Bun gained can come back on when its category file turns it off only because Bun
   lacked it.
3. Run `bun run build`, `bun run test:unit`, and `bun run test:smoke`.
4. Update the Bun column of the README's "Linter versions" table.
5. Add a `### 🔧 Changed` entry to `UNRELEASED.md` that names the new Bun build.

When a stable Bun release ships `bun lint`, the pin moves to that release, and the README drops
its canary note.

## Releasing

Each PR that changes `src/` adds its entries to `UNRELEASED.md`, under `### ⚠️ Breaking Changes`,
`### ✨ Added`, `### 🔧 Changed`, or `### 🐛 Fixed`. CI fails such a PR without them, unless it
has the `no changelog` label.

The Release workflow in the Actions tab publishes a release. It takes a `patch`, `minor`, or
`major` bump, and one run:

1. Stops when `UNRELEASED.md` has no entries, or has `⚠️ Breaking Changes` with a patch or minor
   bump.
2. Runs every check and builds.
3. Waits for approval in the `npm` environment, then publishes with provenance.
4. Commits the new `version` and the emptied `UNRELEASED.md` to `main`, and tags `vX.Y.Z`.
5. Creates the GitHub Release with the entries as its body.

The publish comes before the commit, so a declined approval leaves `main` untouched. The publish
step stays in `release.yml`, because npm's trusted publisher names that file.
