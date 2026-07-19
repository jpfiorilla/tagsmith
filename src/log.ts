import * as fs from 'node:fs';
import * as path from 'node:path';
import { BASE_DIR, ensureBaseDir } from './state';
import { AppliedResult } from './types';

const LOG_PATH = path.join(BASE_DIR, 'changes.log');

export function logResult(result: AppliedResult): void {
  const { change, disposition } = result;
  const line =
    `${new Date().toISOString()}  [${disposition}] ${change.field} (${change.source} ` +
    `conf=${change.confidence.toFixed(2)}) "${change.from}" -> "${change.to}"` +
    (change.reasoning ? `  // ${change.reasoning}` : '');
  append(line);
}

export function logLine(line: string): void {
  append(`${new Date().toISOString()}  ${line}`);
}

function append(line: string): void {
  try {
    ensureBaseDir();
    fs.appendFileSync(LOG_PATH, line + '\n', 'utf8');
  } catch {
    // logging must never crash the agent
  }
  // eslint-disable-next-line no-console
  console.log(line);
}
