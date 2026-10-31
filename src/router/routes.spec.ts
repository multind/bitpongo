import { describe, expect, it } from 'vitest';

import routes from './routes';

describe('public routes', () => {
  it('uses page-owned headers for market and alert lists and provides a separate asset chart route', () => {
    const children = routes.find((route) => route.path === '/')!.children!;
    expect(children.find((route) => route.path === 'market')?.meta).toMatchObject({ pageHeader: true });
    expect(children.find((route) => route.path === 'alerts')?.meta).toMatchObject({ pageHeader: true });
    expect(children.find((route) => route.path === 'market/:symbol')?.meta).toMatchObject({ title: 'market.candles' });
  });
  it('exposes the privacy policy without requiring an account', () => {
    const publicShell = routes.find((route) => route.path === '/');
    const privacyRoute = publicShell?.children?.find((route) => route.path === '/privacy');

    expect(privacyRoute).toMatchObject({
      name: 'privacy',
      path: '/privacy',
      meta: {
        title: 'privacy.title',
        border: true,
      },
    });
  });
});
