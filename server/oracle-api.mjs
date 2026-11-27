#!/usr/bin/env node
/**
 * Oracle Cloud Node.js adapter for the existing Fetch API handler.
 *
 * The Cloudflare Pages handler remains the source of API behavior. This adapter
 * supplies the small context contract it expects, so the same routes can run
 * behind an internal reverse proxy on a regular Node.js VM.
 */
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { onRequest } from '../functions/api/[[path]].js';

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_BODY_BYTES = Number(process.env.API_MAX_BODY_BYTES || 1_048_576);

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Request body is too large.'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolveBody(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function toWebHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(nodeHeaders)) {
    if (value === undefined || ['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'host'].includes(name.toLowerCase())) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) headers.append(name, item);
    } else {
      headers.set(name, String(value));
    }
  }
  return headers;
}

export function createApiServer(env = process.env) {
  return createServer(async (nodeReq, nodeRes) => {
    try {
      const url = new URL(nodeReq.url || '/', 'http://oracle-internal');
      if (url.pathname !== '/api' && !url.pathname.startsWith('/api/')) {
        nodeRes.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
        nodeRes.end(JSON.stringify({ ok: false, error: 'not_found' }));
        return;
      }

      const route = url.pathname.replace(/^\/api\/?/, '');
      const routeParts = route ? route.split('/').map((part) => decodeURIComponent(part)) : [];
      const body = ['GET', 'HEAD'].includes(nodeReq.method || 'GET') ? undefined : await readBody(nodeReq);
      const request = new Request(`http://oracle-internal${url.pathname}${url.search}`, {
        method: nodeReq.method,
        headers: toWebHeaders(nodeReq.headers),
        body: body?.length ? body : undefined
      });

      const response = await onRequest({
        request,
        env,
        params: { path: routeParts }
      });

      const responseHeaders = Object.fromEntries(response.headers.entries());
      nodeRes.writeHead(response.status, responseHeaders);
      nodeRes.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      if (nodeRes.headersSent || nodeRes.destroyed) return;
      const status = Number.isInteger(error.status) ? error.status : 500;
      nodeRes.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
      nodeRes.end(JSON.stringify({
        ok: false,
        error: status === 413 ? 'payload_too_large' : 'internal_error',
        message: status === 413 ? error.message : 'Unexpected API adapter error.'
      }));
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createApiServer();
  server.listen(PORT, HOST, () => {
    process.stdout.write(`[ai-knowledge-bank] Node API listening on ${HOST}:${PORT}\n`);
  });
}
