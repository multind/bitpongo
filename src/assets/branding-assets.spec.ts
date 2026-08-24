import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const PNG_SIGNATURE = '89504e470d0a1a0a';

function readPng(relativePath: string) {
  const buffer = readFileSync(resolve(process.cwd(), relativePath));

  expect(buffer.subarray(0, 8).toString('hex')).toBe(PNG_SIGNATURE);

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25],
    sha256: createHash('sha256').update(buffer).digest('hex'),
  };
}

describe('Bitpongo 品牌资产', () => {
  it('页面 Logo 与 App 已批准主图标完全一致', () => {
    const logo = readPng('src/assets/logo.png');

    expect(logo).toMatchObject({
      width: 1024,
      height: 1024,
      bitDepth: 8,
      colorType: 2,
      sha256: 'ac8a7390c0d2d15ece6bca0f887f9095a31eabc0ade5b99ca19d46642c357229',
    });
  });

  it('favicon 是同一批准图标的 128 像素版本', () => {
    const favicon = readPng('public/favicon.png');

    expect(favicon).toMatchObject({
      width: 128,
      height: 128,
      bitDepth: 8,
      colorType: 2,
      sha256: 'e606329bb4cf6aefd14b5e58fd19f8d9ae3aa54852593984fd9b475bc8bf0f5e',
    });
  });

  it('现有品牌入口继续引用统一资源', () => {
    const member = readFileSync(resolve(process.cwd(), 'src/views/member/index.vue'), 'utf8');
    const about = readFileSync(resolve(process.cwd(), 'src/views/member/about/index.vue'), 'utf8');
    const list = readFileSync(resolve(process.cwd(), 'src/views/list/index.vue'), 'utf8');
    const login = readFileSync(resolve(process.cwd(), 'src/views/login/index.vue'), 'utf8');
    const register = readFileSync(resolve(process.cwd(), 'src/views/register/index.vue'), 'utf8');
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

    expect(member).toContain('../../assets/logo.png');
    expect(about).toContain('../../../assets/logo.png');
    expect(list).toContain('../../assets/logo.png');
    expect(login).toContain('../../assets/logo.png');
    expect(register).toContain('../../assets/logo.png');
    expect(html).toContain('href="/favicon.png"');
  });
});
