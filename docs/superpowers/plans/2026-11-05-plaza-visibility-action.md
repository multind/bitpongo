# Strategy Plaza Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Move DCA/F&G public visibility to the strategy detail action bar and make the server honor withdrawal.

**Architecture:** Reuse the existing visibility API and locale strings in a shared action component. Use one visibility policy for the plaza list and direct public detail; preserve already deployed Flyway scripts.

**Tech Stack:** Vue, NutUI, Vitest; Spring, MySQL, Flyway, Maven.

**Spec:** [策略广场展示操作](../specs/2026-11-05-plaza-visibility-action-design.md)

## Global Constraints

- Preserve existing pause, stop, and delete semantics. Use backend-confirmed state. Do not deploy.
- Keep the already applied `V39__reminder_email.sql` and `V40__telegram_binding.sql` unchanged.

## Review Focus

- Explicit false beats an official mark; an unconfigured ordinary strategy is private.
- Direct detail must not disclose withdrawn strategies.
- Dismissing confirmation makes no update; failed saves do not change the button.
- Changing the strategy while a request is pending must not apply the old response to the new strategy.
- Bottom actions remain visible without covering scroll content on narrow layouts in all supported languages.

### Task 1: Backend visibility and migrations

- [ ] Add failing cases to `bitpongo-api/src/test/java/com/multind/bitpongo/preset/PresetControllerContractTest.java` or its MySQL-backed companion: DCA and F&G, list and direct detail, explicit false with official mark, missing row for ordinary strategy, and explicit true. Verify the failing assertions.
- [ ] In `bitpongo-api/src/main/java/com/multind/bitpongo/preset/PresetService.java`, make explicit visibility authoritative and only fall back to official when no row exists. Preserve the owner checks. Verify the owner's returned visibility matches that policy.
- [ ] In `bitpongo-api/src/main/resources/db/migration`, verify the current production migration baseline, then renumber the colliding, unapplied visibility and F&G stop-loss scripts to unique versions after the latest existing migration. Verify empty-schema and production-baseline upgrade paths without touching production.
- [ ] Run the targeted contract/integration tests and `./mvnw test`; commit the verified backend changes.

### Task 2: Frontend bottom action and confirmation

- [ ] Add a Vitest test for the shared action covering confirmation cancellation, successful publish and withdraw, save failure, and late responses after a strategy change. Verify failures before implementation.
- [ ] Replace `src/components/PlazaVisibilitySwitch.vue` with `src/components/PlazaVisibilityAction.vue` with the same `type` and `strategyId` props and API in `src/api/presets.ts`. Reuse the existing dialog copy and add translated action labels in `src/i18n/lang/{lang-base,zh-cn,zh-tw,en-us}.ts`. Keep the button disabled until the current state loads and while saving.
- [ ] Wire it into `src/views/list/details/PlanDetails.vue` and `src/views/fng/details.vue`, removing the old placements. On narrow screens, check each action stays readable and that tab content scrolls clear of the safe-area-aware bar.
- [ ] Run `npm test` and `npm run build`; commit verified frontend changes.
