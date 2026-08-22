import vue from '@vitejs/plugin-vue';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { constants } from 'node:fs';
import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { createServer } from 'vite';

type FontStyles = {
  root: string;
  plain: string;
  nested: string;
  input: string;
  button: string;
  textarea: string;
  select: string;
  icon: string;
  toast: string;
};

const CHROME_PATH_ENV = 'BITPONGO_CHROME_PATH';
const PROCESS_TIMEOUT_MS = 30_000;
const TEST_TIMEOUT_MS = PROCESS_TIMEOUT_MS * 5;

function chromeExecutableNames() {
  return process.platform === 'win32'
    ? ['chrome.exe', 'chromium.exe', 'google-chrome.exe']
    : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];
}

function commonChromeLocations() {
  if (process.platform === 'darwin') {
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      ...(process.env.HOME
        ? [
            join(process.env.HOME, 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
            join(process.env.HOME, 'Applications/Chromium.app/Contents/MacOS/Chromium'),
          ]
        : []),
    ];
  }

  if (process.platform === 'linux') {
    return [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
    ];
  }

  if (process.platform === 'win32') {
    const installationRoots = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA].filter(
      (value): value is string => Boolean(value),
    );
    return installationRoots.flatMap((root) => [
      join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      join(root, 'Chromium', 'Application', 'chrome.exe'),
    ]);
  }

  return [];
}

async function isExecutable(path: string) {
  try {
    await access(path, process.platform === 'win32' ? constants.F_OK : constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function resolveChromeExecutable() {
  const configuredPath = process.env[CHROME_PATH_ENV]?.trim();
  if (configuredPath) {
    if (await isExecutable(configuredPath)) return configuredPath;
    throw new Error(
      `${CHROME_PATH_ENV} points to an unavailable executable: ${configuredPath}. Set it to an executable Chrome or Chromium binary.`,
    );
  }

  const pathCandidates = (process.env.PATH ?? '')
    .split(delimiter)
    .filter(Boolean)
    .flatMap((directory) => chromeExecutableNames().map((name) => join(directory, name)));
  const candidates = [...pathCandidates, ...commonChromeLocations()];
  for (const candidate of candidates) {
    if (await isExecutable(candidate)) return candidate;
  }

  throw new Error(
    `Could not find Chrome or Chromium for ${process.platform}. Set ${CHROME_PATH_ENV} to an executable browser path. Searched: ${candidates.join(', ') || '(no PATH entries or platform locations)'}.`,
  );
}

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
  const chromeExecutable = await resolveChromeExecutable();
  const viteServer = await withTimeout(
    createServer({
      appType: 'custom',
      configFile: false,
      root: process.cwd(),
      optimizeDeps: { noDiscovery: true },
      server: { hmr: false, host: '127.0.0.1', port: 0 },
      resolve: { alias: { '@': join(process.cwd(), 'src') } },
      plugins: [
        vue(),
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
              response.end(
                `<!doctype html><html><body><div id="app"></div><script type="module" src="/@id/__x00__${virtualModuleId}"></script></body></html>`,
              );
            });
          },
          resolveId(id) {
            return id === virtualModuleId ? `\0${virtualModuleId}` : undefined;
          },
          load(id) {
            if (id !== `\0${virtualModuleId}`) return undefined;

            return `
            import '/src/main.ts';

            const fixture = document.createElement('div');
            fixture.innerHTML = \
              '<main data-test="font-root"><p data-test="plain"><span data-test="nested">Normal text</span></p><input data-test="input" value="Input text" /><button data-test="button">Button text</button><textarea data-test="textarea">Textarea text</textarea><select data-test="select"><option>Select text</option></select><i class="iconfont" data-test="icon">&#xe600;</i><div class="nut-toast" data-test="toast">Toast text</div></main>';
            document.body.append(fixture);

            const fontFamily = (selector) => getComputedStyle(fixture.querySelector(selector)).fontFamily;
            document.body.dataset.fontResults = JSON.stringify({
              root: fontFamily('[data-test=font-root]'),
              plain: fontFamily('[data-test=plain]'),
              nested: fontFamily('[data-test=nested]'),
              input: fontFamily('[data-test=input]'),
              button: fontFamily('[data-test=button]'),
              textarea: fontFamily('[data-test=textarea]'),
              select: fontFamily('[data-test=select]'),
              icon: fontFamily('[data-test=icon]'),
              toast: fontFamily('[data-test=toast]'),
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
    const chrome = spawn(chromeExecutable, [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${chromeProfile}`,
      '--dump-dom',
      page,
    ]);

    let output: string;
    try {
      output = await dumpChromeDom(chrome);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Chrome or Chromium executable "${chromeExecutable}" failed: ${message}`, { cause: error });
    }

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
}, TEST_TIMEOUT_MS);

const originalChromePath = process.env.BITPONGO_CHROME_PATH;
const originalProcessPath = process.env.PATH;

afterEach(() => {
  if (originalChromePath === undefined) delete process.env.BITPONGO_CHROME_PATH;
  else process.env.BITPONGO_CHROME_PATH = originalChromePath;

  if (originalProcessPath === undefined) delete process.env.PATH;
  else process.env.PATH = originalProcessPath;
});

describe('global application font', () => {
  it('loads compiled SCSS and inherits the native sans-serif stack into normal text and controls', () => {
    expect(runtimeFontStyles.root).toContain('-apple-system');
    expect(runtimeFontStyles.plain).toBe(runtimeFontStyles.root);
    expect(runtimeFontStyles.nested).toBe(runtimeFontStyles.root);
    expect(runtimeFontStyles.input).toBe(runtimeFontStyles.root);
    expect(runtimeFontStyles.button).toBe(runtimeFontStyles.root);
    expect(runtimeFontStyles.textarea).toBe(runtimeFontStyles.root);
    expect(runtimeFontStyles.select).toBe(runtimeFontStyles.root);
  });

  it('maps NutUI toast text to the application font stack', () => {
    expect(runtimeFontStyles.toast).toBe(runtimeFontStyles.root);
  });

  it('keeps iconfont independent from the normal text inheritance chain', () => {
    expect(runtimeFontStyles.icon).toContain('iconfont');
    expect(runtimeFontStyles.icon).not.toBe(runtimeFontStyles.root);
  });
});

describe('Chrome executable resolution', () => {
  it(
    'honors an explicit executable override and explains how to correct an invalid value',
    async () => {
      const missingChrome = join(tmpdir(), 'bitpongo-missing-chrome');
      process.env.BITPONGO_CHROME_PATH = missingChrome;

      await expect(loadCompiledFontStylesInChrome()).rejects.toThrow(
        `BITPONGO_CHROME_PATH points to an unavailable executable: ${missingChrome}`,
      );
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'resolves the platform-specific Chrome executable discovered on PATH without launching it',
    async () => {
      const executableDirectory = await mkdtemp(join(tmpdir(), 'bitpongo-fake-chrome-'));
      const executableName = chromeExecutableNames()[0];
      const executablePath = join(executableDirectory, executableName);

      await writeFile(executablePath, '', { mode: 0o755 });
      delete process.env.BITPONGO_CHROME_PATH;
      process.env.PATH = executableDirectory;

      try {
        await expect(resolveChromeExecutable()).resolves.toBe(executablePath);
      } finally {
        await rm(executableDirectory, { force: true, recursive: true });
      }
    },
    TEST_TIMEOUT_MS,
  );
});
