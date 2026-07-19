#!/bin/bash
# Installs Tagsmith as a background LaunchAgent (runs every 60s).
set -e
LABEL="com.johnfio.tagsmith"
BASE="$HOME/Library/Application Support/Tagsmith"
AGENTS="$HOME/Library/LaunchAgents"
SRC="$(cd "$(dirname "$0")" && pwd)"

mkdir -p "$BASE" "$AGENTS"
cp "$SRC/tagsmith.js" "$BASE/tagsmith.js"

cat > "$AGENTS/$LABEL.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/osascript</string>
    <string>-l</string>
    <string>JavaScript</string>
    <string>$BASE/tagsmith.js</string>
  </array>
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
echo "Script:  $BASE/tagsmith.js"
echo "Log:     $BASE/changes.log"
echo
echo "First run starts the clock now and ignores existing tracks — it only acts on"
echo "music you add from here on. It's in DRY-RUN: watch changes.log, and when happy,"
echo "edit $BASE/tagsmith.js and set DRY_RUN = false (takes effect next run)."
