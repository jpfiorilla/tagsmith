import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as path from 'node:path';
import { Track, ProposedChange } from '../types';

const execFileAsync = promisify(execFile);

// jxa/ lives at the package root, two levels up from both src/music and dist/music.
const JXA_DIR = path.resolve(__dirname, '..', '..', 'jxa');

async function runJxa(script: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync(
    'osascript',
    ['-l', 'JavaScript', path.join(JXA_DIR, script), ...args],
    { maxBuffer: 32 * 1024 * 1024 },
  );
  return stdout.trim();
}

/** Read every library track added since the given ISO timestamp. */
export async function readNewTracks(sinceIso: string): Promise<Track[]> {
  const out = await runJxa('readNewTracks.js', [sinceIso]);
  if (!out) return [];
  return JSON.parse(out) as Track[];
}

/** Apply one field change in Apple Music. Returns true on success. */
export async function applyChange(change: ProposedChange): Promise<boolean> {
  const out = await runJxa('applyChange.js', [change.persistentId, change.field, change.to]);
  try {
    const res = JSON.parse(out) as { ok: boolean; error?: string };
    return res.ok === true;
  } catch {
    return false;
  }
}

/** Post a macOS notification via osascript. Best-effort; never throws. */
export async function notify(title: string, message: string): Promise<void> {
  try {
    const script = `display notification ${quote(message)} with title ${quote(title)}`;
    await execFileAsync('osascript', ['-e', script]);
  } catch {
    // notifications are non-critical
  }
}

function quote(s: string): string {
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}
