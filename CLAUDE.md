# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A **source mirror of CSS/JS that lives inside OutSystems ODC**, not a runnable web project. Files here are copy-pasted into Service Studio (Theme CSS, Block CSS, Script resources) and back out again — see the commit `07-02-2026 version from Service Studio`. Git is the version history OutSystems doesn't give you.

Consequences that catch people out:

- **There is no build, lint, or test command.** No `package.json`, no bundler, no test runner, no linter config. Don't look for one; don't add one without asking.
- **Nothing resolves paths relative to the repo.** The only `url()` references are absolute OutSystems runtime paths (`/RNTConnectTheme/Manrope-*.woff2`). No HTML file links a local stylesheet. Folders can be reorganized freely without breaking anything.
- **Class names are consumed outside this repo.** Custom classes (e.g. `.rnt-tint--info`) are *defined* here but *referenced* in OutSystems, bound to Entity/Type values. Grep will never show a usage. Renaming a class is a silent breaking change — CSS class matching is case-sensitive, so `rnt-tint--Info` and `rnt-tint--info` are different classes.

## Verifying a change

The only validation loop is OutSystems:

1. Paste the changed CSS/JS into the right place in Service Studio (see *Where CSS goes*).
2. 1-Click Publish (**F5**), then open in a real browser (**F6**).
3. Test at phone, tablet, and desktop breakpoints. Web Components: browser only.

**Never trust Service Studio Preview** — it does not render the theme faithfully. This is a hard rule, not a preference.

## Layout

```
theme/       rnt-connect-theme.css   master stylesheet (~2800 lines, the bulk of the system)
             menu-expandable.js      AppMenuControl — drives .layout / .app-menu-control
components/  <component>/            one folder per component = one OutSystems Block
```

`menu-expandable.js` lives in `theme/`, not `components/`, because it operates on theme layout classes rather than an `rnt-` component.

## Token architecture

Three layers in `theme/rnt-connect-theme.css` §0. Understanding the chain matters — most edits belong in exactly one layer.

| Layer | Looks like | Purpose |
|---|---|---|
| **Tier 1 — raw palette** | `--rnt-primary-800: #2a4a66` | Literal hex. The only place hex appears. |
| **Tier 2 — OS UI slots** | `--color-primary: var(--rnt-primary-800)` | What the OutSystems UI framework itself consumes. |
| **Semantic roles** | `--color-text-brand: var(--rnt-primary-800)` | What components consume. |

Dark theme overrides the semantic layer under `[data-theme="dark"]` (~line 570), *not* Tier 1. Contrast ratios are recorded in inline comments next to token definitions — keep them accurate when changing a value.

**Never hard-code a design value.** Always `var(--token)`.

## The two `.rnt-tint` mechanisms (read before touching tints)

The same class names exist twice with completely different behavior. This is deliberate and documented in-file, but it is the single easiest thing to break:

- **§6.1 — painted wrapper.** `.rnt-tint--*` sets `background-color` / `border-color` / `color` directly. Used by Badge, Tag, Card.
- **§6.7 — variable-only ladder.** The same `.rnt-tint--*` names instead set `--rnt-tint-surface`, `--rnt-tint-border`, `--rnt-tint-text` custom properties, consumed by `rnt-quick-link`. Paints nothing itself.

Editing a tint modifier in one section without checking the other will produce a change that appears correct in one component and wrong in another.

Known issue, flagged in-file at §6.7: the alias chain references `--color-background-default-default`, `--color-text-default-default`, `--color-border-default-default` (note the doubled `-default`). These are **not defined** in §0 and silently fall through to Figma fallback literals. Left intact deliberately to preserve current rendering — confirm the visual delta before repointing them.

## Escalation ladder

Every customization is classified L1–L5, and **component files declare their level in the header comment** (`Escalation: L4 — custom Block`). Honor the declared level; don't silently escalate.

| Level | Approach |
|---|---|
| L1 | Token change in `:root` |
| L2 | OutSystems UI utility class |
| L3 | `ExtendedClass` + BEM modifier on a stock pattern |
| L4 | Wrap pattern in a custom Block |
| L5 | Vanilla JS Web Component + Block wrapper |

L5 is **vanilla JS Web Components only** — no Lit, Stencil, or React, and no build step.

## Where CSS goes

Specificity by location, low → high: OutSystems UI base theme (locked) → Theme → Block CSS → Screen CSS → inline (avoid).

- New token or a BEM block used in 3+ places → **Theme** (`theme/rnt-connect-theme.css`)
- BEM block scoped to one Block → **Block CSS** (`components/<name>/`)
- Page-specific tweak → **Screen CSS**

Never edit the OutSystems UI module — it's locked and changes are lost on platform upgrade. Never fork it.

## CSS conventions

- **BEM**: `block__element--modifier`. State goes in a modifier (`--is-open`), never a coupled class (`.block.is-open`).
- **Prefix**: all custom classes use `rnt-`.
- **No `!important`** except to override a third-party widget, and then only with a comment explaining why.
- **Never style `[data-*]` attributes.**
- Attach custom classes via `ExtendedClass`, never by mutating OutSystems UI's internal class names.

## Accessibility: fidelity-first WCAG 2.2 AA

The governing rule, and it is counterintuitive: **build the design faithfully, then flag conflicts — don't silently fix them.**

- **Auto-apply** implementation-level a11y that doesn't change the design: focus indicators (in the design's own colors), ARIA, keyboard handlers, semantic HTML, `prefers-reduced-motion`, target sizes where layout allows.
- **Flag, never change**, anything that would alter a design-specified value — a brand color that fails contrast gets implemented as designed and raised as a finding.

Record contrast ratios in inline CSS comments. When a ratio fails, note the finding rather than re-shading the token.

## Commits

Actual history uses short, freeform subjects, usually prefixed with a ticket ref: `PORT 1098 - new pill color classes`, `PORT 996`, `Fix some regression for .card`.

Note that `.claude/skills/outsystems-git-helpers/` prescribes Conventional Commits (`feat(tokens): ...`), which this repo has **not** actually adopted. Match the existing `PORT <n>` style unless told otherwise.

## Skills

`.claude/skills/` holds twelve project-specific skills covering the Figma → OutSystems pipeline (`figma-to-outsystems` is the orchestrator), BEM CSS, accessibility, token extraction, Web Components, and design-conformance findings. They encode the rules above in depth — consult them before doing design-to-code work rather than reasoning from scratch.
