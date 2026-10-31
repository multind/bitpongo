import { expect, it } from 'vitest';
import { normalizeWebhookIps } from './webhookIps';

it.each([
  ['', ''],
  [' \n\t ', ''],
  ['192.0.2.1\n198.51.100.2', '192.0.2.1 198.51.100.2'],
  ['0.0.0.0 255.255.255.255', '0.0.0.0 255.255.255.255'],
  ['2001:DB8::1', '2001:db8:0:0:0:0:0:1'],
  ['::', '0:0:0:0:0:0:0:0'],
  ['::1', '0:0:0:0:0:0:0:1'],
  ['2001:0db8:0000:0000:0000:0000:0000:0001', '2001:db8:0:0:0:0:0:1'],
  ['2001:db8:0:1:2:3:4:5', '2001:db8:0:1:2:3:4:5'],
  ['2001:db8:1:2:3:4:5::', '2001:db8:1:2:3:4:5:0'],
  ['192.0.2.1 ::1', '192.0.2.1 0:0:0:0:0:0:0:1'],
] as const)('normalizes allowed exact IPs %j to backend-compatible %j', (input, expected) => {
  expect(normalizeWebhookIps(input)).toBe(expected);
});
it.each([
  'not-an-ip',
  'localhost',
  'example.com',
  '192.0.2.0/24',
  '2001:db8::/32',
  '256.0.0.1',
  '192.00.2.1',
  '127.1',
  '1.2.3.4.5',
  '192.0.2.1:443',
  '192.0.2.1,198.51.100.1',
  '1:2:3:4:5:6:7',
  '1:2:3:4:5:6:7:8:9',
  '1::2::3',
  '1:2:3:4:5:6:7:8::',
  '::ffff:c000:201',
  '::ffff:192.0.2.1',
  'fe80::1%en0',
  '2001:gggg::1',
  ':1:2:3:4:5:6:7',
])('rejects invalid, ranged, scoped or backend-incompatible input %j', (input) => {
  expect(normalizeWebhookIps(input)).toBeNull();
});
it('rejects lists exceeding the backend length limit after IPv6 expansion', () => {
  expect(normalizeWebhookIps(Array(100).fill('::1').join(' '))).toBeNull();
});
