# Legal copy: source review before translation

The current English, Simplified Chinese, and Traditional Chinese documents remain unchanged. The items below are a product and engineering review checklist, not approved replacement legal text.

| Item | Existing copy | What to verify before translation |
| --- | --- | --- |
| Strategy scope | Terms section 1 describes automated recurring buys. | The API also implements F&G strategies (`FngStrategyController` and `FngExecutionService`). Confirm which strategy types and capabilities the public terms should describe. |
| Notifications | Terms sections 1, 2, 4 and 6 refer to Bark. Privacy section 1 also covers native FCM/APNs. | `TelegramReminderService`, `WebhookReminderService` and the native push implementation exist. Confirm which channels are enabled in production, what the app stores, and what is sent to each provider before updating the disclosure. |
| Profile images | Privacy section 1 lists account data without explicitly mentioning profile images. | The API has `UserAvatarController` and `UserAvatarService`. Confirm the deployed upload, visibility, storage and deletion behavior before describing it. |
| Account deletion | Both documents send users to Account settings. | Verify the current UI route and email verification flow on the deployed version. Do not infer retention periods or backup behavior from the UI. |

Review `src/views/login/agreement-content.ts` and `src/views/privacy/content.ts` together. Once the source is approved, keep section and list ordering, contact URL, age threshold, and dates aligned across translations. Review risk statements, negation, permission boundaries, and deletion/retention wording against the approved source before wiring any draft to the public routes.
