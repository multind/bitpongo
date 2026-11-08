# H5 translation review drafts

These flat catalogs are review inputs, not runtime language packs. Do not add them to the language menu as-is. The source is `src/i18n/lang/en-us.ts` at `0e68001`.

- `es-ES` and `es-MX`: locally generated Spanish drafts, with reviewed wording for selected trading and account-security messages. Each draft has all 809 source keys and preserves interpolation placeholders.
- `../i18n-core-glossary.json`: common terms for all twelve requested locales.
- `../i18n-spanish-overrides.json`: Spanish review corrections to apply again if the drafts are regenerated.

Before release, review the full copy in each region, especially order direction, position closing, trading cycles, account deletion, and risk disclosures. Validate placeholder counts and weekday lists against the current source, then test real layouts including right-to-left Arabic. A structural pass alone is not approval to publish.
