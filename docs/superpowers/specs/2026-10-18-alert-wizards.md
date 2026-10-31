# Alert creation wizard design

Approved in chat on 2026-10-18. References: `/Users/zhangcong/Downloads/Bitpongo/创建快速*.png` and `webhook*.png`.

- Keep the existing Bitpongo warm background, typography, components and supported APIs.
- Price alert: name/pair → condition and target/range → notification preference explanation → frequency/interval/expiry → review and submit. Preserve query-symbol context and edit prefill.
- Webhook: name/description → keywords → IP restrictions → notification explanation → save result. Activation remains a separate explicit action with rotation confirmation; signing key is displayed only once and never persisted in browser storage.
- Show a numbered progress bar and previous/next controls. Returning to a previous step must preserve input. Validate each relevant step; only the final explicit submit sends a write request. Errors retain input for retry. Show success only after the write succeeds.
- Keep all existing price precision, expiry and frequency behavior; do not add unsupported custom messages, providers, billing, futures or multi-price batch rules.
- Keep Webhook list/edit/revoke functionality and allow saving drafts when activation is unavailable.
- Localize new copy in Simplified Chinese, Traditional Chinese and English. Support narrow mobile screens and accessible form labels/errors.
