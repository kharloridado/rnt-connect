# Findings Register — R&T Deposit Solutions / R&T Connect
> Next ID: FND-003

| ID | Type | Sev | Location | Observed | Rule | Recommendation | Disposition | Ticket |
|---|---|---|---|---|---|---|---|---|
| FND-001 | accessibility/contrast | high | AddUser → text inputs & textareas (Figma Admin/Frame 439) | Resting border #d9d9d9 on #ffffff → 1.41:1; dark #444444 on #1e1e1e → 1.71:1 | WCAG 2.2 SC 1.4.11 (Non-text Contrast) — 3:1 for control boundaries | Darken resting border to ≥3:1 (#767676 light / #6e6e6e dark), or accept the deviation on the basis that hover/focus carry the affordance | open | [#3](https://github.com/kharloridado/rnt-connect/issues/3) |
| FND-002 | accessibility/contrast | medium | AddUser → disabled text inputs (`--color-neutral-3`) | Disabled border #d9d9d9 — identical to resting in light; *brighter* than resting (#444444) in dark | No SC violated (disabled controls are exempt from SC 1.4.11) — state ambiguity | Specify a distinct disabled border in Figma; `--color-neutral-3` is not overridden under `[data-theme="dark"]`, which inverts enabled/disabled emphasis | open | [#4](https://github.com/kharloridado/rnt-connect/issues/4) |
