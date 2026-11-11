// Applies regional-overrides.json to the full and account drafts.
// Run from the frontend checkout: node docs/i18n-drafts/apply-regional.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const directory = new URL('.', import.meta.url);
const read = (file) => JSON.parse(readFileSync(new URL(file, directory), 'utf8'));
const write = (file, data) => writeFileSync(new URL(file, directory), JSON.stringify(data, null, 2) + '\n');
const overrides = read('regional-overrides.json');
const files = readdirSync(directory).filter((file) => file.endsWith('.draft.json'));

for (const file of files) {
  const locale = file.replace(/(\.account)?\.draft\.json$/, '');
  const draft = read(file);
  let changed = 0;
  const set = (key, value) => {
    if (key in draft && draft[key] !== value) {
      draft[key] = value;
      changed++;
    }
  };
  if (overrides._normalizeApostrophe.includes(locale)) {
    for (const key of Object.keys(draft)) set(key, draft[key].replaceAll('’', "'"));
  }
  for (const [key, [from, to]] of Object.entries(overrides._replace[locale] ?? {})) {
    if (key in draft) set(key, draft[key].replaceAll(from, to));
  }
  for (const [key, value] of Object.entries(overrides[locale] ?? {})) set(key, value);
  write(file, draft);
  console.log(`${file}: ${changed} changed`);
}
