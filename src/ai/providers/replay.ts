import { AIProvider, CompletionRequest, ProviderError } from '../provider';

/**
 * A provider that replays recorded model responses instead of calling the network.
 *
 * The cassette maps a key derived from the request's user payload (the track JSON) to the
 * raw response string the real model produced. This lets the judge → decide → autonomy
 * pipeline be tested deterministically against *real* Claude output — and lets the
 * live-eval script record a cassette once that CI can replay forever.
 */
export type Cassette = Record<string, string>;

/** Stable key for a request: the exact user payload (track JSON). */
export function cassetteKey(req: Pick<CompletionRequest, 'user'>): string {
  return req.user;
}

export class ReplayProvider implements AIProvider {
  readonly name = 'replay';
  constructor(private readonly cassette: Cassette) {}

  async complete(req: CompletionRequest): Promise<string> {
    const key = cassetteKey(req);
    const hit = this.cassette[key];
    if (hit === undefined) {
      throw new ProviderError(this.name, `no cassette entry for: ${key}`);
    }
    return hit;
  }
}
