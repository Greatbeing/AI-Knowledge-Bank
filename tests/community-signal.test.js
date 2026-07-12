import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildCommunitySignalRequest, fetchApi } from '../lib/shared/api.js';

const NODE_ID = '00000000-0000-0000-0000-000000000101';

function signalInput(overrides = {}) {
  return {
    source: 'supabase',
    node: { id: NODE_ID },
    accessToken: 'user-token',
    signal: {
      signal_type: 'validated',
      impact_delta: 12,
      confidence: 0.86,
      metadata: { source: 'community-page' }
    },
    ...overrides
  };
}

describe('buildCommunitySignalRequest', () => {
  it('keeps fallback nodes in local demo mode without authentication', () => {
    const result = buildCommunitySignalRequest(signalInput({
      source: 'fallback',
      node: { id: 'demo-knowledge-node' },
      accessToken: null
    }));

    expect(result.requiresAuthentication).toBe(false);
    expect(result.options.headers).toEqual({});
    expect(result.options.body).toMatchObject({ node_id: null });
  });

  it('requires authentication for a real Supabase node', () => {
    const result = buildCommunitySignalRequest(signalInput({ accessToken: null }));

    expect(result.requiresAuthentication).toBe(true);
    expect(result.options).toBeNull();
  });

  it('attaches the bearer token only for an authenticated real node', () => {
    const result = buildCommunitySignalRequest(signalInput());

    expect(result.requiresAuthentication).toBe(false);
    expect(result.options).toMatchObject({
      method: 'POST',
      headers: { Authorization: 'Bearer user-token' }
    });
    expect(result.options.body).toMatchObject({ node_id: NODE_ID });
  });

  it('treats malformed Supabase node IDs as non-persisted demo data', () => {
    const result = buildCommunitySignalRequest(signalInput({
      node: { id: 'not-a-uuid' },
      accessToken: null
    }));

    expect(result.requiresAuthentication).toBe(false);
    expect(result.options.body).toMatchObject({ node_id: null });
  });
});

describe('community signal client request', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('serializes the signal body exactly once', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    }));
    vi.stubGlobal('fetch', fetchSpy);
    const request = buildCommunitySignalRequest(signalInput());

    await fetchApi('/community-signals', request.options);

    const [, init] = fetchSpy.mock.calls[0];
    expect(JSON.parse(init.body)).toMatchObject({
      node_id: NODE_ID,
      signal_type: 'validated'
    });
    expect(typeof JSON.parse(init.body)).toBe('object');
  });

  it('preserves an authentication response status when requested by the caller', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ok: false,
      error: 'authentication_required'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })));

    await expect(fetchApi('/community-signals', {
      method: 'POST',
      body: { signal_type: 'validated', node_id: NODE_ID },
      throwOnError: true
    })).rejects.toMatchObject({ status: 401 });
  });
});
