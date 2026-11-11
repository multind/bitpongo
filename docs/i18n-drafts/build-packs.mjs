// Generates src/i18n/lang/<locale>.ts from the reviewed drafts, keeping the en-us key order.
// Run from the frontend checkout after apply-regional.mjs:
//   node --experimental-strip-types docs/i18n-drafts/build-packs.mjs && npx prettier --write src/i18n/lang
import { readFileSync, writeFileSync } from 'node:fs';
import { lang as en } from '../../src/i18n/lang/en-us.ts';

const drafts = new URL('.', import.meta.url);
const packs = new URL('../../src/i18n/lang/', import.meta.url);
const locales = ['ja', 'ko', 'th', 'vi', 'id', 'ar', 'es-es', 'es-mx', 'pt-br', 'fr', 'de', 'it'];

function build(tree, prefix, draft) {
  return Object.fromEntries(
    Object.entries(tree).map(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'string') {
        if (!(path in draft)) throw new Error(`missing ${path}`);
        return [key, draft[path]];
      }
      return [key, build(value, path, draft)];
    }),
  );
}

const identifier = /^[A-Za-z_$][\w$]*$/;
function render(node, depth) {
  const pad = '  '.repeat(depth);
  const lines = Object.entries(node).map(([key, value]) => {
    const name = identifier.test(key) ? key : `'${key}'`;
    return typeof value === 'string'
      ? `${pad}  ${name}: ${JSON.stringify(value)},`
      : `${pad}  ${name}: ${render(value, depth + 1)},`;
  });
  return `{\n${lines.join('\n')}\n${pad}}`;
}

for (const locale of locales) {
  const draft = JSON.parse(readFileSync(new URL(`${locale}.draft.json`, drafts), 'utf8'));
  const source = `import type { langType } from './lang-base';\n\nexport const lang: langType = ${render(build(en, '', draft), 0)};\n`;
  writeFileSync(new URL(`${locale}.ts`, packs), source);
  console.log(`${locale}.ts written`);
}
