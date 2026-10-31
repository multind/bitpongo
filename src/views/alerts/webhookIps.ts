/** Normalize the exact-address allowlist before sending it to WebhookService. */
export function normalizeWebhookIps(value: string): string | null {
  if (value.length > 1000) return null;
  const normalized: string[] = [];
  for (const address of value.trim().split(/\s+/).filter(Boolean)) {
    if (/^(0|[1-9]\d{0,2})(\.(0|[1-9]\d{0,2})){3}$/.test(address)) {
      if (address.split('.').some((part) => Number(part) > 255)) return null;
      normalized.push(address);
      continue;
    }
    if (!/^[\da-f:]+$/i.test(address)) return null;
    const halves = address.split('::');
    if (halves.length > 2) return null;
    const left = halves[0] ? halves[0].split(':') : [];
    const right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
    if ([...left, ...right].some((part) => !/^[\da-f]{1,4}$/i.test(part))) return null;
    const missing = 8 - left.length - right.length;
    if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
    const groups = [...left, ...Array<string>(halves.length === 2 ? missing : 0).fill('0'), ...right].map((part) =>
      Number.parseInt(part, 16).toString(16),
    );
    // Java resolves IPv4-mapped IPv6 as IPv4, so its textual equality check rejects these.
    if (groups.slice(0, 5).every((part) => part === '0') && groups[5] === 'ffff') return null;
    normalized.push(groups.join(':'));
  }
  const result = normalized.join(' ');
  return result.length <= 1000 ? result : null;
}
