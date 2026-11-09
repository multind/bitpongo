# H5 translation review drafts

These flat catalogs are review inputs, not runtime language packs. Do not add them to the language menu as-is. The source is `src/i18n/lang/en-us.ts` at `0e68001`.

- `es-ES` and `es-MX`: locally generated Spanish drafts, with reviewed wording for selected trading and account-security messages. Each draft has all 809 source keys and preserves interpolation placeholders.
- The other full drafts are generated offline and include the manually written account copy. `core-overrides.json` records reviewed corrections for weekday labels and selected trading terms. These corrections do not constitute a full linguistic review.
- `../i18n-core-glossary.json`: common terms for all twelve requested locales.
- The `*.account.draft.json` files contain hand-written translations for all `login`, `register`, and `security` keys. These are partial catalogs; keep their wording when generating the remaining keys.
- `../i18n-spanish-overrides.json`: Spanish review corrections to apply again if the drafts are regenerated.

Before release, review the full copy in each region, especially order direction, position closing, trading cycles, account deletion, and risk disclosures. Validate placeholder counts and weekday lists against the current source, then test real layouts including right-to-left Arabic. A structural pass alone is not approval to publish.

Run `node docs/i18n-drafts/check.mjs --all` from the frontend checkout to require all twelve full catalogs and validate them and the account-only drafts against the current English source.

For local UI review, start the frontend with `VITE_PREVIEW_LOCALES=true npm run dev` and choose a language from Me or Preferences. Do not set this build flag in production until the review below is complete. English remains the fallback for the separate legal pages.

## Integration checks beyond the main catalog

- Language selection: update both the Preferences page and the language sheet on the Me page, and test stored preferences on reload.
- Notifications: the API client and native push registration use the same locale normalization. The notification settings page has separate catalogs under `src/views/member/notice`. Its visible title, save/test actions, device states, no-trade explanation, queued confirmation, and registration-failure instructions received targeted review; the remaining generated strings still need linguistic review. The internal diagnostics panel remains hidden.
- Legal copy: the Terms of Service and privacy policy have separate catalogs. See [the source review checklist](legal-source-review.md) before translating either document; track that review separately from the 809 UI keys.
- Mobile components: the installed NutUI package supplies only English, Indonesian, Simplified Chinese, and Traditional Chinese catalogs. Review calendar and picker text instead of assuming that translating the app's own catalog also translates those controls.
- Arabic: check RTL layout on real screens; keep market symbols, API identifiers, prices, and dates readable inside right-to-left copy.
