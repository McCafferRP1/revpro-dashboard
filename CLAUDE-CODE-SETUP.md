# Claude Code + Cursor: Side-by-Side Setup

Use **Claude Code** (Anthropic’s terminal coding agent) next to **Cursor’s built-in agent**. Cursor stays your IDE; Claude Code runs in the terminal and can connect to Cursor via the extension.

---

## Step 1: Install Claude Code (Windows)

In **PowerShell** (Run as user, no admin needed):

```powershell
irm https://claude.ai/install.ps1 | iex
```

**Other options:**

- **WinGet:** `winget install Anthropic.ClaudeCode`
- **Git Bash:** On Windows, Claude Code works best in Git Bash. Install [Git for Windows](https://git-scm.com/downloads/win) if you don’t have it. You can set:  
  `$env:CLAUDE_CODE_GIT_BASH_PATH="C:\Program Files\Git\bin\bash.exe"`

After install, **close and reopen your terminal**, then check:

```powershell
claude doctor
```

---

## Step 2: Sign in to Claude Code

You need one of:

- **Claude Pro or Max** (recommended): [claude.ai/pricing](https://claude.ai/pricing) — one subscription for Claude on the web and Claude Code.
- **Claude Console:** [console.anthropic.com](https://console.anthropic.com/) with billing enabled — use OAuth when Claude Code asks.

Then in the terminal:

```powershell
claude
```

Follow the prompts to sign in (browser OAuth or Console).

---

## Step 3: Install the Claude Code extension in Cursor

So Claude Code can talk to Cursor (files, diffs, edits), install its extension in Cursor.

**3a. Get the VSIX path**

- **If you used the npm install:**  
  `%USERPROFILE%\.claude\local\node_modules\@anthropic-ai\claude-code\vendor\claude-code.vsix`
- **If you used native/WinGet install:**  
  After running `claude` at least once, check whether the VSIX exists at the path above. If not, install once via npm to get the VSIX, then keep using the native `claude` binary:
  ```powershell
  npm install -g @anthropic-ai/claude-code
  ```
  Then use the path above.

**3b. Install the extension in Cursor**

In PowerShell (replace with your actual path if different):

```powershell
cursor --install-extension "$env:USERPROFILE\.claude\local\node_modules\@anthropic-ai\claude-code\vendor\claude-code.vsix"
```

If `cursor` isn’t in your PATH, use the full path to Cursor’s executable, then `--install-extension` and the VSIX path.

**3c. Restart Cursor** fully (quit and open again).

**3d. Confirm:** **View → Extensions** — “Claude Code” should appear as installed.

---

## Step 4: Use them side by side

| What you use | Where |
|--------------|--------|
| **Cursor agent** | Cursor chat (e.g. Cmd/Ctrl+L), Composer, inline edits — Cursor’s AI. |
| **Claude Code** | Cursor’s **integrated terminal**: run `claude` in the project folder. |

**Typical workflow:**

1. Open your project in Cursor.
2. Open the integrated terminal (**Ctrl+`**).
3. Run: `claude`
4. In Claude Code, type **`/ide`** to connect to Cursor (so it can read/edit files and show diffs).
5. Use Cursor’s chat/Composer for one flow, and the terminal for Claude Code in parallel.

**Shortcut (after extension is installed):** **Ctrl+Escape** (Windows) opens the Claude Code panel in Cursor.

---

## Quick reference

- **Claude Code docs:** [code.claude.com/docs](https://code.claude.com/docs/en/setup)
- **Check install:** `claude doctor`
- **Reconnect to IDE from terminal:** `/ide` inside a Claude Code session
- **Updates:** Native install updates itself; WinGet: `winget upgrade Anthropic.ClaudeCode`

You don’t need a separate Cursor AI subscription to use Claude Code; a Claude Pro/Max (or Console) account is enough for Claude Code in the terminal.
