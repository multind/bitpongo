# Price Alert Wizard Improvements Implementation Plan

**Goal:** Make the five-step price alert form easier to understand and visually consistent with Bitpongo.

**Architecture:** Retain the existing wizard, form model, validation and APIs. Improve the Vue template and scoped wizard styling, and add localized help copy to each supported language pack.

**Tech Stack:** Vue 3, TypeScript, SCSS, vue-i18n, Vitest.

**Spec:** The five-step design approved in the conversation on 2026-10-31.

## Global Constraints

- Preserve five steps, create/edit behavior, validation and API payloads.
- Support simplified Chinese, traditional Chinese and English.
- Preserve existing user changes; do not commit without a request.

## Review Focus

- Channel conditions show two bounds and accurate explanatory copy.
- Candle frequency explains the selected interval without implying incorrect trigger behavior.
- Optional expiry remains optional and reflects the actual timezone semantics.
- Narrow screens and long translated text do not overflow or obscure navigation.
- Review reflects the actual selected values, including delivery and optional expiry.

### Task 1: Copy, layout and regression coverage

**Files:** `src/views/alerts/create.vue`, `src/views/alerts/wizard.scss`, `src/views/alerts/components/WizardSteps.vue`, `src/i18n/lang/{lang-base,zh-cn,zh-tw,en-us}.ts`, `src/views/alerts/wizard.spec.ts`.

- [ ] Inspect validation, scheduling semantics and current tests before drafting explanations.
- [ ] Add tests for visible localized help on each step and relevant conditional fields; verify they fail.
- [ ] Implement concise accurate help and improve field, progress, review and button hierarchy while preserving behavior.
- [ ] Run wizard tests, locale consistency tests and typecheck.
- [ ] Check the wizard at narrow mobile widths and report any verification limitations.
