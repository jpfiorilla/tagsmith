# Tagsmith

A tiny background agent that keeps your Apple Music tags tidy — automatically, as you
add music. It watches for newly-added tracks and strips junk from their titles (starting
with reissue cruft like `(Remaster)`, `(2012 Remastered Version)`, `(Expanded Edition)`,
`(33 RPM LP Version)`), leaving everything meaningful alone.

## How it works
- macOS's **launchd** runs the script every 60 seconds (near-zero cost between runs).
- Each run asks Music: *what got added since last time?* (via the track "date added").
- For those tracks only, it applies a **conservative whitelist** — it strips a trailing
  `(...)`, `[...]`, or ` - ...` tag *only* when it contains a known reissue phrase.
  Live, Demo, Remix, Instrumental, feat., movement names, and real titles like "Mono"
  are never touched.
- Every change is written to a **log**, and a **macOS notification** pops when it acts.
- There is **no** "album added" event in Apple Music, so Tagsmith polls. That's the only
  reliable approach; a 60s interval feels instant in practice.

## Install
```bash
chmod +x install.sh uninstall.sh
./install.sh
```
On the first run macOS will ask permission for the agent to control Music — allow it.
(You may also need to allow notifications for "Script Editor"/osascript.)

## Safety: it starts in DRY-RUN
- First run **starts the clock now and ignores your existing library** — it only ever
  looks at music you add going forward.
- In dry-run it changes nothing; it just logs what it *would* do.
- Watch the log for a few days:
  ```bash
  tail -f "$HOME/Library/Application Support/Tagsmith/changes.log"
  ```
- When you're happy, open `~/Library/Application Support/Tagsmith/tagsmith.js`,
  set `DRY_RUN = false`, save. Takes effect on the next run.

## Uninstall
```bash
./uninstall.sh
```

## Roadmap: genre
`tagsmith.js` has an `assignGenre()` function that's currently a no-op stub. The plan is
to plug in a genre-massaging ruleset so Tagsmith also normalizes the genre of anything
you add — running in the same pass, dry-run first.

## Publish to GitHub
```bash
git init
git add -A
git commit -m "Initial commit: Tagsmith"
gh repo create tagsmith --public --source=. --push   # requires GitHub CLI
# — or, without gh, create an empty repo on github.com then:
# git remote add origin git@github.com:<you>/tagsmith.git && git push -u origin main
```

## Layout
- `tagsmith.js` — the agent logic (edit `DRY_RUN` / `NOTIFY` at the top).
- `install.sh` / `uninstall.sh` — set up / tear down the LaunchAgent.
- `one-time-cleanup/` — the AppleScript + CSV from the initial one-off library cleanup.

## License
MIT — see `LICENSE`.
