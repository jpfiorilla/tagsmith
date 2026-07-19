# Tagsmith

[![CI](https://github.com/jpfiorilla/tagsmith/actions/workflows/ci.yml/badge.svg)](https://github.com/jpfiorilla/tagsmith/actions/workflows/ci.yml)

An AI-aware background agent that keeps your Apple Music tags tidy — automatically, as you
add music. It cleans reissue/packaging junk out of track titles (`(Remaster)`,
`(2012 Remastered Version)`, `(Expanded Edition)`, `(33 RPM LP Version)`, …) and can
normalize genres, while leaving everything meaningful alone.

## Why two layers
The junk labels put in tags is partly regular and partly arbitrary. Tagsmith handles both:

- **Fast-path (deterministic).** A conservative regex whitelist strips the *common,
  well-known* reissue tags instantly, offline, for free — and only ever removes a trailing
  `(...)`, `[...]`, or ` - ...` segment containing a known phrase. Live, Demo, Remix,
  Instrumental, feat., movement names, and real titles like "Mono" are never touched.
- **AI judge (for the long tail + genre).** Anything the fast-path can't confidently
  handle — novel packaging formats, and genre decisions, which are pure judgment — is sent
  to a model that reasons per-track and returns a structured, validated decision. Pinned
  model + `temperature: 0` keeps it reproducible.

Whether AI runs, how bold it is, and what counts as "junk vs. meaningful" are all
configurable, so the same tool works for a purist and for someone who wants it hands-off.

## How it runs
macOS's **launchd** runs the compiled Node core every 60 seconds. Each run asks Music
*what got added since last time?* (via "date added"), processes only those tracks, logs
every change, and posts a macOS notification. There is no "album added" event in Apple
Music, so it polls — the only reliable approach; a 60s interval feels instant.

## Requirements
- macOS with the Music app
- Node.js ≥ 18
- (Optional, for the AI layer) an Anthropic API key — bring your own

## Install
```bash
chmod +x install.sh uninstall.sh
./install.sh
```
This builds the TypeScript, seeds a default `config.json`, and loads the LaunchAgent.
macOS will ask permission for it to control Music — allow it.

## Configuration
Config lives at `~/Library/Application Support/Tagsmith/config.json` (seeded from
[`config.example.json`](./config.example.json)):

| Key | Meaning |
| --- | --- |
| `provider` / `model` | AI backend. Only `anthropic` is wired up today; `openai`/`gemini` adapters exist behind the same interface for later. Model is a pinned static snapshot. |
| `apiKeyEnv` | Name of the env var holding your API key (BYO key). |
| `features.titleCleanup` / `features.genre` | Turn each capability on/off. Genre needs the AI. |
| `autonomy.mode` | `auto` (apply all), `review` (queue all for approval), or `confidence` (apply high-confidence, queue the rest). |
| `autonomy.confidenceThreshold` | Cutoff for `confidence` mode (0–1). |
| `dryRun` | When `true`, nothing is written — only logged. Ships `true`. |
| `preferences.keepVersionTags` | Keep (Live)/(Demo)/etc. in titles. |
| `preferences.genreTaxonomy` | Optional fixed vocabulary to map genres onto. |

The fast-path (deterministic title cleanup) runs even with no API key; the AI layer only
activates when a key is present and the relevant feature is enabled.

## Safety: it starts in DRY-RUN
- First run **starts the clock now and ignores your existing library** — only new additions.
- In dry-run it changes nothing; it logs what it *would* do:
  ```bash
  tail -f "$HOME/Library/Application Support/Tagsmith/changes.log"
  ```
- When you're happy, set `"dryRun": false` in `config.json`. Takes effect next run.

## Develop
```bash
npm install
npm test        # Jest: fast-path, judge/parse, decision, autonomy, config, provider
npm run build   # tsc -> dist/
```
The provider is injected, so the whole decision pipeline is unit-tested without any
network calls.

## Layout
```
src/
  rules/fastPath.ts     deterministic whitelist strip
  ai/provider.ts        provider interface + pinned models
  ai/providers/         anthropic (wired) · openai · gemini
  ai/prompt.ts          deterministic prompt builder
  ai/judge.ts           TagJudge: call model, extract + validate JSON
  decide.ts             combine fast-path + AI into proposed changes
  apply.ts              autonomy policy (auto / review / confidence)
  config.ts             schema, defaults, validation
  music/bridge.ts       osascript ↔ Music.app
  index.ts              one poll cycle
jxa/                    JXA scripts run via osascript
test/                   Jest suites
one-time-cleanup/       the original one-off library cleanup (AppleScript + CSV)
```

## Uninstall
```bash
./uninstall.sh
```

## License
MIT — see `LICENSE`.
