import { execFileSync } from 'node:child_process';
import { Config } from './config';

export const KEYCHAIN_SERVICE = 'tagsmith-anthropic';

/**
 * Resolve the API key for the configured provider, preferring an environment variable
 * and falling back to the macOS Keychain. The key is never written to disk or the repo.
 *
 * Store it once with:
 *   security add-generic-password -a "$USER" -s tagsmith-anthropic -w
 *
 * Returns null when no key is available (the caller then runs deterministic-only).
 */
export function resolveApiKey(
  config: Config,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const fromEnv = env[config.apiKeyEnv];
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv.trim();

  return readKeychain(KEYCHAIN_SERVICE);
}

/** Read a generic password from the macOS Keychain. Returns null if absent/unavailable. */
export function readKeychain(service: string): string | null {
  try {
    const out = execFileSync('security', ['find-generic-password', '-s', service, '-w'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const key = out.trim();
    return key.length > 0 ? key : null;
  } catch {
    // Not found, or not on macOS.
    return null;
  }
}
