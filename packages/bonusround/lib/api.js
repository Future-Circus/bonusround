// Tiny Bonus Round REST client shared by the stdio MCP server and the hosted /mcp endpoint.
// api(path, { method, body }) → parsed JSON, or throws ApiError with a message an AI agent can act on.

export class ApiError extends Error {
  constructor(message, { status = 0, path = '', missingRoute = false } = {}) {
    super(message);
    this.status = status; this.path = path; this.missingRoute = missingRoute;
  }
}

export function makeClient({ baseUrl, apiKey, userAgent = 'bonusround-cli' }) {
  const base = String(baseUrl || 'https://bonusround.io').replace(/\/+$/, '');
  async function api(path, { method = 'GET', body } = {}) {
    if (!apiKey) {
      throw new ApiError(`No Bonus Round API key. Create one at ${base}/app/developers/ and run \`npx bonusround login\`.`, { status: 401, path });
    }
    let res;
    try {
      res = await fetch(base + path, {
        method,
        headers: { authorization: `Bearer ${apiKey}`, accept: 'application/json', 'user-agent': userAgent, ...(body ? { 'content-type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new ApiError(`Could not reach ${base} (${err.cause?.code || err.message}). Check BONUSROUND_URL.`, { path });
    }
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : {}; } catch { /* not JSON */ }
    if (res.ok && data !== null) return data;
    // Express answers unknown routes with an HTML "Cannot GET /x" page: say so plainly instead of dumping HTML.
    if (data === null) {
      const missing = res.status === 404 && /Cannot (GET|POST|PATCH|PUT|DELETE)/.test(text);
      throw new ApiError(missing ? `${method} ${path} is not available on ${base} yet (404).` : `${method} ${path} failed (${res.status}): ${text.slice(0, 200)}`, { status: res.status, path, missingRoute: missing });
    }
    const hint = res.status === 401 ? ` The API key was rejected; create a new one at ${base}/app/developers/.` : '';
    const msg = String(data.error || `Request failed (${res.status})`);
    throw new ApiError(`${hint && !/[.!?]$/.test(msg) ? `${msg}.` : msg}${hint}`, { status: res.status, path });
  }
  return { api, baseUrl: base };
}
