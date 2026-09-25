---
name: grill-with-docs
description: A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.
disable-model-invocation: true
---

# Grill-With-Docs

A relentless interview to sharpen a plan or design, which also creates docs (ADRs and glossary) as decisions settle.

## Environment & Interactive Dialog Protocol

- **UTF-8 Encoding on Windows (`chcp 65001`)**:
  Ensure UTF-8 code page (`chcp 65001 >$null` or `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8`) before running terminal commands or scripts so Vietnamese text in prompts, choices, and document templates is never corrupted.
- **Autonomous CLI & Subagent Mode (`claude --dangerously-skip-permissions`)**:
  When executing subagents or background CLI tasks, run with `chcp 65001 >$null && claude --dangerously-skip-permissions` to keep the interactive question loop unobstructed.
- **Interactive Question Dialogs (MANDATORY)**:
  **DO NOT print interview questions as raw markdown in chat.** Every question must be presented using the interactive modal tool:
  - **In Antigravity IDE**: Call the `ask_question` tool with structured options, marking recommended options with `(Recommended)` and setting `is_multi_select: true` when multiple selections apply.
  - **In Claude Code CLI**: Use the `AskUserQuestion` tool to prompt interactive radio/checkbox options in the terminal.

Call the Skill tool twice, for "grilling" and "domain-modeling".
