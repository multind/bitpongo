import { beforeAll, describe, expect, it } from 'vitest';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';

import './index.scss';
import '@/assets/font/iconfont.css';

type FontStyles = {
  root: string;
  plain: string;
  nested: string;
  input: string;
  button: string;
  icon: string;
};

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PROCESS_TIMEOUT_MS = 30_000;

function withTimeout<T>(operation: Promise<T>, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`${label} timed out after ${PROCESS_TIMEOUT_MS}ms.`)), PROCESS_TIMEOUT_MS);
    operation.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

function dumpChromeDom(chrome: ChildProcessWithoutNullStreams): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = '';
    let errorOutput = '';
    let terminationTimeout: ReturnType<typeof setTimeout> | undefined;
    let captured = false;
    let timedOut = false;

    const terminate = () => {
      if (chrome.exitCode !== null || chrome.signalCode !== null) return;
      chrome.kill('SIGKILL');
      terminationTimeout = setTimeout(() => reject(new Error('Chrome font fixture could not be terminated.')), 1_000);
    };

    const timeout = setTimeout(() => {
      timedOut = true;
      terminate();
    }, PROCESS_TIMEOUT_MS);

    chrome.stdout.setEncoding('utf8');
    chrome.stderr.setEncoding('utf8');
    chrome.stdout.on('data', (chunk) => {
      output += chunk;
      if (!captured && output.includes('data-font-results=') && output.includes('</html>')) {
        captured = true;
        terminate();
      }
    });
    chrome.stderr.on('data', (chunk) => (errorOutput += chunk));
    chrome.once('error', (error) => {
      clearTimeout(timeout);
      if (terminationTimeout) clearTimeout(terminationTimeout);
      reject(error);
    });
    chrome.once('close', (exitCode) => {
      clearTimeout(timeout);
      if (terminationTimeout) clearTimeout(terminationTimeout);
      if (captured) {
        resolve(output);
        return;
      }
      if (timedOut) {
        reject(new Error(`Chrome font fixture timed out after ${PROCESS_TIMEOUT_MS}ms: ${errorOutput}`));
        return;
      }
      reject(new Error(`Chrome font fixture exited with ${exitCode} before returning font results: ${errorOutput}`));
    });
  });
}

let runtimeFontStyles: FontStyles;

async function loadCompiledFontStylesInChrome() {
  const virtualModuleId = 'virtual:font-family-runtime';
  const viteServer = await withTimeout(
    createServer({
      appType: 'custom',
      configFile: false,
      root: process.cwd(),
      optimizeDeps: { noDiscovery: true },
      server: { hmr: false, host: '127.0.0.1', port: 0 },
      plugins: [
        {
          name: 'font-family-runtime-fixture',
          configureServer(server) {
            server.middlewares.use((request, response, next) => {
              if (request.url !== '/__font-family-runtime.html') {
                next();
                return;
              }

              response.statusCode = 200;
              response.setHeader('Content-Type', 'text/html; charset=utf-8');
              response.end(`<!doctype html><html><body><script type="module" src="/@id/__x00__${virtualModuleId}"></script></body></html>`);
            });
          },
          resolveId(id) {
            return id === virtualModuleId ? `\0${virtualModuleId}` : undefined;
          },
          load(id) {
            if (id !== `\0${virtualModuleId}`) return undefined;

            return `
            import '/src/styles/index.scss';
            import '/src/assets/font/iconfont.css';

            const fixture = document.createElement('div');
            fixture.innerHTML = \
              '<main data-test="font-root"><p data-test="plain"><span data-test="nested">Normal text</span></p><input data-test="input" value="Input text" /><button data-test="button">Button text</button><i class="iconfont" data-test="icon">&#xe600;</i></main>';
            document.body.append(fixture);

            const fontFamily = (selector) => getComputedStyle(fixture.querySelector(selector)).fontFamily;
            document.body.dataset.fontResults = JSON.stringify({
              root: fontFamily('[data-test=font-root]'),
              plain: fontFamily('[data-test=plain]'),
              nested: fontFamily('[data-test=nested]'),
              input: fontFamily('[data-test=input]'),
              button: fontFamily('[data-test=button]'),
              icon: fontFamily('[data-test=icon]'),
            });
          `;
          },
        },
      ],
    }),
    'Vite font fixture creation',
  );
  let chromeProfile: string | undefined;

  try {
    await withTimeout(viteServer.listen(), 'Vite font fixture startup');
    const address = viteServer.httpServer?.address();
    if (!address || typeof address === 'string') throw new Error('Vite font fixture did not expose a TCP address.');

    chromeProfile = await mkdtemp(join(tmpdir(), 'bitpongo-font-'));
    const page = `http://127.0.0.1:${address.port}/__font-family-runtime.html`;
    const chrome = spawn(CHROME_PATH, [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${chromeProfile}`,
      '--dump-dom',
      page,
    ]);

    const output = await dumpChromeDom(chrome);
    const renderedDocument = new DOMParser().parseFromString(output, 'text/html');
    const result = renderedDocument.body.dataset.fontResults;
    if (!result) throw new Error(`Chrome font fixture returned no font results: ${output}`);
    return JSON.parse(result) as FontStyles;
  } finally {
    try {
      await withTimeout(viteServer.close(), 'Vite font fixture shutdown');
    } finally {
      if (chromeProfile) await rm(chromeProfile, { force: true, recursive: true });
    }
  }
}

beforeAll(async () => {
  runtimeFontStyles = await loadCompiledFontStylesInChrome();
}, PROCESS_TIMEOUT_MS + 5_000);

describe('global application font', () => {
  it('loads compiled SCSS and inherits the native sans-serif stack into normal text and controls', () => {
    expect(runtimeFontStyles.root).toContain('-apple-system');
    expect(runtimeFontStyles.plain).toBe(runtimeFontStyles.root);
    expect(runtimeFontStyles.nested).toBe(runtimeFontStyles.root);
    expect(runtimeFontStyles.input).toBe(runtimeFontStyles.root);
    expect(runtimeFontStyles.button).toBe(runtimeFontStyles.root);
  });

  it('keeps iconfont independent from the normal text inheritance chain', () => {
    expect(runtimeFontStyles.icon).toContain('iconfont');
    expect(runtimeFontStyles.icon).not.toBe(runtimeFontStyles.root);
  });
});
