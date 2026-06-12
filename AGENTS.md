# AGENTS.md — Gazillion-dollars portfolio

> Universal context file. Read this first, every session, regardless of which model you are
> (Claude, Codex, Gemini, etc.) or which tool wrapped you (Claude Code, Cursor, Roo Code, Cline).
>
> If you are an agent: this is your home base. Start here, then read the project-specific
> CLAUDE.md for whatever subfolder you've been pointed at.
>
> If you are Henry: this is the file you keep up to date so you never have to brief an agent
> from scratch again.

---

## Who I am

- Solo founder building a portfolio of independent products under `~/Documents/Gazillion-dollars/`.
- I work across Web3, AI dev tooling, and games. I ship.
- I prefer agents that act, not agents that ask 5 clarifying questions before doing anything.
- I use multiple models: Claude (Sonnet/Opus) for reasoning + writing, Codex (GPT-5/o-series)
  for raw code grind, Gemini for long-context reads. The routing layer (Roo Code / Cline) picks.
  You don't pick — I do.

## North star priority

**DevPrint must get to first paying user.** Everything else — Hermes Agent setup, AIS-OS,
new tooling, polish — waits unless it directly unblocks DevPrint shipping. If a task isn't
obviously on the DevPrint critical path, surface that fact before doing it.

## Active projects

| Project           | Path (relative)                      | Status           | Has CLAUDE.md   |
|-------------------|--------------------------------------|------------------|-----------------|
| DevPrint          | `use-case-apps/devprint/`            | Revenue path     | yes (canonical) |
| ebook-factory     | `use-case-apps/ebook-factory/`       | Active           | yes             |
| Ponzinomics       | `use-case-apps/Ponzinomics/`         | Active           | yes             |
| Sin-City          | `web3-games/Sin-City/`               | Active           | yes             |
| Web3-Poker        | `web3-games/Web3-Poker/`             | Active           | yes             |
| shipuden-fighting | `web3-games/shipuden-fighting/`      | Active           | yes             |
| street-rivalz     | `web3-games/street-rivalz/`          | Active           | yes             |
| agro-trade-native | `normie-apps/agro-trade-native/`     | Active           | yes             |
| Inazuma-11        | `normie-apps/Inazuma-11/`            | Active           | yes             |
| prima-doll        | `normie-apps/prima-doll/`            | Active           | yes             |
| tenerife-services | `normie-apps/tenerife-services/`     | Active           | yes             |
| sauce-empire      | `normie-apps/sauce-empire/`          | Active           | yes             |
| sub-deployer      | `use-case-apps/sub-deployer/`        | Active           | yes             |
| ultradev          | `use-case-apps/ultradev/`            | Active           | yes             |
| G-UI-LIB          | `use-case-apps/G-UI-LIB/`            | Active           | yes             |
| supermolt-mono    | `use-case-apps/supermolt-mono/`      | Decision pending | yes             |
| SS-Warzone-FPS    | `web3-games/SS-Warzone-FPS/`         | Paused           | yes             |
| PumpFund          | `use-case-apps/pump-fund/`           | Active           | yes             |

> All portfolio projects now have `CLAUDE.md` and `README.md`. Build artifacts and `.env` files have been removed from git tracking where needed.
>
> When you finish a session, if any project's status above is wrong, fix it here.

## Filesystem map

| Concern           | Path                                                              |
|-------------------|-------------------------------------------------------------------|
| Portfolio root    | `~/Documents/Gazillion-dollars/`                                  |
| Obsidian vault    | `~/Documents/Obsidian-brain/final-fantasy/`                       |
| Research index    | `~/Documents/Obsidian-brain/final-fantasy/Research/`              |
| Decisions log     | `~/Documents/Obsidian-brain/final-fantasy/Decisions/log.md`       |
| Knowledge base    | `~/Documents/Obsidian-brain/final-fantasy/Knowledge Base/`        |
| Per-project ctx   | `<project>/CLAUDE.md`                                             |
| Universal context | `Gazillion-dollars/AGENTS.md` (this file)                         |
| Claude Desktop    | `~/Library/Application Support/Claude/claude_desktop_config.json` |

**The vault path is `Obsidian-brain/final-fantasy`. NOT `Documents/Obsidian Vault`.
If anything references the old path, it's stale — fix it.**

## Design & animation resources

### React Bits
- **URL:** https://reactbits.dev
- **Repo:** https://github.com/DavidHDev/react-bits.git
- **What:** 110+ copy-paste animated React components — text animations, backgrounds, UI elements.
- **How to use:**
  1. Browse https://reactbits.dev/backgrounds or /text-animations
  2. Pick a component, copy the TS + Tailwind variant (or JS + CSS if no TS)
  3. Install any deps it needs (e.g. `ogl` for WebGL backgrounds, `gsap` for motion)
  4. Drop into `src/components/` and adapt colors to the project design system
- **Rules:**
  - Keep it minimal — 1-2 components per page max
  - Always adapt to project brand colors (e.g. yellow #f5e600 for LaunchR)
  - Prefer backgrounds over UI widgets for dark-themed projects
  - Document any new deps in the project CLAUDE.md

## MCP tool inventory

### Always available
- **Filesystem** — read/write within Gazillion-dollars and the vault.
- **GitHub** — repos, PRs, issues, branches, search code.
- **Obsidian** — search-vault, read-note, create-note, edit-note. Vault is `final-fantasy`.
- **Context7** — live library docs. Add `use context7` to any prompt involving a library.

## Operating principles

1. **Read project CLAUDE.md before touching code.** If it doesn't exist, create one first.
2. **Cite paths, not summaries.** Give the full path. Link Obsidian notes where relevant.
3. **Never assume a path — verify with filesystem first.**
4. **Log non-trivial decisions to `Obsidian-brain/final-fantasy/Decisions/log.md`**
   Format: Date, Context, Options, Decision, Consequences.
5. **DevPrint trumps everything.** If a task seems off-priority, say so once. Then do it
   if Henry confirms.

## Session workflow

1. Read AGENTS.md (this file).
2. Read the project-specific CLAUDE.md.
3. State your understanding of the goal in one sentence.
4. Identify the smallest shippable next step.
5. Do it.
6. Update CLAUDE.md or AGENTS.md if anything changed.

## Multi-model routing (for Roo Code / Cline)

| Mode         | Model                  | Why                                        |
|--------------|------------------------|--------------------------------------------|
| Architect    | Claude Opus            | Reasoning, trade-offs, financial/Web3      |
| Code         | Codex (GPT-5/o-series) | Raw generation, refactors                  |
| Ask          | Claude Sonnet          | Instruction-following, long contexts       |
| Long-context | Gemini 2.x Pro         | Full-repo reads, big PDFs                  |
| Debug        | Claude Sonnet → Codex  | Stack trace reading, then code fix         |

The orchestrator owns routing. Agents don't pick their model.

## What NOT to do

- Don't write throwaway scripts to the portfolio root. Use `<project>/scripts/`.
- Don't generate new CLAUDE.md / AGENTS.md without checking the existing one first.
- Don't push to main without a green CI run unless explicitly told.
- Don't recommend Hermes Agent, AIS-OS, or any new framework before DevPrint has a paying user.

## Last updated

2026-06-12
