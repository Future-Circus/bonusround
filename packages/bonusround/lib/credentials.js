// ~/.config/bonusround/credentials (or $XDG_CONFIG_HOME/bonusround/credentials): { apiKey, url, email, savedAt }, mode 0600.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const configDir = () => path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'bonusround');
export const credentialsPath = () => path.join(configDir(), 'credentials');

export function loadCredentials() {
  try { return JSON.parse(fs.readFileSync(credentialsPath(), 'utf8')); } catch { return {}; }
}

export function saveCredentials(data) {
  fs.mkdirSync(configDir(), { recursive: true, mode: 0o700 });
  const file = credentialsPath();
  fs.writeFileSync(file, JSON.stringify({ ...data, savedAt: new Date().toISOString() }, null, 2) + '\n', { mode: 0o600 });
  fs.chmodSync(file, 0o600); // also tighten a file that already existed with looser permissions
  return file;
}

export function deleteCredentials() {
  try { fs.unlinkSync(credentialsPath()); return true; } catch { return false; }
}
