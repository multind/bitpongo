// Packages dist/ into the nginx image and carries over the hashed assets of recent releases,
// so pages and App WebViews still holding an older index.html can finish loading after a release.
//
//   pnpm build
//   node scripts/package-image.mjs <tag> [--previous <image>] [--keep 3]
//
// Each image records its own asset list in dist/.releases/<time>-<tag>.json (not served publicly).
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const tag = args[0];
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const previous = option('previous');
const keep = Number(option('keep', '3'));
if (!tag || !Number.isInteger(keep) || keep < 1) {
  console.error('usage: node scripts/package-image.mjs <tag> [--previous <image>] [--keep 3]');
  process.exit(1);
}

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
if (!existsSync(join(dist, 'index.html'))) throw new Error('dist/index.html not found; run pnpm build first');

const docker = (...cmd) => execFileSync('docker', cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const lf = (file) => readFileSync(join(root, file), 'utf8').replace(/\r\n/g, '\n');

const context = mkdtempSync(join(tmpdir(), 'bitpongo-front-'));
try {
  cpSync(dist, join(context, 'dist'), { recursive: true });
  writeFileSync(join(context, 'nginx.conf'), lf('nginx.conf'));
  writeFileSync(join(context, 'Dockerfile'), lf('Dockerfile'));

  const assetsDir = join(context, 'dist', 'assets');
  const releasesDir = join(context, 'dist', '.releases');
  rmSync(releasesDir, { recursive: true, force: true });
  mkdirSync(releasesDir);
  const current = readdirSync(assetsDir);
  const manifests = [{ name: `${Date.now()}-${tag}.json`, assets: current }];

  let carried = 0;
  if (previous) {
    const container = docker('create', previous);
    const previousAssets = join(context, 'previous-assets');
    const previousReleases = join(context, 'previous-releases');
    try {
      docker('cp', `${container}:/usr/share/nginx/html/dist/assets`, previousAssets);
      try {
        docker('cp', `${container}:/usr/share/nginx/html/dist/.releases`, previousReleases);
      } catch {
        // Images built before this script have no manifests: treat their assets as one release.
      }
    } finally {
      docker('rm', container);
    }
    if (existsSync(previousReleases)) {
      for (const name of readdirSync(previousReleases)) {
        manifests.push({ name, assets: JSON.parse(readFileSync(join(previousReleases, name), 'utf8')).assets });
      }
    } else {
      manifests.push({ name: `0-legacy.json`, assets: readdirSync(previousAssets) });
    }

    manifests.sort((a, b) => Number(b.name.split('-')[0]) - Number(a.name.split('-')[0]));
    manifests.splice(keep);
    const present = new Set(current);
    for (const manifest of manifests.slice(1)) {
      for (const asset of manifest.assets) {
        if (present.has(asset) || !existsSync(join(previousAssets, asset))) continue;
        cpSync(join(previousAssets, asset), join(assetsDir, asset));
        present.add(asset);
        carried++;
      }
    }
  }

  for (const manifest of manifests) {
    writeFileSync(join(releasesDir, manifest.name), JSON.stringify({ assets: manifest.assets }));
  }
  docker('build', '-q', '-t', `bitpongofront:${tag}`, context);
  console.log(`bitpongofront:${tag}: ${current.length} new assets, ${carried} carried over from ${manifests.length - 1} earlier release(s)`);
} finally {
  rmSync(context, { recursive: true, force: true });
}
