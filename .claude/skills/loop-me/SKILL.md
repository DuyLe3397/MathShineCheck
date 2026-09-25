---
name: loop-me
description: Grill me about specs for the workflows I want to build, within this workspace.
disable-model-invocation: true
argument-hint: "A workflow to design, or nothing to go find one"
---

# Loop-Me

Run a stateful `/grilling` session whose only output is **workflow** specs. Use the grilling discipline (relentless, a round of questions at a time, a recommended answer attached to each) aimed at the vocabulary and goal below. Create, edit, and delete specs as the grilling resolves things.

## 0. Environment & Interactive Dialog Protocol

- **UTF-8 Encoding on Windows (`chcp 65001`)**:
  Ensure UTF-8 code page (`chcp 65001 >$null` or `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8`) before running terminal commands or scripts so Vietnamese text in workflow notes and question dialogs is never corrupted.
- **Autonomous CLI & Subagent Mode (`claude --dangerously-skip-permissions`)**:
  When executing subagents or background CLI tasks, run with `chcp 65001 >$null && claude --dangerously-skip-permissions` to keep the interactive question loop unobstructed.
- **Interactive Question Dialogs (MANDATORY)**:
  **DO NOT print workflow discovery questions as raw markdown in chat.** Every question must be presented using the interactive modal tool:
  - **In Antigravity IDE**: Call the `ask_question` tool with structured options, marking recommended options with `(Recommended)` and setting `is_multi_select: true` when multiple selections apply.
  - **In Claude Code CLI**: Use the `AskUserQuestion` tool to prompt interactive radio/checkbox options in the terminal.

## The loop lens

A **loop** is a recurring pattern in the user's life: their career, their week, their morning, a single repeated activity. Picturing a life as loops within loops reveals how predictable its activities really are, which is what makes them worth **delegating**. Use the lens to find loops worth specifying, and propose ones the user hasn't noticed.

A **workflow** is the spec of one loop, made real. You run a workflow on a loop: the loop is its running instantiation. Workflows live in `workflows/*.md` and are the source of truth.

## Vocabulary

A shared language, reached for only when a workflow calls for it: never a checklist. **Mandate nothing structural**: a workflow needs no AI, no checkpoint, and no schedule unless the grilling shows it does.

- **Trigger**: what fires each run, an **event** (a new email, a new issue) or a **schedule** (every morning). Event-triggering is usually the more efficient.
- **Checkpoint**: a human-in-the-loop point where the user is asked to verify or decide. Some workflows have none and run autonomously; some use no AI at all.
- **Push right**: defer the checkpoint as far as it will go. Do maximal work before involving the human, so they are asked once, late, with everything prepared.
- **Brief**: what a checkpoint presents, a tight, decision-ready summary (what was produced, why, and a link down to the asset itself), never the raw output. The user reads a brief, not a draft. Speed of review is imperative.

## Definition of done

A workflow spec is done when an implementer agent could build it without asking a single question. Grill until then; nothing is done while a question remains.

## The workspace

- `workflows/*.md`: one spec per workflow.
- `NOTES.md`: raw notes on the user's world, the tools they use, the channels they process, and their own terminology for both. When it is empty or thin, interview them about their world before specifying anything. Sharpen fuzzy terms into canonical ones as they surface, and record them here.
