import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { ProposedChange } from './types';

export const BASE_DIR = path.join(os.homedir(), 'Library', 'Application Support', 'Tagsmith');
const STATE_PATH = path.join(BASE_DIR, 'state.json');

export interface State {
  /** ISO timestamp high-water mark: only tracks added after this are considered. */
  lastRun: string;
  /** Changes awaiting human approval (autonomy 'review' or below-threshold). */
  queue: ProposedChange[];
}

export function ensureBaseDir(): void {
  fs.mkdirSync(BASE_DIR, { recursive: true });
}

export function loadState(): State {
  try {
    const raw = fs.readFileSync(STATE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      lastRun: typeof parsed.lastRun === 'string' ? parsed.lastRun : new Date().toISOString(),
      queue: Array.isArray(parsed.queue) ? parsed.queue : [],
    };
  } catch {
    // First run: start the clock now so we never touch the pre-existing library.
    return { lastRun: new Date().toISOString(), queue: [] };
  }
}

export function saveState(state: State): void {
  ensureBaseDir();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}
