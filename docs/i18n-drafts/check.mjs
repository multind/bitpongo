import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { baseCompile } from '@intlify/message-compiler';
import { lang } from '../../src/i18n/lang/en-us.ts';

function flatten(tree, prefix = '') {
  return Object.fromEntries(
    Object.entries(tree).flatMap(([key, value]) => {
      const path = prefix + key;
      return typeof value === 'string' ? [[path, value]] : Object.entries(flatten(value, path + '.'));
    }),
  );
}

const directory = new URL('.', import.meta.url);
const source = flatten(lang);
const tokens = (message) => (message.match(/\{[\w-]+\}/g) ?? []).sort();
const catalogs = readdirSync(directory).filter((file) => file.endsWith('.draft.json'));
assert.ok(catalogs.length, 'No drafts found');
if (process.argv.includes('--all')) {
  const expected = ['ar', 'de', 'es-es', 'es-mx', 'fr', 'id', 'it', 'ja', 'ko', 'pt-br', 'th', 'vi'];
  const full = catalogs.filter((file) => !file.endsWith('.account.draft.json'));
  assert.deepEqual(full.sort(), expected.map((locale) => locale + '.draft.json'), 'Incomplete set of full catalogs');
}
const readCatalog = (file) => JSON.parse(readFileSync(new URL(file, directory), 'utf8'));

for (const file of catalogs) {
  const draft = readCatalog(file);
  const accountOnly = file.endsWith('.account.draft.json');
  const keys = Object.keys(source).filter((key) => !accountOnly || /^(login|register|security)\./.test(key));
  assert.deepEqual(Object.keys(draft).sort(), keys.sort(), file + ': source key mismatch');
  for (const key of keys) {
    const label = file + ': ' + key;
    assert.equal(typeof draft[key], 'string', label);
    if (source[key].trim()) assert.ok(draft[key].trim(), label + ': empty translation');
    assert.deepEqual(tokens(draft[key]), tokens(source[key]), label + ': placeholder mismatch');
    assert.doesNotMatch(draft[key], /⁇|QZX|XZQ/i, label + ': unresolved model token');
    baseCompile(draft[key], { onError: (error) => assert.fail(label + ': ' + error.message) });
  }
  if (!accountOnly) {
    assert.equal(draft['frequency.weekDays'].split(',').filter((day) => day.trim()).length, 7, file + ': weekday labels');
    const accountFile = file.replace('.draft.json', '.account.draft.json');
    if (catalogs.includes(accountFile)) {
      for (const [key, value] of Object.entries(readCatalog(accountFile))) {
        assert.equal(draft[key], value, file + ': curated copy changed for ' + key);
      }
    }
  }
  console.log(file + ': ' + keys.length + ' keys checked');
}
