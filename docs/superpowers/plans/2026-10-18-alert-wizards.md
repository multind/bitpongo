# Alert Wizards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing long alert creation forms with the approved, design-led step flows without changing backend capabilities.

**Architecture:** Keep form state and API operations in the existing Vue pages. Share a presentational step header/footer and wizard styles; retain existing alert validation and Webhook credential lifecycle.

**Tech Stack:** Vue 3, TypeScript, vue-i18n, Vitest, Vue Test Utils, SCSS.

**Spec:** `docs/superpowers/specs/2026-10-18-alert-wizards.md`

## Global Constraints

- Preserve existing Bitpongo style and APIs, all price precision and frequency choices.
- Signing keys are shown once and never persisted in browser storage.
- No unsupported delivery providers, billing, futures or batch-price creation.
- Three languages: zh-CN, zh-TW and en-US; preserve user-owned Dockerfile and existing unrelated changes.
- Do not commit, push or deploy as part of this implementation.

## Review Focus

- Back navigation preserves filled values, including a pair supplied by the market page.
- Invalid decimal bounds or past expiry block advancement without a write request.
- Editing cannot save before the existing record is loaded successfully.
- Failed writes keep the final review and entered values available for retry.
- Unconfigured Webhook activation does not block draft saves or expose misleading success/credentials.

## Task 1: Price alert wizard

**Files:** Modify `src/views/alerts/create.vue`, `create.spec.ts`; create `src/views/alerts/components/WizardSteps.vue`, `src/views/alerts/wizard.scss`; modify `src/i18n/lang/{lang-base,en-us,zh-cn,zh-tw}.ts`.

**Interfaces:** `WizardSteps` consumes `step: number` and `labels: string[]`, rendering an accessible ordered progress list. The alert page retains the existing `AlertCreate` payload and create/update API signatures.

- [x] Add failing UI tests for five-step navigation, hidden future fields, validation gates, back preservation, query-symbol context, precise range submission, edit prefill/load failure and failed-save retry. Assert no create/update before final confirmation.
- [x] Run `npm test -- src/views/alerts/wizard.spec.ts --maxWorkers=2`; verify failures concern missing wizard behavior. Original regressions retained in create.spec.ts.
- [x] Implement the shared progress display/styles and price wizard. Keep final submit validation authoritative, disable advancement while loading, and use existing API success navigation only after successful submission.
- [x] Add all new labels to the three locale modules and lang-base typing.
- [x] Rerun the price tests and type check; require all passing before task 2.

## Task 2: Webhook wizard

**Files:** Modify `src/views/alerts/webhook.vue`, `webhook.spec.ts` and the same locale files; reuse task 1's progress display/styles.

**Interfaces:** Preserve `WebhookDraft`, `WebhookRule`, `WebhookActivation`, existing list/edit/revoke and activation confirmation. Step 5 distinguishes saved draft from activated credentials.

- [x] Add failing tests for name gating, keyword/IP input preservation through back/next, final-only save, failed-save retry, edit prefill and draft save while activation is unavailable. Retain configured endpoint-host tests and add one-time credential dismissal coverage.
- [x] Run `npm test -- src/views/alerts/webhook.spec.ts --maxWorkers=2`; verify missing-flow failures.
- [x] Implement the five steps and explicit save result, keeping list management accessible and activation separate. Separate a successful write from a failed list refresh so retries cannot accidentally create duplicate drafts.
- [x] Rerun both wizard test files; require all passing.

## Task 3: Verification and review

- [x] Run `npm test -- --maxWorkers=2`, `npm run typecheck`, `npm run build`, targeted ESLint and `git diff --check`.
- [x] Use production preview with API fixtures to inspect both flows at 320px and 390px in all three languages. Check overflow, sticky controls, keyboard accessibility, error retry and credential dismissal without real production writes.
- [x] Request a read-only independent code review; fix substantive findings and rerun affected checks. No Critical/Important issues; IP validation remains backend-side (deferred frontend usability improvement).
- [x] Report implemented scope, verification and any remaining gaps. Leave changes uncommitted for the user.
