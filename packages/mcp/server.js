#!/usr/bin/env node
// Bonus Round MCP server (stdio).
//   BONUSROUND_API_KEY=br_sk_…  (falls back to the key saved by `npx bonusround login`)
//   BONUSROUND_URL=https://bonusround.io  (default)
// Claude Code: claude mcp add bonusround --env BONUSROUND_API_KEY=br_sk_… -- npx -y @bonusround/mcp
// Logs go to stderr only: stdout is the MCP channel.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { makeClient } from './client.js';
import { registerBonusRoundTools } from './tools.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const VERSION = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version;

function savedCredentials() {
  const dir = path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'bonusround');
  try { return JSON.parse(fs.readFileSync(path.join(dir, 'credentials'), 'utf8')); } catch { return {}; }
}

const saved = savedCredentials();
const trim = (u) => String(u || '').replace(/\/+$/, '');
const baseUrl = trim(process.env.BONUSROUND_URL || saved.url || 'https://bonusround.io');
// A key saved by `bonusround login` belongs to the server it was saved for: never send it to a different BONUSROUND_URL.
const apiKey = process.env.BONUSROUND_API_KEY || (saved.apiKey && trim(saved.url || 'https://bonusround.io') === baseUrl ? saved.apiKey : '') || '';
const { api } = makeClient({ baseUrl, apiKey, userAgent: `bonusround-mcp/${VERSION}` });

// integrate.md: the live copy from the server, else the copy shipped next to this file (or in the repo).
async function guide() {
  try {
    const res = await fetch(`${baseUrl}/integrate.md`, { headers: { accept: 'text/markdown, text/plain' } });
    const t = await res.text();
    if (res.ok && t.startsWith('#')) return t;
  } catch { /* offline: use the bundled copy */ }
  for (const f of [path.join(here, 'integrate.md'), path.join(here, '../../web/integrate.md')]) {
    if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  }
  return `Read ${baseUrl}/integrate.md for the integration guide.`;
}

const server = new McpServer(
  { name: 'bonusround', title: 'Bonus Round', version: VERSION },
  { instructions: 'Bonus Round is an ad network for three.js games. To integrate a game, call bonusround_integration_guide first and follow it. Money values are integer micros (1 USD = 1,000,000). Never turn test mode off or change floors without the user saying so.' },
);
registerBonusRoundTools(server, { api, baseUrl, guide });

await server.connect(new StdioServerTransport());
console.error(`[bonusround-mcp] ready (${baseUrl}, ${apiKey ? `key ${apiKey.slice(0, 12)}…` : 'no API key'})`);
