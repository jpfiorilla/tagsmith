#!/bin/bash
# Installs Tagsmith as a background LaunchAgent that runs the compiled Node core.
set -e
LABEL="com.johnfio.tagsmith"
BASE="$HOME/Library/Application Support/Tagsmith"
AGENTS="$HOME/Library/LaunchAgents"
SRC="$(cd "$(dirname "$0")" && pwd)"

# 1. Build
echo "Building…"
( cd "$SRC" && npm install --silent && npm run build --silent )

# 2. Config: seed from example on first install (never overwrite an existing one)
mkdir -p "$BASE" "$AGENTS"
if [ ! -f "$BASE/config.json" ]; then
  cp "$SRC/config.example.json" "$BASE/config.json"
  echo "Seeded default config at $BASE/config.json (dry-run, title cleanup only)."
fi

# 3. Resolve node path (launchd has a minimal PATH)
NODE_BIN="$(command -v node)"
if [ -z "$NODE_BIN" ]; then echo "node not found on PATH"; exit 1; fi

# 4. LaunchAgent
cat > "$AGENTS/$LABEL.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE_BIN</string>
    <string>$SRC/dist/index.js</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <!-- Put your key here, or export it in a login shell the agent inherits. -->
    <key>ANTHROPIC_API_KEY</key><string>${ANTHROPIC_API_KEY:-}</string>
  </dict>
  <key>StartInterval</key><integer>60</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>$BASE/agent.out.log</string>
  <key>StandardErrorPath</key><string>$BASE/agent.err.log</string>
</dict>
</plist>
PLIST

launchctl unload "$AGENTS/$LABEL.plist" 2>/dev/null || true
launchctl load "$AGENTS/$LABEL.plist"

echo "Tagsmith installed and running: $LABEL"
echo "Config:  $BASE/config.json"
echo "Log:     $BASE/changes.log"
echo
echo "It starts in DRY-RUN and ignores your existing library — only new additions."
echo "Watch the log, then set \"dryRun\": false in config.json when you're happy."
echo "For genre + AI title cleanup, set your ANTHROPIC_API_KEY and enable features in config.json."
