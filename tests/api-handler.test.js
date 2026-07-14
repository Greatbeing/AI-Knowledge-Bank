import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequest } from '../functions/api/[[path]].js';

const NODE_ID = '00000000-0000-0000-0000-000000000101';
const USER_ID = '00000000-0000-4000-8000-000000000201';

let clientNumber = 0;

function createContext({
  path = 'community-signals',
  method = 'POST',
  body,
  headers = {},
  env = {}
} = {}) {
  clientNumber += 1;
  const requestHeaders = new Headers({
    'CF-Connecting-IP': `192.0.2.${clientNumber}`,
    ...headers
  });
  const request = new Request(`https://example.test/api/${path}`, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  return {
    request,
    env,
    params: { path }
  };
}

async function invoke(options) {
  const response = await onRequest(createContext(options));
  return {
    response,
    payload: response.status === 204 ? null : await response.json()
  };
}

function configuredEnv(overrides = {}) {
  return {
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    ...overrides
  };
}

function authUser() {
  return {
    id: USER_ID,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'user@example.com',
    app_metadata: { provider: 'github', providers: ['github'] },
    user_metadata: { user_name: 'example' },
    created_at: '2026-07-12T00:00:00.000Z'
  };
}

function validSignal() {
  return {
    node_id: NODE_ID,
    signal_type: 'validated',
    impact_delta: 12,
    confidence: 0.86,
    metadata: { source: 'test' }
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('API request handler', () => {
  it('answers preflight requests with the allowed origin', async () => {
    const { response } = await invoke({
      method: 'OPTIONS',
      headers: { Origin: 'https://greatbeing.github.io' }
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://greatbeing.github.io');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
  });

  it('returns a structured 404 for unknown routes', async () => {
    const { response, payload } = await invoke({ path: 'missing', method: 'GET' });

    expect(response.status).toBe(404);
    expect(payload).toMatchObject({ ok: false, error: 'not_found' });
  });

  it('keeps node-less community signals in demo mode without calling Supabase', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { response, payload } = await invoke({
      body: { ...validSignal(), node_id: null },
      env: configuredEnv()
    });

    expect(response.status).toBe(201);
    expect(payload).toMatchObject({ ok: true, persisted: false, source: 'fallback' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects malformed node IDs before contacting Supabase', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { response, payload } = await invoke({
      body: { ...validSignal(), node_id: 'demo-node' },
      env: configuredEnv()
    });

    expect(response.status).toBe(400);
    expect(payload).toMatchObject({ ok: false, error: 'invalid_id' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('requires a bearer token before writing a real community signal', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { response, payload } = await invoke({
      body: validSignal(),
      env: configuredEnv()
    });

    expect(response.status).toBe(401);
    expect(payload).toMatchObject({ ok: false, error: 'authentication_required' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects an invalid or expired bearer token', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Invalid JWT' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    }));
    vi.stubGlobal('fetch', fetchSpy);

    const { response, payload } = await invoke({
      body: validSignal(),
      headers: { Authorization: 'Bearer expired-token' },
      env: configuredEnv()
    });

    expect(response.status).toBe(401);
    expect(payload).toMatchObject({ ok: false, error: 'authentication_required' });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('requires an anonymous project key for user-scoped writes', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { response, payload } = await invoke({
      body: validSignal(),
      headers: { Authorization: 'Bearer user-token' },
      env: configuredEnv({ SUPABASE_ANON_KEY: undefined })
    });

    expect(response.status).toBe(503);
    expect(payload).toMatchObject({ ok: false, error: 'service_unavailable' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('derives user_id from the verified session and writes with the user token', async () => {
    const insertedSignal = {
      id: '00000000-0000-4000-8000-000000000301',
      node_id: NODE_ID,
      user_id: USER_ID,
      signal_type: 'validated',
      impact_delta: 12,
      confidence: 0.86,
      evidence_url: null,
      metadata: { source: 'test' },
      created_at: '2026-07-12T00:00:00.000Z'
    };
    const fetchSpy = vi.fn(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/v1/user')) {
        return new Response(JSON.stringify(authUser()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (url.includes('/rest/v1/community_evolution_signals')) {
        return new Response(JSON.stringify([insertedSignal]), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`Unexpected Supabase URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchSpy);

    const { response, payload } = await invoke({
      body: { ...validSignal(), user_id: 'client-controlled-user' },
      headers: { Authorization: 'Bearer user-token' },
      env: configuredEnv()
    });

    expect(response.status).toBe(201);
    expect(payload).toMatchObject({ ok: true, persisted: true, source: 'supabase' });
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    const [authUrl, authInit] = fetchSpy.mock.calls[0];
    expect(String(authUrl)).toBe('https://project.supabase.co/auth/v1/user');
    expect(authInit.headers).toMatchObject({
      apikey: 'anon-key',
      Authorization: 'Bearer user-token'
    });

    const [, insertInit] = fetchSpy.mock.calls[1];
    expect(insertInit.headers).toMatchObject({
      apikey: 'anon-key',
      Authorization: 'Bearer user-token'
    });
    expect(insertInit.headers.Authorization).not.toContain('service-role-key');
    expect(JSON.parse(insertInit.body)).toMatchObject({
      node_id: NODE_ID,
      user_id: USER_ID,
      signal_type: 'validated'
    });
  });

  it('returns a generic gateway error when the user-scoped insert fails', async () => {
    const fetchSpy = vi.fn(async (input) => {
      if (String(input).endsWith('/auth/v1/user')) {
        return new Response(JSON.stringify(authUser()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response('sensitive upstream database detail', { status: 500 });
    });
    vi.stubGlobal('fetch', fetchSpy);

    const { response, payload } = await invoke({
      body: validSignal(),
      headers: { Authorization: 'Bearer user-token' },
      env: configuredEnv()
    });

    expect(response.status).toBe(502);
    expect(payload).toMatchObject({ ok: false, error: 'upstream_error' });
    expect(payload.message).not.toContain('sensitive');
  });

  it('maps an RLS rejection after authentication to a generic gateway error', async () => {
    const fetchSpy = vi.fn(async (input) => {
      if (String(input).endsWith('/auth/v1/user')) {
        return new Response(JSON.stringify(authUser()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response('row-level security policy detail', { status: 403 });
    });
    vi.stubGlobal('fetch', fetchSpy);

    const { response, payload } = await invoke({
      body: validSignal(),
      headers: { Authorization: 'Bearer user-token' },
      env: configuredEnv()
    });

    expect(response.status).toBe(502);
    expect(payload).toMatchObject({ ok: false, error: 'upstream_error' });
    expect(payload.message).not.toContain('policy');
  });

  it('maps insert transport failures to a generic gateway error', async () => {
    const fetchSpy = vi.fn(async (input) => {
      if (String(input).endsWith('/auth/v1/user')) {
        return new Response(JSON.stringify(authUser()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw new Error('private network detail');
    });
    vi.stubGlobal('fetch', fetchSpy);

    const { response, payload } = await invoke({
      body: validSignal(),
      headers: { Authorization: 'Bearer user-token' },
      env: configuredEnv()
    });

    expect(response.status).toBe(502);
    expect(payload).toMatchObject({ ok: false, error: 'upstream_error' });
    expect(payload.message).not.toContain('private');
  });

  it('maps malformed insert responses to a generic gateway error', async () => {
    const fetchSpy = vi.fn(async (input) => {
      if (String(input).endsWith('/auth/v1/user')) {
        return new Response(JSON.stringify(authUser()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response('not-json', {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    });
    vi.stubGlobal('fetch', fetchSpy);

    const { response, payload } = await invoke({
      body: validSignal(),
      headers: { Authorization: 'Bearer user-token' },
      env: configuredEnv()
    });

    expect(response.status).toBe(502);
    expect(payload).toMatchObject({ ok: false, error: 'upstream_error' });
  });
});
