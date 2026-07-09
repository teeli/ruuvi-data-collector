# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project

Scans RuuviTag / Ruuvi Air Bluetooth sensors and writes measurements to
InfluxDB. TypeScript on Bun. Rewrite of
[ruuvi-influx-collector](https://github.com/teeli/ruuvi-influx-collector).

## Documentation

Always keep documentation (`CLAUDE.md`, `README.md`) up to date.

## Commands

- `bun run start` — run the app (entry: `src/index.ts`)
- `bun run watch` — run with file watching
- `bun run compile` — typecheck only (`tsc --noEmit`, no output emitted)
- `bun run test` — run vitest; pass a path to run a single test file (e.g.
  `bun run test src/scanner/scanner.test.ts`)
- `bun run lint` / `bun run lint:fix` — oxlint
- `bun run lint:md` / `bun run lint:md:fix` — markdown lint
- `bun run format` — prettier --write .
- `bun run config:generate` — scaffold `config.ts` at repo root from
  `src/cli/assets/config-template.ts`

## Config

App config is a gitignored `config.ts` at the repo root (NOT `.env`) (InfluxDB
connection, bucket/org, device aliases, log settings), generated via
`bun run config:generate` and validated by the zod schema in
`src/config/config.ts`. Do NOT regenerate file if `config.ts` already exists.

## Code style

- Oxlint (`oxlint.config.ts`), not ESLint. Notably:
  - no default exports
  - no file extensions in imports
  - no `console.*`(use `@logtape/logtape`)
  - kebab-case filenames
  - type imports kept separate (`import type`)
- Prettier (`prettier.config.ts`):
  - no semicolons
  - single quotes
  - 120 print width
  - es5 trailing commas.
  - markdown files (`*.md`) override to 80 print width + `proseWrap: always`
- Path aliases (see `tsconfig.json`):
  - `@config/*` -> `src/config`
  - `@scanner/*` -> `src/scanner`
  - `@writers/*` -> `src/writers`
  - `@clients/*` -> `src/clients`
  - `@util/*` → `src/util`.

## Testing

- Vitest
  - tests colocated with source (`*.test.ts`),
  - setup in `src/testing/setup.ts`.
- All new code must always have tests.
- The scanner talks to real Bluetooth hardware via `@stoprocent/noble`
  - Development should not require Bluetooth, so never rely on actual Bluetooth
    hardware in tests.
  - Rely on mocks to test Bluetooth.
  - Treat scanner/hardware-facing behavior as unverified by `bun run test` alone
    — say so rather than claiming it's confirmed working.

## Git / PR conventions

- Never commit directly to `main` — GitHub blocks it. Every change goes on its
  own branch (`feat/`, `fix/`, `chore/` prefixes match existing history).
- No CI currently runs on push/PR — run `bun run lint` and `bun run test`
  locally before considering a change done.
- Code is merged to `main` via Github pull requests. Prefer fast forward merges
  or merge commits over squash. Pull request title should match the branch name
  and the description should contain specific details about the change.

### Commits

Always use conventional commits in the format:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Most common type are `fix:` and `feat:`. Additional allowed types are `build:`,
`chore:`, `docs:`, `style:`, `refactor:`, `perf:`, and `test:`.

## Deployment

Runs as a systemd service; see `ruuvi-data-collector-example.service` for the
template (`bun run start`, restarts on failure).
