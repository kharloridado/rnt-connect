# Routing — GitHub Issues (default) / Notion / Jira / Slack

How to turn a finding that meets the routing gate into a tracked item and a notification. The destination is **read from project config**, never assumed.

## Step 0 — Resolve the destination

Read from the project's `CLAUDE.md` / `project-context.md`:
```
findings.ticketing     = github | notion | jira     # default: github
findings.ticket_target = <owner/repo + optional Project name | Notion DB | Jira key>
findings.slack_channel = #channel                    # or "none"
findings.gate          = high+ | all
```
If unset, ask once and store it in the `outsystems-project-context` memory.

---

## GitHub Issues (default)

Why default: the code already lives on GitHub, findings stay next to it, and it works on the **private repo** through the `gh` CLI in the Claude Code half of the hybrid workflow — no MCP needed. Requires GitHub CLI **v2.94.0+** (issue types, sub-issues, and dependencies are exposed to `gh` as of that release, June 2026).

### Label taxonomy (create once per repo)
```
finding                      # marks every finding issue
a11y  brand  token  consistency        # finding type
sev:blocker  sev:high  sev:medium  sev:low
status:acknowledged  status:accepted-as-designed  status:fixed-in-design  status:waived
```
`gh label create finding -c "#B60205" -d "Design-conformance finding"` (repeat per label).

### Create a finding issue (always filed as a Bug)
Findings are filed as the **Bug** issue type. Issue types are an org-level feature, so always also apply the `bug` **label** as the reliable fallback (works on any repo, personal or org). Claude.ai writes the payload to `findings/tickets/FND-NNN.md`; Claude Code runs:
```bash
gh issue create \
  --title "FND-001 [a11y/contrast] Primary CTA fails text contrast" \
  --body-file findings/tickets/FND-001.md \
  --label "finding,bug,a11y,sev:high" \
  --type "Bug" \
  --repo <owner/repo>
# --type is ignored if the org hasn't enabled issue types; the bug label still classifies it.
# optional, add straight to a board:
#   --project "<Project name>"
```
Capture the returned issue URL → write it to the register's `Ticket` column.

### Hierarchy & dependencies (optional, gh v2.94.0+)
- Group related findings under a parent epic: `gh issue edit <child#> --parent <epic#> --repo <owner/repo>`.
- Mark a build blocked by an unresolved blocker finding: `gh issue edit <build#> --blocked-by <FND#> --repo <owner/repo>`.

### Disposition lifecycle → issue state + labels
- `acknowledged` → add `status:acknowledged`
- `fixed-in-design` → add `status:fixed-in-design`, re-audit, then `gh issue close <#>`
- `accepted-as-designed` → add `status:accepted-as-designed`, `gh issue close <#> --reason completed`
- `waived` → add `status:waived`, `gh issue close <#> --reason "not planned"`

---

## Notion (alternative)
Resolve the tool with `ToolSearch("notion create page")` first, and confirm it is actually connected — do not assume.
- Title → page title; Severity/Type/Disposition/Location → page properties; body sections → blocks.
- `findings.ticket_target` → the database to create the page in.

## Jira via Rovo (alternative)
Resolve with `ToolSearch("jira create issue")` first, and confirm it is actually connected — do not assume. An Atlassian Rovo connector may be present but unauthenticated, in which case only its `authenticate` tool exists and issue creation will fail.
- Title → summary; body → description; severity → priority (blocker→Highest … low→Low); type → label (`a11y`/`brand`/`token`); `findings.ticket_target` → project key.

---

## Ticket payload (written for every routed finding regardless of destination)

`findings/tickets/FND-NNN.md`:
```markdown
# FND-001 — [accessibility/contrast] Primary CTA fails text contrast

**Severity:** high
**Project:** <Customer> / <Project>
**Location:** Login screen → Primary CTA (Figma node 12:48)

## Observed (as designed)
Label #1A73E8 on background #5B8DEF → contrast 1.9:1.

## Rule
WCAG 2.2 SC 1.4.3 (Contrast Minimum) — requires 4.5:1 for normal text.

## Recommendation (for design / brand owner)
Option A: darken CTA background to #1B4FB8 (white label → 4.6:1).
Option B: keep background, switch label to #FFFFFF (→ 3.1:1, still short — not advised).
This is a brand decision; implementation will not change until design is updated or the deviation is signed off.

## Implementation note
Built exactly as designed (#1A73E8 on #5B8DEF). Finding raised, not auto-corrected.

## Disposition
open
```

---

## Notifications (Slack)

- **GitHub-native (zero connector):** subscribe the channel via GitHub's Slack app —
  `/github subscribe <owner/repo> issues +label:finding`. New finding issues post automatically.
- **Slack connector:** if `findings.slack_channel` is set and the connector is available, post a batched message for `high+`:
```
:rotating_light: *Design findings on <Project>* — <N> new (<X> blocker, <Y> high)
• FND-001 [a11y/contrast, high] Login CTA 1.9:1 → <issue link>
Implementation matches the mockups; these need a design/brand decision.
```
If Slack isn't connected and GitHub's app isn't set up, put this text in the routing result so the user can paste it.

---

## Step — Record the result
Update each finding's `ticket_ref` in `findings/findings-register.md` with the issue URL/key, then report a one-line summary.

## Batching rule
`medium`/`low` findings (under the default `high+` gate) are not individually ticketed — they stay in the register. At the end of a pass, offer a single digest issue ("Token & brand cleanup — <Project>") with the low/medium findings as a checklist or sub-issues.
