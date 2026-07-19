import { AnthropicProvider, FetchLike } from '../src/ai/providers/anthropic';
import { ProviderError } from '../src/ai/provider';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe('AnthropicProvider', () => {
  it('sends a well-formed request and returns the text block', async () => {
    let capturedUrl = '';
    let capturedInit: RequestInit = {};
    const fetchImpl: FetchLike = async (url, init) => {
      capturedUrl = url;
      capturedInit = init;
      return jsonResponse({ content: [{ type: 'text', text: 'hello' }] });
    };

    const provider = new AnthropicProvider('sk-test', fetchImpl);
    const out = await provider.complete({
      system: 'SYS',
      user: 'USER',
      model: 'claude-haiku-4-5-20251001',
      maxTokens: 100,
    });

    expect(out).toBe('hello');
    expect(capturedUrl).toBe('https://api.anthropic.com/v1/messages');
    expect((capturedInit.headers as Record<string, string>)['x-api-key']).toBe('sk-test');
    const body = JSON.parse(capturedInit.body as string);
    expect(body.model).toBe('claude-haiku-4-5-20251001');
    expect(body.temperature).toBe(0); // determinism
    expect(body.system).toBe('SYS');
    expect(body.messages).toEqual([{ role: 'user', content: 'USER' }]);
  });

  it('throws ProviderError on a non-2xx response', async () => {
    const fetchImpl: FetchLike = async () => jsonResponse({ error: 'nope' }, 401);
    const provider = new AnthropicProvider('bad', fetchImpl);
    await expect(
      provider.complete({ system: 's', user: 'u', model: 'm', maxTokens: 10 }),
    ).rejects.toBeInstanceOf(ProviderError);
  });

  it('throws when the response has no text block', async () => {
    const fetchImpl: FetchLike = async () => jsonResponse({ content: [] });
    const provider = new AnthropicProvider('k', fetchImpl);
    await expect(
      provider.complete({ system: 's', user: 'u', model: 'm', maxTokens: 10 }),
    ).rejects.toThrow(/no text block/);
  });
});
