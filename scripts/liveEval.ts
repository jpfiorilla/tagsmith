// Opt-in LIVE evaluation: actually calls Claude over the fixture tracks and scores the
// results against expectations. Non-deterministic, costs tokens, NOT run in CI.
//
//   ANTHROPIC_API_KEY=sk-ant-... npx ts-node scripts/liveEval.ts
//
import { AnthropicProvider } from '../src/ai/providers/anthropic';
import { DEFAULT_MODELS } from '../src/ai/provider';
import { TagJudge } from '../src/ai/judge';
import { PromptPreferences } from '../src/ai/prompt';
import { loadAiTracks, requireKey } from './eval-shared';

const prefs: PromptPreferences = { keepVersionTags: true, genreTaxonomy: [], genreEnabled: true };

async function main(): Promise<void> {
  const key = requireKey();
  const judge = new TagJudge(new AnthropicProvider(key), DEFAULT_MODELS.anthropic, prefs);
  const tracks = loadAiTracks();

  let pass = 0;
  for (const t of tracks) {
    const d = await judge.judge(t);
    const titleOk = d.cleanedTitle === t.expect.cleanedTitle;
    const mark = titleOk ? 'PASS' : 'FAIL';
    if (titleOk) pass++;
    console.log(
      `${mark}  "${t.name}"\n      got   : "${d.cleanedTitle}" (genre=${d.suggestedGenre}, conf=${d.confidence})\n      expect: "${t.expect.cleanedTitle}"\n      why   : ${d.reasoning}`,
    );
  }
  console.log(`\n${pass}/${tracks.length} title expectations met.`);
  process.exitCode = pass === tracks.length ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
