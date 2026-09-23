import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import zlib from 'node:zlib';

const PORT = 3000;
const REGISTRY = 'https://registry.npmjs.org';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmDir = path.join(root, '.tools', 'npm');
const npmCli = path.join(npmDir, 'bin', 'npm-cli.js');

const logLines = [];
function log(message) {
  const line = `[dev] ${message}`;
  logLines.push(line);
  console.log(line);
}

const runtime = process.versions.electron
  ? `Node ${process.versions.node} (embedded in Electron ${process.versions.electron})`
  : `Node ${process.versions.node}`;
log(`runtime: ${runtime}`);
log(`executable: ${process.execPath}`);
log(`project: ${root}`);

let placeholder = null;
let placeholderError = null;

function startPlaceholder() {
  placeholder = createHttpServer((req, res) => {
    const status = placeholderError ? 'Failed to start' : 'Setting things up…';
    const body = `<!doctype html>
<meta charset="utf-8">
${placeholderError ? '' : '<meta http-equiv="refresh" content="3">'}
<title>Wavelength — ${status}</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #121212; color: #fff; font: 15px/1.5 system-ui, sans-serif; }
  main { width: min(720px, 90vw); }
  h1 { font-size: 22px; margin: 0 0 6px; }
  p { color: #b3b3b3; margin: 0 0 18px; }
  pre { background: #181818; border: 1px solid #2a2a2a; border-radius: 8px; padding: 14px; overflow: auto; max-height: 60vh; font-size: 12.5px; color: ${placeholderError ? '#ff7b7b' : '#1ed760'}; }
</style>
<main>
  <h1>${status}</h1>
  <p>${placeholderError ? 'See the log below.' : 'Installing dependencies for the first run. This page refreshes itself and the app will appear when ready.'}</p>
  <pre>${[...logLines, ...(placeholderError ? [placeholderError] : [])].map(escapeHtml).join('\n')}</pre>
</main>`;
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(body);
  });
  return new Promise((resolve, reject) => {
    placeholder.once('error', reject);
    placeholder.listen(PORT, () => resolve());
  });
}

function stopPlaceholder() {
  if (!placeholder) return Promise.resolve();
  const server = placeholder;
  placeholder = null;
  server.closeAllConnections?.();
  return new Promise((resolve) => server.close(() => resolve()));
}

function escapeHtml(text) {
  return String(text).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

async function fetchJson(url, accept = 'application/json') {
  const res = await fetch(url, { headers: { accept } });
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  return res.json();
}

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function untar(buf, dest, strip = 1) {
  let offset = 0;
  let overrideName = null;
  const readField = (header, start, len) =>
    header.subarray(start, start + len).toString('utf8').replace(/\0[\s\S]*$/, '');

  while (offset + 512 <= buf.length) {
    const header = buf.subarray(offset, offset + 512);
    if (header.every((b) => b === 0)) break;

    let name = readField(header, 0, 100);
    const prefix = readField(header, 345, 155);
    if (prefix) name = `${prefix}/${name}`;
    const size = parseInt(readField(header, 124, 12).trim() || '0', 8);
    const type = String.fromCharCode(header[156]);
    const dataStart = offset + 512;
    const data = buf.subarray(dataStart, dataStart + size);
    offset = dataStart + Math.ceil(size / 512) * 512;

    if (type === 'L') {
      overrideName = data.toString('utf8').replace(/\0[\s\S]*$/, '');
      continue;
    }
    if (type === 'x') {
      const match = /(?:^|\n)\d+ path=([^\n]*)\n/.exec(data.toString('utf8'));
      if (match) overrideName = match[1];
      continue;
    }
    if (type === 'g') continue;

    if (overrideName) {
      name = overrideName;
      overrideName = null;
    }
    const parts = name.split('/').filter(Boolean).slice(strip);
    if (parts.length === 0 || parts.some((p) => p === '..')) continue;
    const target = path.join(dest, ...parts);

    if (type === '5') {
      mkdirSync(target, { recursive: true });
      continue;
    }
    if (type === '0' || type === '\0' || type === '7') {
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, data);
    }
  }
}

function pickNpmVersion(packument) {
  const [major, minor] = process.versions.node.split('.').map(Number);
  const stable = Object.keys(packument.versions).filter((v) => !v.includes('-'));
  const numeric = (v) => v.split('.').map(Number);
  const compare = (a, b) => {
    const [pa, pb] = [numeric(a), numeric(b)];
    for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
    return 0;
  };
  const newestOfMajor = (m) => stable.filter((v) => v.startsWith(`${m}.`)).sort(compare).pop();

  if (major >= 24 || (major === 22 && minor >= 22)) return packument['dist-tags'].latest;
  if (major >= 22) return newestOfMajor(11) || newestOfMajor(10);
  return newestOfMajor(10);
}

async function ensureNpm() {
  const packument = await fetchJson(`${REGISTRY}/npm`, 'application/vnd.npm.install-v1+json');
  const version = pickNpmVersion(packument);
  if (!version) throw new Error('could not find an npm release compatible with this Node version');

  if (existsSync(npmCli)) {
    const installed = JSON.parse(readFileSync(path.join(npmDir, 'package.json'), 'utf8')).version;
    if (installed === version) return;
    log(`replacing npm ${installed} in .tools/npm with ${version} (compatible with Node ${process.versions.node})`);
  } else {
    log('npm is not installed on this machine; fetching a private copy into .tools/npm …');
  }

  const meta = packument.versions[version];
  log(`downloading npm ${version} (${meta.dist.tarball})`);
  const tgz = await fetchBuffer(meta.dist.tarball);

  const [algo, expected] = meta.dist.integrity.split('-');
  const actual = createHash(algo).update(tgz).digest('base64');
  if (actual !== expected) throw new Error('npm tarball failed its integrity check; aborting');

  rmSync(npmDir, { recursive: true, force: true });
  mkdirSync(npmDir, { recursive: true });
  untar(zlib.gunzipSync(tgz), npmDir, 1);
  if (!existsSync(npmCli)) throw new Error(`extraction finished but ${npmCli} is missing`);
  log(`npm ${version} ready`);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(command)} exited with ${signal ?? `code ${code}`}`));
    });
  });
}

async function ensureDependencies() {
  const required = ['vite', '@vitejs/plugin-react', 'react', 'react-dom', 'react-router-dom'];
  const missing = required.filter((name) => !existsSync(path.join(root, 'node_modules', name, 'package.json')));
  if (missing.length === 0) return;

  log(`missing packages: ${missing.join(', ')}`);
  await ensureNpm();
  log('running npm install (this only happens once) …');
  await run(process.execPath, [npmCli, 'install', '--no-audit', '--no-fund', '--ignore-scripts', '--loglevel=warn'], {
    cwd: root,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  });
  log('dependencies installed');
}

async function main() {
  await startPlaceholder();
  log(`holding http://localhost:${PORT} while checking dependencies`);

  await ensureDependencies();

  const { createServer } = await import('vite');
  const server = await createServer({
    root,
    configFile: path.join(root, 'vite.config.js'),
    server: { port: PORT, strictPort: true },
  });

  await stopPlaceholder();
  await server.listen();
  log('Vite dev server is up');
  server.printUrls();
}

main().catch(async (err) => {
  placeholderError = err && err.stack ? err.stack : String(err);
  console.error(placeholderError);
  if (placeholder) {
    log('startup failed; leaving the status page up on port 3000 so the error is visible');
  } else {
    process.exit(1);
  }
});
