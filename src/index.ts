import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseConfig, DEFAULT_CONFIG, Config } from './config';
import { createProvider } from './ai/factory';
import { TagJudge } from './ai/judge';
import { PromptPreferences } from './ai/prompt';
import { readNewTracks, applyChange, notify } from './music/bridge';
import { loadState, saveState, BASE_DIR } from './state';
import { decideForTrack, needsAI } from './decide';
import { planDispositions } from './apply';
import { logResult, logLine } from './log';
import { TagDecision } from './types';

function loadConfig(): Config {
  const p = path.join(BASE_DIR, 'config.json');
  try {
    return parseConfig(JSON.parse(fs.readFileSync(p, 'utf8')));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return DEFAULT_CONFIG;
    throw e;
  }
}

async function main(): Promise<void> {
  const config = loadConfig();
  const state = loadState();
  const runStart = new Date().toISOString();

  const tracks = await readNewTracks(state.lastRun);
  if (tracks.length === 0) {
    saveState({ ...state, lastRun: runStart });
    return;
  }

  // Set up the AI judge if a feature needs it and a key is present.
  let judge: TagJudge | null = null;
  if (config.features.genre || config.features.titleCleanup) {
    const apiKey = process.env[config.apiKeyEnv];
    if (apiKey) {
      const prefs: PromptPreferences = {
        keepVersionTags: config.preferences.keepVersionTags,
        genreTaxonomy: config.preferences.genreTaxonomy,
        genreEnabled: config.features.genre,
      };
      judge = new TagJudge(createProvider(config, apiKey), config.model, prefs);
    } else {
      logLine(`AI key env "${config.apiKeyEnv}" not set — using deterministic fast-path only`);
    }
  }

  let applied = 0;
  let queued = 0;
  let wouldChange = 0;
  const queue = [...state.queue];

  for (const track of tracks) {
    let decision: TagDecision | null = null;
    if (judge && needsAI(track, config)) {
      decision = await judge.judge(track);
    }
    for (const result of planDispositions(decideForTrack(track, decision, config), config)) {
      logResult(result);
      if (result.disposition === 'applied') {
        if (await applyChange(result.change)) applied++;
      } else if (result.disposition === 'queued') {
        queue.push(result.change);
        queued++;
      } else {
        wouldChange++;
      }
    }
  }

  saveState({ lastRun: runStart, queue });

  if (config.dryRun && wouldChange > 0) {
    await notify('Tagsmith', `${wouldChange} change(s) would apply (dry-run)`);
  } else if (applied + queued > 0) {
    const parts: string[] = [];
    if (applied) parts.push(`${applied} applied`);
    if (queued) parts.push(`${queued} queued for review`);
    await notify('Tagsmith', parts.join(', '));
  }
}

main().catch((e) => {
  logLine(`[FATAL] ${e instanceof Error ? e.message : String(e)}`);
  process.exitCode = 1;
});
