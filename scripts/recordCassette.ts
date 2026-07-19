// Opt-in: (re)record the replay cassette from REAL Claude responses, so CI can replay
// genuine model output. Requires a key; NOT run in CI.
//
//   ANTHROPIC_API_KEY=sk-ant-... npx ts-node scripts/recordCassette.ts
//
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AnthropicProvider } from '../src/ai/providers/anthropic';
import { DEFAULT_MODELS } from '../src/ai/provider';
import { buildSystemPrompt, buildUserPrompt, PromptPreferences } from '../src/ai/prompt';
import { cassetteKey, Cassette } from '../src/ai/providers/replay';
import { loadAiTracks, requireKey, FIXTURES_DIR } from './eval-shared';

const prefs: PromptPreferences = { keepVersionTags: true, genreTaxonomy: [], genreEnabled: true };

async function main(): Promise<void> {
  const provider = new AnthropicProvider(requireKey());
  const system = buildSystemPrompt(prefs);
  const cassette: Cassette = {};

  for (const t of loadAiTracks()) {
    const user = buildUserPrompt(t);
    const raw = await provider.complete({
      system,
      user,
      model: DEFAULT_MODELS.anthropic,
      maxTokens: 400,
    });
    cassette[cassetteKey({ user })] = raw;
    console.log(`recorded: ${t.name}`);
  }

  const out = path.join(FIXTURES_DIR, 'ai-cassette.json');
  fs.writeFileSync(out, JSON.stringify(cassette, null, 2), 'utf8');
  console.log(`\nWrote ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
