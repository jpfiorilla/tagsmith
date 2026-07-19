import { ProposedChange, Disposition, AppliedResult } from './types';
import { Config } from './config';

/**
 * Decide the disposition of a single proposed change under the configured autonomy mode.
 * This is pure policy — it does not touch Music. The caller performs the actual write
 * for changes whose disposition is 'applied'.
 *
 * Modes:
 *  - 'auto'       : apply everything.
 *  - 'review'     : queue everything for human approval.
 *  - 'confidence' : apply at/above threshold, queue the rest.
 * `dryRun` (global) forces everything to 'skipped-dry-run' regardless of mode.
 */
export function disposition(change: ProposedChange, config: Config): Disposition {
  if (config.dryRun) return 'skipped-dry-run';

  switch (config.autonomy.mode) {
    case 'auto':
      return 'applied';
    case 'review':
      return 'queued';
    case 'confidence':
      return change.confidence >= config.autonomy.confidenceThreshold ? 'applied' : 'queued';
    default: {
      const _exhaustive: never = config.autonomy.mode;
      return _exhaustive;
    }
  }
}

export function planDispositions(changes: ProposedChange[], config: Config): AppliedResult[] {
  return changes.map((change) => ({ change, disposition: disposition(change, config) }));
}
