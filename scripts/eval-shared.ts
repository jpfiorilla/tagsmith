// Shared helpers for the opt-in live scripts (record + eval). Not part of the unit suite.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Track } from '../src/types';

export interface AiTrack extends Track {
  expect: { cleanedTitle: string; suggestedGenre: string | null; titleChange: boolean };
}

const FIX = path.join(__dirname, '..', 'test', 'fixtures');

export function loadAiTracks(): AiTrack[] {
  return JSON.parse(fs.readFileSync(path.join(FIX, 'ai-tracks.json'), 'utf8'));
}

export function requireKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.error('Set ANTHROPIC_API_KEY to run this script (it makes real API calls).');
    process.exit(2);
  }
  return key;
}

export const FIXTURES_DIR = FIX;
