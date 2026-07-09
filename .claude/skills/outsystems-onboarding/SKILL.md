---
name: outsystems-onboarding
description: One-time onboarding to detect and store the user's OutSystems frontend conventions (class prefix, default environment, spacing scale, token naming style). Use this skill ONLY when no prior onboarding has occurred (no outsystems-conventions memory exists) AND any other OutSystems skill is about to trigger. Once complete, conventions are stored as a memory file and this skill never needs to run again for this project.
---

# Conventions Onboarding

Captures the conventions that apply to all OutSystems work in this project. For per-project context (customer, project name), see `outsystems-project-context`.

> **Scope note.** This skill was written for claude.ai, where memory is account-global and onboarding ran exactly once per account. In Claude Code the memory directory is **per-project**, so this runs once per repo. If you want these conventions to be genuinely global across every repo, put them in `~/.claude/CLAUDE.md` instead of the project memory file described below.

## When to use

Use this skill ONLY in these conditions:
- Another OutSystems skill is about to trigger
- AND no prior onboarding has happened (no `outsystems-conventions` memory)

If the conventions memory already exists, **skip this skill entirely**.

## What this captures (4 things)

1. **Class prefix** — e.g., `acme-`, `mycorp-`, `brand-`
2. **Default environment** — O11 / ODC / Both
3. **Spacing base unit** — 4pt / 8pt
4. **Token naming style** — OutSystems UI standard / Custom prefix / Other

## Hybrid flow: auto-detect first

### Step 1: Scan conversation context (silent)

Before asking anything, look for:
- CSS the user has shared → extract prefix pattern (look for repeated `^\.\w{2,6}-`)
- `:root` declarations → extract token naming convention
- Mentions of "O11", "ODC", "Reactive Web" → infer environment
- Spacing values `8px`, `4px`, `16px` → infer base unit

If detected with confidence, present as defaults; otherwise ask.

### Step 2: Ask minimally

Use `AskUserQuestion` with 1–4 questions depending on what was detected. Each question needs a short `header` (≤12 chars) and 2–4 options; the tool appends an "Other" choice automatically, so free-text answers arrive through that.

**If nothing detected, ask all 4:**

| Question | `header` | Options |
|---|---|---|
| Class prefix | `Prefix` | Offer the 2–3 most likely prefixes you can infer from the repo; the user's custom prefix comes back via "Other" |
| Default environment | `Environment` | O11 / ODC / Both |
| Spacing base | `Spacing` | 4pt / 8pt |
| Token naming | `Tokens` | OutSystems UI standard / Custom prefix |

If some were detected, only ask for the missing ones.

### Step 3: Store in memory

Write a single memory file `outsystems-conventions.md` into the project memory directory named in your system prompt, then add a one-line pointer to `MEMORY.md`.

```markdown
---
name: outsystems-conventions
description: OutSystems frontend conventions for this project — class prefix, environment, spacing base, token naming style.
metadata:
  type: user
---

- Class prefix: `acme-`
- Environment: ODC
- Spacing base: 8pt
- Token naming: OutSystems UI standard

Related: [[outsystems-project-context]]
```

Other skills find this by its `description`, which is matched during recall — recalled memories arrive automatically in `<system-reminder>` blocks, so they will usually not need to read the file at all.

### Step 4: Brief acknowledgment, continue

> "Saved: `acme-` prefix, ODC environment, 8pt spacing, OutSystems UI tokens. These won't be asked again."

Then immediately continue with the original task — don't make the user re-prompt.

## What this does NOT capture

- Customer name / project name → that's `outsystems-project-context`
- Accessibility preferences → WCAG 2.2 AA is the default (handled by `outsystems-accessibility`)
- Figma file URLs → captured per-project if relevant

## Updating conventions later

If the user says "actually my prefix is X" or "switch to ODC default":
1. Edit `outsystems-conventions.md` in place — update the affected line, don't create a second memory file
2. Brief acknowledgment: "Updated — using X going forward"

## Forbidden behaviors

- ❌ Don't ask onboarding questions if the conventions memory already exists
- ❌ Don't ask for project-specific info (customer/project name) — that's a separate skill
- ❌ Don't run onboarding for casual questions ("what does ExtendedClass do?")
- ❌ Don't ask more than 4 questions
- ❌ Don't make the user repeat their request — chain directly into the task

## Examples

### Example 1: Nothing detected
```
User: "Generate CSS for a card component"

Claude: [No conventions memory, no patterns detected]
        [Calls AskUserQuestion with all 4 questions]

User: [taps answers: acme-, ODC, 8pt, OutSystems UI standard]

Claude: [Writes memory/outsystems-conventions.md + MEMORY.md pointer]
        "Saved: acme- prefix, ODC environment, 8pt spacing, OutSystems UI tokens."
        [Continues with the CSS generation using these values]
```

### Example 2: Partial detection from prior CSS
```
User: [Shares some CSS earlier using `.acme-card { ... }`]
User: "Generate CSS for a button"

Claude: [Detected prefix `acme-` from prior CSS. Conventions partial.]
        [Asks only 3 questions: environment, spacing, token style]

User: [answers]

Claude: [Writes all 4 into memory/outsystems-conventions.md, including the detected prefix]
        [Generates button CSS]
```
