import { describe, expect, it } from 'vitest';

import routes from './routes';

describe('public routes', () => {
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
