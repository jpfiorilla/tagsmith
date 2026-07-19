import { fastPathClean } from '../src/rules/fastPath';

describe('fastPathClean', () => {
  it.each([
    ['Aurora (Remaster)', 'Aurora'],
    ['The Sprawl (2012 Remastered Version)', 'The Sprawl'],
    ['We Disappear (Remaster 2023)', 'We Disappear'],
    ['A Concert For Television (33 RPM LP Version)', 'A Concert For Television'],
    ["Sonny's Dream (Expanded Edition)", "Sonny's Dream"],
    ['Boy Who Cried Wolf (LP Version)', 'Boy Who Cried Wolf'],
    ['Odi et Amo - bis (Remastered)', 'Odi et Amo - bis'],
  ])('strips reissue tag: %s', (input, expected) => {
    const r = fastPathClean(input);
    expect(r.changed).toBe(true);
    expect(r.cleaned).toBe(expected);
  });

  it.each([
    'Total Trash (Live)',
    'Whiskey Can Can (Demo)',
    'Song (feat. Someone)',
    'Trilogy: a) The Wonder',
    'Mono',
    'The Rite of Spring (The Sacrifice)',
    'Open Eye Signal (Remix)',
  ])('leaves meaningful/real titles untouched: %s', (input) => {
    const r = fastPathClean(input);
    expect(r.changed).toBe(false);
    expect(r.cleaned).toBe(input);
  });

  it('tidies stray whitespace only when combined with a strip', () => {
    expect(fastPathClean('Trilogy: a) The Wonder  (2012 Remastered Version)').cleaned).toBe(
      'Trilogy: a) The Wonder',
    );
  });

  it('never blanks a title', () => {
    // Pathological: the whole title looks like a tag.
    const r = fastPathClean('(Remastered)');
    expect(r.cleaned.length).toBeGreaterThan(0);
  });

  it('is idempotent', () => {
    const once = fastPathClean('Aurora (Remaster)').cleaned;
    const twice = fastPathClean(once).cleaned;
    expect(twice).toBe(once);
  });
});
