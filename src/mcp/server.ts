// Tagsmith MCP server — the "no API key" path.
//
// Instead of Tagsmith calling a model, it exposes tools to whatever MCP host the user
// already runs (Claude Desktop, Cowork, Claude Code). Their existing Claude does the
// reasoning — reads newly-added tracks, decides what's junk vs. meaningful and what genre
// fits — and calls back to apply changes. No key, no per-token cost; it rides their seat.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readNewTracks, applyChange } from '../music/bridge';
import { fastPathClean } from '../rules/fastPath';
import { Field } from '../types';

function sinceFromDays(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function textResult(text: string, isError = false) {
  return { content: [{ type: 'text' as const, text }], isError };
}

const server = new McpServer({ name: 'tagsmith', version: '0.2.0' });

server.registerTool(
  'list_recent_additions',
  {
    description:
      'List tracks recently added to Apple Music so you can inspect their tags. ' +
      'Provide either sinceIso (ISO-8601) or days (default 7).',
    inputSchema: {
      sinceIso: z.string().optional(),
      days: z.number().int().positive().max(3650).optional(),
    },
  },
  async ({ sinceIso, days }) => {
    const since = sinceIso ?? sinceFromDays(days ?? 7);
    const tracks = await readNewTracks(since);
    return textResult(JSON.stringify(tracks, null, 2));
  },
);

server.registerTool(
  'suggest_cleanups',
  {
    description:
      'Run the deterministic fast-path over recent additions and return proposed title ' +
      'cleanups (removes only well-known reissue/edition tags). Use as a safe baseline; ' +
      'you may also reason about the arbitrary long tail and genres yourself, then apply ' +
      'via apply_tag_change.',
    inputSchema: {
      sinceIso: z.string().optional(),
      days: z.number().int().positive().max(3650).optional(),
    },
  },
  async ({ sinceIso, days }) => {
    const since = sinceIso ?? sinceFromDays(days ?? 7);
    const tracks = await readNewTracks(since);
    const proposals = tracks
      .map((t) => ({ track: t, fp: fastPathClean(t.name) }))
      .filter((x) => x.fp.changed)
      .map((x) => ({ persistentId: x.track.persistentId, field: 'title', from: x.track.name, to: x.fp.cleaned }));
    return textResult(JSON.stringify(proposals, null, 2));
  },
);

server.registerTool(
  'apply_tag_change',
  {
    description:
      'Apply ONE tag change to a track in Apple Music, identified by persistentId. ' +
      'field is "title" or "genre". Returns whether it succeeded.',
    inputSchema: {
      persistentId: z.string(),
      field: z.enum(['title', 'genre']),
      value: z.string().min(1),
    },
  },
  async ({ persistentId, field, value }) => {
    const ok = await applyChange({
      persistentId,
      field: field as Field,
      from: '',
      to: value,
      source: 'ai',
      confidence: 1,
    });
    return textResult(
      ok ? `Applied ${field} = "${value}"` : `Failed to apply ${field} change`,
      !ok,
    );
  },
);

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
  // stderr so it doesn't corrupt the stdio JSON-RPC channel
  process.stderr.write('Tagsmith MCP server running on stdio\n');
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack : String(e)}\n`);
  process.exit(1);
});
