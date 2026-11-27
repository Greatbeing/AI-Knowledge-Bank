import { afterEach, describe, expect, it } from 'vitest';
import { createApiServer } from './oracle-api.mjs';

describe('Oracle Node API adapter', () => {
  let server;

  afterEach(async () => {
    if (!server?.listening) return;
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    server = undefined;
  });

  it('adapts the health route to the Node runtime', async () => {
    server = createApiServer({ API_RUNTIME: 'oracle-node' });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.runtime).toBe('oracle-node');
    expect(payload.supabase.configured).toBe(false);
  });

  it('returns a JSON 404 for paths outside the API namespace', async () => {
    server = createApiServer({});
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/not-an-api`);

    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe('not_found');
  });
});
