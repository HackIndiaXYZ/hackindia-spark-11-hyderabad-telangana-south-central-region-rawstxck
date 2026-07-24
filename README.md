# hackindia-spark-11-hyderabad-telangana-south-central-region-rawstxck
Hackathon team repository for rawstxck - [hackindia-team:hackindia-spark-11-hyderabad-telangana-south-central-region:rawstxck]

<div align="center">

# SecurePush

### Your AI agent writes fast. Someone should watch before it ships.

![Status](https://img.shields.io/badge/status-hackathon%20build-E8A33D?style=flat-square&labelColor=0D0F0E)
![Node](https://img.shields.io/badge/CLI-Node.js%20%2B%20TypeScript-3ECF8E?style=flat-square&labelColor=0D0F0E)
![Web](https://img.shields.io/badge/Web-Next.js%20%2B%20Supabase-3ECF8E?style=flat-square&labelColor=0D0F0E)
![License](https://img.shields.io/badge/license-MIT-8B948E?style=flat-square&labelColor=0D0F0E)
![HackIndia](https://img.shields.io/badge/HackIndia-Spark--11-E5484D?style=flat-square&labelColor=0D0F0E)

</div>

---

## The Problem

More and more code starts as AI-agent output — Claude Code, Cursor, Codex, Copilot — not a human typing line by line. These agents are fast, but they're not careful: they leave hardcoded API keys in config files, invent npm packages that don't exist, and write insecure auth patterns that no one reviews before they hit a real repository.

Most solo developers and small teams don't have a security engineer sitting between "AI wrote it" and `git push`. Right now, that gap is empty.

## What SecurePush Does

SecurePush is a git pre-push hook that sits between your machine and GitHub. Every time you push, it scans exactly what changed, shows you what it found, and only lets clean code through.

```
you write code (or your AI agent does)
        │
        ▼
   git push
        │
        ▼
  ┌───────────────────────────────────┐
  │  SecurePush intercepts             │
  │                                     │
  │  🔴 src/config.js:8                │
  │     Hardcoded API key found         │
  │                                     │
  │  🟡 Proposed fix:                  │
  │     const key = process.env.API_KEY │
  │                                     │
  │  [ Accept ]   [ Reject ]           │
  └───────────────────────────────────┘
        │
        ▼  (accepted fixes committed)
   tests run
        │
   ┌────┴────┐
   ▼         ▼
 pass      fail
   │         │
   ▼         ▼
 pushed   blocked, nothing reaches GitHub
```

Nothing gets silently deleted or force-applied. A rejected fix is logged as a warning and the flow continues; a failing test is a hard stop, no exceptions.

**And it remembers.** Every finding is retained per-repo, so by your tenth push, SecurePush isn't just reviewing your code — it's telling you _"you've hardcoded API keys three times this week."_ No other tool in this space currently does that.

## Why It's Different

We looked. Every adjacent tool does one slice of this well — never all of it.

|                            | AI Fix Proposed | Visual Accept/Reject | Auto Test + Push Gate | Multi-Provider | Persistent Memory |
| -------------------------- | :-------------: | :------------------: | :-------------------: | :------------: | :---------------: |
| ai-git-hooks               |       ❌        |          ❌          |        Partial        |       ✅       |        ❌         |
| no-mistakes                |       ✅        |          ❌          |          ✅           |    Partial     |        ❌         |
| GitGuardian                |       ❌        |          ❌          |     Secrets only      |      N/A       |        ❌         |
| Snyk / SonarQube / Semgrep |       ❌        |          ❌          |          ✅           |      N/A       |        ❌         |
| **SecurePush**             |       ✅        |          ✅          |          ✅           |       ✅       |        ✅         |

We're not claiming to have invented AI code review. We're claiming to be the first to put all four of these in one provider-agnostic tool that gets smarter about _your_ repo over time. Full landscape in [`docs/02_Competitive_Landscape.md`](docs/02_Competitive_Landscape.md).

## Tech Stack

**CLI** — Node.js + TypeScript · Commander.js · `@clack/prompts` · simple-git · `diff` + chalk · js-yaml

**Web** — Next.js · Supabase (Auth + Postgres) · Tailwind CSS · deployed on Vercel

**Shared infrastructure** — [CascadeFlow](#) for cost/latency-aware model routing (Groq → Gemini/Claude escalation → Ollama for fully local/offline mode) and [Hindsight](#) for persistent, repo-specific memory.

## Quick Start

```bash
# clone and install
git clone https://github.com/<your-org>/securepush.git
cd securepush/cli
npm install

# set up in any git repo you want protected
npx securepush init

# choose your provider: Groq / Gemini / Ollama (local) / Claude / SecurePush Cloud
npx securepush config

# that's it — the next git push in this repo gets scanned automatically
git push
```

Bring your own API key, or run fully local via Ollama if your code can't leave your machine.

## Project Structure

```
securepush/
├── cli/     — the pre-push hook + scan/fix/test/push engine
├── web/     — dashboard: login, history, near-miss insights
└── docs/    — PRD, TRD, app flow, schema, design reference, implementation plan
```

Full docs index in [`docs/`](docs/) — start with [`docs/01_PRD.md`](docs/01_PRD.md) if you want the complete picture.

## Who This Is For

Solo developers, indie hackers, and small teams (2–15 people) who lean on AI coding agents heavily and have no formal review process. Not enterprises — GitGuardian and Snyk already own that segment, and we're not trying to take it from them.

## The Team

Built by [Your Name] and [Teammate Name] for **HackIndia Spark-11**, CBIT Hyderabad — August 7–8, 2026.

## License

MIT — see [`LICENSE`](LICENSE).

---

<div align="center">

_Your AI agent writes fast. This makes sure someone — even if it's another AI — is actually watching before it ships._

</div>
