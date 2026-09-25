---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

# Grilling

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

## 0. Environment & Interactive Dialog Protocol

- **UTF-8 Encoding on Windows (`chcp 65001`)**:
  On Windows environments, always ensure UTF-8 code page (`chcp 65001 >$null` or `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8`) before running terminal commands, scripts, or logging to guarantee Vietnamese characters display correctly without corruption.
- **Autonomous CLI & Subagent Mode (`claude --dangerously-skip-permissions`)**:
  When invoking Claude Code subagents, background workers, or automated scripts, use `chcp 65001 >$null && claude --dangerously-skip-permissions` to prevent interruptions from permission checkpoints and deliver questions directly to the user.
- **Interactive Question Dialogs (MANDATORY)**:
  **DO NOT print interview questions as static markdown text in chat.** Every question directed to the user MUST be delivered through an interactive dialog/modal tool so the user can easily click/check choices or write responses:
  - **In Antigravity IDE**: Call the `ask_question` tool. This displays an interactive modal popup with selectable radio/checkbox choices, an optional write-in input, and Submit/Skip controls.
    - Prefix the recommended answer with `(Recommended)` and list it first.
    - Set `is_multi_select: true` whenever multiple options may apply so the user can tick multiple checkboxes.
    - Provide concrete, actionable choices.
  - **In Claude Code CLI**: Use the interactive `AskUserQuestion` tool to render terminal select/checkbox prompts for convenient user selection.

## Working the Tree in Rounds

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet.

Ask the frontier using the **interactive question dialog tool** (`ask_question` / `AskUserQuestion`), presenting each open decision with structured choices and your recommendation. Wait for the user's answers before moving to the next round.

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and trigger the next interactive question dialog. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

## Principles

- **Finding facts is your job, never the user's**: When a frontier question needs a fact from the environment (filesystem, active code, configs, git log), dispatch a subagent or use exploration tools to find it; don't ask the user for anything you could look up yourself.
- **Decisions are the user's**: Formulate each decision as a structured question in the interactive modal with distinct options and your recommendation, then wait for user selection.
- **Definition of Done**: The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on the plan until the user confirms shared understanding via the interactive dialog.
