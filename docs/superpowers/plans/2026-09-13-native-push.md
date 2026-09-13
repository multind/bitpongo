# Native Push Implementation Plan

**Goal:** Add native push preferences, session lifecycle and authenticated notification navigation.

**Architecture:** Versioned Flutter bridge keeps device tokens native. Vue synchronizes account context and consumes validated notification opens only after authentication and router readiness. Existing authenticated HTTP client manages preferences and devices.

**Spec:** Shared native-push-contract.md supplied by coordinator.

- [x] Extend bridge commands with bounded fallbacks; regression test unsupported bridges.
- [x] Add typed settings API and localized settings screen, explicit permission actions, queued tests and device revocation.
- [x] Synchronize restored and changed sessions; clear native state on logout and unauthorized responses.
- [x] Validate/deduplicate account-scoped notification opens and reload mounted plan details when id changes.
- [x] Update privacy disclosures in all three languages.
- [x] Run Vitest, typecheck and build; record Chrome fixture and temporary disk limitations in coordinator report.

Implementation keeps legacy Bark component and regression tests off the primary route. Native network commands have bounded 45-second waits; status compatibility probe settles within 1.5 seconds. Explicit current-device removal sends revokeDevice=true; explicit permission/enable action re-enables a removed device.
