# @botchain/init-toolkit

Single-command bootstrap that turns Claude Code, Codex, Cursor, and Windsurf
into specialized BOT Chain engineering agents. Installs:

1. **A progressive skill directory** (`skills/botchain-skill-engine/`) into
   every supported IDE's global skills folder.
2. **A local MCP server** (`mcp-server/`) exposing 11 tools for environment
   checks, contract compilation/deployment, transfers, and explorer lookups.

## Install

```bash
npx github:manueldezman/botchain-init-toolkit --global
```

This copies the skill into `~/.claude/skills/`, `~/.codex/skills/`, and
`~/.cursor/skills/`, and registers the MCP server in each tool's config
(Claude Desktop/Code, Cursor, Windsurf configs as JSON; Codex's
`config.toml`).

Windsurf is handled differently. Instead of copying a skill folder into an
unverified `~/.windsurf/skills/` path, the installer writes a condensed
Rules block to Windsurf's best-effort global rules location and, when run
inside a project, also writes `.windsurf/rules/botchain-skill-engine.md`.
The installer always prints the manual fallback path: Settings → Cascade →
Rules.

Other flags:

```bash
npx github:manueldezman/botchain-init-toolkit --dry-run     # show what would happen, write nothing
npx github:manueldezman/botchain-init-toolkit --skip-mcp    # install skill files only
```

## Documentation gaps found in BOT Chain's official docs

While building this, I audited `dev-docs.botchain.ai` directly and found
several real issues (broken links, a wrong RPC method name on the
paymaster page, an invalid JSON example, contradictory faucet
instructions, and more) — see `FEEDBACK.md` for the full list, formatted
for the PR/Bug/Optimization submission track.

This toolkit's own reference docs (`skills/botchain-skill-engine/references/`)
are written defensively around those gaps — e.g. `rpc-endpoints.md` and
`migration.md`.
## After installing

The installer writes blank values for the network env vars. Before using any
chain tool, set them — either in your shell, or by editing the MCP entry the
installer added to your tool's config:

```
BOTCHAIN_RPC_URL=...
BOTCHAIN_CHAIN_ID=...
BOTCHAIN_EXPLORER_API=https://scan.bohr.life
BOTCHAIN_PRIVATE_KEY=...      # testnet-only dev key. Never a mainnet key.
```

Restart your IDE/agent so it picks up the new skill and MCP server, then try:

> "Check the BOT Chain balance for 0x..."
> "Deploy a simple storage contract to BOT Chain testnet"

## Project layout

```
bin/            the npx installer (bin/install.js)
skills/         the SKILL.md + references/ + assets/ loaded by each IDE
mcp-server/     the MCP server (11 tools, see mcp-server/README.md)
```

See `mcp-server/README.md` for the tool list and how to run/test the server
standalone, and `skills/botchain-skill-engine/SKILL.md` for how the agent is
instructed to use it.

## Safety notes

- `execute_terminal_cmd` only runs an allow-listed set of binaries
  (`forge`, `npx`, `npm`, `which`, `git`) via `execFile` with an argv array —
  there is no shell string parsing, so there's no shell-injection surface.
- Every side-effecting tool (`deploy_contract`, `send_transaction`,
  `batch_transfer`, and anything that installs software) is documented in
  `SKILL.md` as requiring the user's explicit approval in the conversation.
  The server itself doesn't gate on that — the calling agent is expected to
  ask first, same as any other MCP tool.
- The toolkit targets the BOT Chain **testnet** by default. Nothing points
  at mainnet unless you configure it to.

## License

MIT-0 — free to use, modify, and redistribute. No attribution required.
