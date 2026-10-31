# Chart Alert and Delivery Selection Plan

**Goal:** Restore chart price selection and per-alert notification selection without disrupting existing alerts.

**Architecture:** Preserve null channel settings as legacy account defaults. Explicit selections are stored on each price alert and applied when the event is queued, with account-level consent and delivery availability still enforced. Chart selection maps a deliberate user interaction to a bounded price and pre-fills the existing wizard. Email remains a five-minute unconfirmed follow-up, not an immediate message.

**Tech Stack:** Vue 3, TypeScript, Java, Spring JDBC, MySQL, Flyway, Vitest, JUnit.

**Spec:** User-approved conversation design on 2026-10-31.

## Global Constraints

- Keep existing alerts, account preferences, admin notifications, inbox events, and unrelated notification types compatible.
- Never present an unavailable channel as operational or silently override a disabled account setting.
- Do not change production data or deploy without request; preserve existing workspace changes.

## Review Focus

- Old clients omit channels and retain legacy behavior.
- Select none, unsupported channels and duplicates are validated deliberately.
- Editing or copying preserves explicit selections; in-flight events use the selection at triggering time.
- Disabling a channel after queueing still respects account consent on delivery.
- Pointer selection handles resize and chart bounds; manually entered values remain editable.

## Tasks

1. Add and run backend regression tests for legacy and explicit selection; implement migration, CRUD, event fanout and email follow-up selection.
2. Add and run frontend tests for selectable available channels, edit/review persistence, and disabled configuration explanations; implement localized controls.
3. Add and run chart-coordinate tests and route prefill tests; implement bounded chart price selection with an accessible alternative.
4. Run targeted frontend/backend tests and type checks, inspect mobile layout if available, and report remaining verification gaps.
