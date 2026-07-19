import * as fs from 'node:fs';
import * as path from 'node:path';
import { fastPathClean } from '../src/rules/fastPath';

interface Fixture {
  persistentId: string;
  name: string;
  artist: string;
  album: string;
  genre: string;
  expect: { cleaned: string; changed: boolean };
}

// A small, curated sample of REAL tracks exported from Apple Music. The full library is
// personal and gitignored; this fixture just captures one example per pattern class so
// the deterministic fast-path is regression-tested against real-world titles.
const fixtures: Fixture[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'tracks.sample.json'), 'utf8'),
);

describe('fast-path over real Library.xml sample', () => {
  it('has both strip and keep cases in the fixture', () => {
    expect(fixtures.some((f) => f.expect.changed)).toBe(true);
    expect(fixtures.some((f) => !f.expect.changed)).toBe(true);
  });

  it.each(fixtures.map((f) => [f.name, f] as const))('matches expected for %s', (_name, f) => {
    const r = fastPathClean(f.name);
    expect(r.cleaned).toBe(f.expect.cleaned);
    expect(r.changed).toBe(f.expect.changed);
  });

  it('never blanks or empties a real title', () => {
    for (const f of fixtures) {
      expect(fastPathClean(f.name).cleaned.length).toBeGreaterThan(0);
    }
  });
});
