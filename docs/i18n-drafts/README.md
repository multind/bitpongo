# H5 translation review drafts

These flat catalogs are review inputs, not runtime language packs. Do not add them to the language menu as-is. The source is `src/i18n/lang/en-us.ts` at `0e68001`.

- `es-ES` and `es-MX`: locally generated Spanish drafts, with reviewed wording for selected trading and account-security messages. Each draft has all 809 source keys and preserves interpolation placeholders.
- The other full drafts are generated offline and include the manually written account copy. `core-overrides.json` records reviewed corrections for weekday labels and selected trading terms. These corrections do not constitute a full linguistic review.
- `../i18n-core-glossary.json`: common terms for all twelve requested locales.
- The `*.account.draft.json` files contain hand-written translations for all `login`, `register`, and `security` keys. These are partial catalogs; keep their wording when generating the remaining keys.
- `../i18n-spanish-overrides.json`: Spanish review corrections to apply again if the drafts are regenerated.
- `regional-overrides.json`: corrections from the 2026-11-11 review against `zh-cn.ts`, plus per-region wording. Apply it last with `node docs/i18n-drafts/apply-regional.mjs`; it updates both the full and the account drafts. See `accuracy-review-2026-11-11.md` for the findings.

## Regional style

Where the English and Chinese sources differ in meaning, follow the Chinese. Per region:

- `ja`: です/ます. `ko`: 하세요/했습니다. `th`: polite, no particles. `vi`: "bạn". `id`: "Anda". `ar`: Modern Standard Arabic.
- `es-ES`: tú, "Introduce", "importe", "rentabilidad", "Ajustes". `es-MX`: tú, "Ingresa", "monto", "rendimiento", "Configuración".
- `pt-BR`: você, "corretora". `fr`: vous, straight apostrophes. `de`: du throughout, lowercase (as Binance, OKX and German fintech apps do). `it`: tu, straight apostrophes.
- The "Me" tab name must match the navigation paths in `fng.exchangeMissing` and `wizard.deliveryHelp`.

Before release, review the full copy in each region, especially order direction, position closing, trading cycles, account deletion, and risk disclosures. Validate placeholder counts and weekday lists against the current source, then test real layouts including right-to-left Arabic. A structural pass alone is not approval to publish.

Run `node docs/i18n-drafts/check.mjs --all` from the frontend checkout to require all twelve full catalogs and validate them and the account-only drafts against the current English source.

For local UI review, start the frontend with `VITE_PREVIEW_LOCALES=true npm run dev` and choose a language from Me or Preferences. Do not set this build flag in production until the review below is complete. English remains the fallback for the separate legal pages.

## Integration checks beyond the main catalog

- Language selection: update both the Preferences page and the language sheet on the Me page, and test stored preferences on reload.
- Notifications: the API client and native push registration use the same locale normalization. The notification settings page has separate catalogs under `src/views/member/notice`. On 2026-11-11 all twelve catalogs in `push-copy-locales.json` were retranslated from the Chinese copy, following the regional style above; they still need native review. The internal diagnostics panel remains hidden.
- Legal copy: the Terms of Service and privacy policy have separate catalogs. See [the source review checklist](legal-source-review.md) before translating either document; track that review separately from the 809 UI keys.
- Mobile components: the installed NutUI package supplies only English, Indonesian, Simplified Chinese, and Traditional Chinese catalogs. Review calendar and picker text instead of assuming that translating the app's own catalog also translates those controls.
- Arabic: check RTL layout on real screens; keep market symbols, API identifiers, prices, and dates readable inside right-to-left copy.
