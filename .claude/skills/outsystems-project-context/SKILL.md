---
name: outsystems-project-context
description: Capture and store per-project context (customer name and project name) the first time work begins on a new project. Use this skill at the start of any OutSystems task when no outsystems-project-context memory exists, OR when the user mentions a different customer/project than the one currently in memory. This skill runs alongside (not instead of) the outsystems-onboarding skill.
---

# Per-Project Context Capture

This skill captures lightweight project-level context (customer + project name) separate from the conventions memory. Stored as a memory file so it survives between conversations.

## When to use

Trigger when:
- A new OutSystems task is starting AND no `outsystems-project-context` memory exists
- The user mentions a customer/project name that doesn't match the stored one
- The user explicitly says "new project" / "starting work on [client]"

**Do NOT trigger when:**
- Project context is already stored AND the user is continuing existing work
- The user is asking general OutSystems questions not tied to a specific deliverable

## Distinction from global onboarding

| Skill | Scope | Stored as |
|---|---|---|
| `outsystems-onboarding` | Working conventions | `memory/outsystems-conventions.md` (`type: user`) |
| `outsystems-project-context` | Per-project metadata | `memory/outsystems-project-context.md` (`type: project`) |

Both run independently, and each runs once per project. (On claude.ai, onboarding was account-global; Claude Code's memory directory is per-project, so both are scoped to this repo.)

## The capture flow

### Step 1: Detect from context (silent)

Before asking, scan the conversation for:
- Phrases like "for [Client Name]" / "the [Client] project" / "[Customer] portal"
- Figma URLs (the file name often includes the project)
- Previously mentioned project codenames

If you can confidently infer values, present them as defaults.

### Step 2: Ask minimally (2 questions max)

Use `AskUserQuestion`. Single question if you have a confident guess; two if not. Each needs a short `header` (≤12 chars) and 2–4 options; the tool appends "Other" automatically, which is how free-text names come back.

**Question 1 — Customer name** (`header: Customer`):
- Offer the customer names you can infer as options; anything else arrives via "Other"
- Example: "What customer/client is this project for?"

**Question 2 — Project name** (`header: Project`):
- Offer your best inference as the first option, marked "(Recommended)"
- Example: "What's the project name or codename?"

If you detected the project from a Figma file or URL, make that the first option.

### Step 3: Store in memory

Write a single memory file `outsystems-project-context.md` into the project memory directory named in your system prompt, then add a one-line pointer to `MEMORY.md`.

```markdown
---
name: outsystems-project-context
description: Customer and project name for the OutSystems work in this repo.
metadata:
  type: project
---

- Customer: Acme Corp
- Project: Customer Portal Redesign

Related: [[outsystems-conventions]]
```

### Step 4: Acknowledge and proceed

Brief one-line confirmation:

> "Captured project context: Acme Corp / Customer Portal Redesign. Continuing with your task..."

Then immediately continue with whatever triggered this skill.

## Updating project context

When the user shifts to a new project mid-conversation:
- "We're done with Acme, starting on Globex now" → edit `outsystems-project-context.md` in place, replacing both lines
- "Working on a different client's portal today" → ask which one, then edit the file

When unsure if context applies:
- "Is this still for Acme Corp, or a different client?" → quick check before proceeding

## How other skills should use project context

When generating output, skills can reference project context to personalize:
- Component names can include project prefix if helpful: `acme-card` for Acme Corp
- Style Guide pages can include project header
- Commit messages (via `outsystems-git-helpers`) include project tag

But don't make this context-dependent everywhere — most output should still work without it.

## Forbidden behaviors

- ❌ Don't ask for project context for general questions ("what does ExtendedClass do?")
- ❌ Don't ask repeatedly if the memory file already has the values
- ❌ Don't store sensitive info (NDA contracts, internal pricing, etc.) — only customer name + project name
- ❌ Don't make project context block work — if the user just wants to dive in, capture lazily

## Examples

### Example 1: First conversation, Figma URL shared
```
User: "Audit this Figma file for me: figma.com/design/ABC123/AcmePortal-V2"

Claude: [Detects "AcmePortal" in URL]
        [Calls AskUserQuestion with 'Acme Corp' / 'Acme Portal V2' as first options]
        "Is this for Acme Corp? And the project name — I see 'AcmePortal-V2' in the file — 
         is the project 'Acme Portal V2' or something different?"

User: [confirms or corrects]

Claude: [Writes memory/outsystems-project-context.md + MEMORY.md pointer, proceeds with audit]
```

### Example 2: Generic question, no project context needed
```
User: "What's the difference between Block CSS and Theme CSS?"

Claude: [Skips project context capture — this is a general question]
        [Answers directly]
```

### Example 3: Project switch
```
User: "We're moving to the Globex Industries project now"

Claude: [Edits memory/outsystems-project-context.md in place]
        "Updated — now working on Globex Industries. What's the project name there?"
```
