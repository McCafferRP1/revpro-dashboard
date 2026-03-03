# OpenClaw reference (source of truth)

Use this file to avoid wrong or outdated steps. All commands and paths below are verified against the official docs.

---

## Official install/setup guide

**Installation and setup:** [Learn OpenClaw – Installation](https://learnopenclaw.com/getting-started/installation)

Treat that page as the source of truth for install, onboarding, Gateway, WebChat, and troubleshooting.

---

## Commands and paths (correct for this environment)

- **Config directory:** `~/.openclaw/` (e.g. `C:\Users\<you>\.openclaw\` on Windows, or `~/.openclaw/` in WSL2)
- **Main config file:** `~/.openclaw/openclaw.json`
- **Workspace directory:** `~/clawd/` (assistant’s working directory)

**Install (if needed):**

```bash
npm install -g openclaw
openclaw --version
```

**Onboarding (first-time or reconfigure):**

```bash
openclaw onboard
# Or to update API key / config: openclaw onboard --reconfigure
```

**Run the Gateway:**

```bash
openclaw start
# Or in background: openclaw start --daemon
```

**Manage Gateway:**

```bash
openclaw status
openclaw stop
openclaw logs
openclaw logs --follow
```

**WebChat:** open in browser: **http://localhost:18789**

**Requirements (from official docs):** Node.js 22+, at least one AI provider API key (Anthropic, OpenAI, or Google). On Windows, WSL2 is recommended for fewer compatibility issues.

---

## Upgrading OpenClaw (where to begin)

**Where to run these:** On the host that runs OpenClaw (your UM790 Pro), in a terminal (SSH or local). Not on your main PC.

**Basic upgrade (npm):**

```bash
npm install -g openclaw@latest
openclaw doctor
openclaw stop
openclaw start --daemon
```

Or use the built-in updater (if your install supports it):

```bash
openclaw update
openclaw doctor
# then restart gateway as above
```

**Channels:** `openclaw update --channel stable` (default), `--channel beta`, or `--channel dev`.

**If you were on the old package name** (`clawdbot`): migrate to `openclaw` (see [NPM migration help](https://www.getopenclaw.ai/help/update-stuck-old-version-npm)), then `npm uninstall -g clawdbot`.

**Check version after upgrade:** `openclaw --version`

---

## Decisions / what we've set up

*Use this section to record choices we make (e.g. upgrade cadence, how you run the gateway, sub-agent setup). Update it when something changes.*

- *(Nothing recorded yet.)*

**In future sessions:** A good opening question is: *"What updates have you made to OpenClaw or your setup since we last talked?"* — so we keep this file and the plan in sync with reality.

---

## What you can do purely via Slack vs. on the host (UM790)

*Context: OpenClaw runs on a dedicated host (e.g. UM790 Pro); you talk to Mira over Slack. This section separates what happens in Slack from what must be done on that host.*

### 100% through Slack (prompting Mira, no host access)

- **Sub-agent spawning:** Tell Mira what to do (e.g. “Research X” or “Draft code for Y”). If she’s configured to delegate, she uses the `sessions_spawn` tool herself. No file edits or host commands.
- **Day-to-day tasks:** Anything Mira can do with her current tools (Slack, Google Drive, Sonnet, sub-agent spawns): questions, docs, delegation, synthesis. All via prompts in Slack.
- **You killing sub-agents:** If your Slack channel supports OpenClaw slash commands, **you** type `/subagents list` and `/subagents kill <runId>` or `/subagents kill all` in Slack. That’s you acting in Slack, not Mira editing files or running shell commands.

So: **routine use and sub-agent workflows can be purely Slack** — you prompt, Mira (and sub-agents) do the work; you use slash commands for kill when needed.

### Requires one-time or occasional setup on the host (UM790)

These are done on the machine running OpenClaw (your UM790), e.g. via SSH from your main PC or a local shell on the Mini PC:

- **Installing/updating OpenClaw:** `npm install -g openclaw`, `openclaw onboard`, etc.
- **Gateway lifecycle:** `openclaw start`, `openclaw stop`, `openclaw start --daemon`, `openclaw status`, `openclaw logs`.
- **Editing `openclaw.json`:** Adding channels (e.g. Slack), API keys, `agents.defaults.subagents`, `tools.exec`, etc. Lives under `~/.openclaw/` on the host.
- **Editing personality/behavior files:** SOUL.md, USER.md, IDENTITY.md, etc. They usually live under `~/.openclaw/` or the agent workspace on the host. Until Mira has explicit permission to write there (see below), you edit these on the host.
- **Installing/removing skills:** Often done via config + skills directory on the host, or via slash commands in a channel that supports them (e.g. `/skills install …`). If your Slack integration doesn’t expose those, you do it on the host.

So: **initial setup, config changes, and gateway control** = on the UM790 (or SSH to it). After that, you can stay in Slack for normal use.

### Optional: let Mira run host commands (UM790) from Slack

OpenClaw’s **exec** tool can run shell commands. By default it runs in a **sandbox**, not on the gateway host. If you want Mira to run things like `openclaw stop` / `openclaw start` on the UM790 from Slack:

1. On the **host (UM790)** you must:
   - Set in config (e.g. `openclaw.json`): `tools.exec.host` to `"gateway"` (or per-agent), and configure `tools.exec.security` (e.g. `allowlist`) and optionally `tools.exec.ask` (e.g. `on-miss` for approval).
   - Allowlist the `openclaw` binary (or the paths Mira may run) in the exec allowlist / exec-approvals so she’s allowed to run only those commands.
2. Then Mira could, in principle, run `openclaw stop`, `openclaw start`, or `openclaw restart` when you ask her to “restart the gateway” or “restart sub-agents.” Approval prompts may still appear depending on `ask` and your approval setup.

So: **Mira can execute host commands from Slack only if you explicitly enable gateway exec and allowlist the right commands on the UM790.** Otherwise, gateway start/stop/restart stays a host-side (or SSH) task.

### Optional: let Mira edit her own SOUL.md / behavior

Some setups put SOUL.md (and other bootstrap files) inside the agent’s **workspace** (e.g. `~/.openclaw/workspace/` or `~/clawd/`). If the **read/write** or **apply_patch** tool is allowed and its scope includes that directory, Mira could edit SOUL.md from Slack (e.g. “add a rule: when the user asks for research, spawn a research sub-agent”). In many installs, those files are under `~/.openclaw/` and outside the writable workspace, so editing them from Slack is not available unless you change workspace or tool scope. **Check your actual paths on the UM790** to see if SOUL.md is inside Mira’s writable area.

### Short summary

| Action | Pure Slack (you + Mira)? | Needs host (UM790)? |
|--------|---------------------------|----------------------|
| Ask Mira questions, delegate to sub-agents | Yes | No |
| You: `/subagents kill` / `/subagents list` | Yes (you type in Slack) | No |
| Change SOUL.md / routing rules | Only if SOUL is in her writable workspace | Otherwise: edit on host |
| Gateway start/stop/restart | Only if exec=gateway + allowlist set on host | Otherwise: run on host (or SSH) |
| Install OpenClaw, edit openclaw.json, install skills | No | Yes (one-time or occasional) |

So: **you can run almost everything in normal use purely through Slack.** The host (UM790) is for setup, config, gateway control, and any file edits that live outside what Mira is allowed to write.

---

## Sub-agents crash course (Mira as command center)

*Source: [Learn OpenClaw – Sub-Agents](https://learnopenclaw.com/advanced/sub-agents), [OpenClaw docs – Sub-agents](https://docs.openclaw.ai/tools/subagents).*

### What sub-agents are

- **Sub-agents** = background agent runs that your main agent (Mira) spawns to do a specific task in their **own session**. They run in parallel, then **announce** a result back to Mira’s session.
- Think: Mira = strategist/command center; sub-agents = specialists (e.g. one for dev/coding, one for research). She delegates, they execute, they report back.

### How Mira spawns them

- Mira uses the **`sessions_spawn`** tool (she doesn’t type slash commands; the model calls the tool).
- Key parameters:
  - **`task`** (required) – instruction for the sub-agent (e.g. “Research X”, “Implement feature Y”).
  - **`model`** – which model the sub-agent uses (e.g. `gpt-4o-mini` for cheap research, Sonnet for coding). Saves cost and spreads API load.
  - **`runTimeoutSeconds`** – max run time; after this the run is aborted (important so stuck sub-agents don’t hang forever).
  - **`label`** – optional label for the run (e.g. `"research"`, `"dev"`).
- Defaults (model, timeout) can be set in config under `agents.defaults.subagents` (and per-agent under `agents.list[].subagents`).

### Your architecture: command center + specialists

- **Mira (main agent):** Strategy, routing, light replies, delegating to sub-agents. She stays in her session and uses Sonnet 4.6 for coordination.
- **Sub-agent 1 (dev):** Coding/development tasks. Give it the right skills (e.g. file edit, exec) and optionally a different model.
- **Sub-agent 2 (research):** Research tasks. Give it e.g. web-search and a cheaper/fast model.
- **Pattern:** “Specialist routing” – Mira classifies the request and spawns the right sub-agent with a clear `task`; she only synthesizes results and talks to you.

### Will delegating avoid Mira hitting API walls?

- **Yes, it can help a lot.** API limits are per-session / per-run in practice. If Mira mostly **delegates** (calls `sessions_spawn` and then waits for announces), her session does much less heavy LLM work: a few turns to route + handle results, instead of doing long research or code runs herself. So her token/request usage drops and she’s less likely to hit rate limits.
- **The trade-off:** Sub-agents each have their own sessions and API usage. So the **dev** or **research** sub-agent can hit rate limits instead. That’s often better: one specialist failing is easier to handle than the main coordinator failing.
- **Best practice:** Use a **cheaper/faster model for sub-agents** where possible (e.g. `gpt-4o-mini` for research). That reduces cost and spreads load across providers/models, so no single session does all the heavy lifting.

### Resetting sub-agents when they bug out or hit limits

- **From the docs:** There is no documented **tool** for Mira to kill a sub-agent from inside her run. The **`/subagents kill`** and **`/subagents kill all`** are **slash commands** (you run them in the channel, e.g. Slack). So when a sub-agent is stuck or rate-limited:
  - **You** can run in Slack: `/subagents kill <runId>` or `/subagents kill all` to stop sub-agents and clear the way. Use `/subagents list` first if you need the run id.
  - **Mira** can **set `runTimeoutSeconds`** on every spawn so sub-agents auto-stop after N seconds; that avoids infinite hangs. She can then spawn a fresh sub-agent with the same or updated task.
- So: “Mira executes commands to reset them” = today she can **re-spawn** with a new task (and timeouts prevent permanent hangs). **You** execute the actual **kill** via `/subagents kill` in Slack when you need to force-stop. If OpenClaw adds an agent-callable “kill sub-agent” tool later, Mira could do that too; check release notes.

### Limits to be aware of

- **No sub-sub-agents by default:** Sub-agents cannot spawn their own sub-agents unless you set `agents.defaults.subagents.maxSpawnDepth: 2` (and then only one extra level: orchestrator → workers). So Mira does all task decomposition and spawning; dev/research stay as leaf workers.
- **Concurrency:** `agents.defaults.subagents.maxConcurrent` (default 8) caps how many sub-agent runs can be active at once. Prevents runaway parallel spawns.
- **Per-session children:** `maxChildrenPerAgent` (default 5) limits how many active child runs one session can have. So Mira can’t spawn unlimited dev + research runs at once.
- **Context:** Sub-agents get only what you pass in `task` (they don’t see Mira’s full chat history). Be explicit in the instruction.

### Where to put Mira’s behavior

- In **SOUL.md** (or your agent’s personality/instructions): add a **Task routing** section that tells Mira when to handle something herself vs when to spawn a dev or research sub-agent, and to always set a reasonable `runTimeoutSeconds` (e.g. 300–900). Example idea:
  - “Coding/implementation requests → spawn a sub-agent with task: [detailed instruction], model: claude-sonnet-4-20250514 (or your dev model), runTimeoutSeconds: 600.”
  - “Research requests → spawn a sub-agent with task: [instruction], model: gpt-4o-mini, runTimeoutSeconds: 300.”
  - “If a sub-agent times out or I tell you it failed, suggest the user run /subagents kill all in Slack and then re-spawn with a shorter or simplified task.”

---

## Corrections (vs what Claude or others said)

*Add any corrections here after verifying against the official guide, so you don’t re-apply wrong steps.*

- *(None yet. When Cursor corrects something from a Claude conversation, add it here.)*
