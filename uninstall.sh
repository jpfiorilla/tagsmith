#!/bin/bash
# Stops and removes Tagsmith (leaves your logs/state in place).
LABEL="com.johnfio.tagsmith"
AGENTS="$HOME/Library/LaunchAgents"
launchctl unload "$AGENTS/$LABEL.plist" 2>/dev/null || true
rm -f "$AGENTS/$LABEL.plist"
echo "Removed $LABEL."
echo "Data kept at: $HOME/Library/Application Support/Tagsmith (delete manually if you want)."
