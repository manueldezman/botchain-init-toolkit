# botchain-mcp-server

Local MCP server exposing BOT Chain tools to any MCP-compatible agent. Built
on the official `@modelcontextprotocol/sdk`, transported over stdio.

## Run standalone

```bash
cd mcp-server
npm install
cp .env.example .env   # then fill in BOTCHAIN_RPC_URL etc.
npm start
```

## Test

```bash
npm test
```

Runs `test/smoke-test.js`, which spawns the server as a real MCP client would,
lists all 11 tools, and calls a couple of them to confirm clean error
messages when no RPC is configured.

## Tools

| Tool | Side effects | Description |
|---|---|---|
| `check_environment_health` | none | Checks forge/hardhat/node availability and RPC reachability |
| `check_balance` | none | Native or ERC-20 balance for an address |
| `read_contract` | none | Calls a read-only contract method |
| `estimate_gas` | none | Simulates a call, returns gas estimate + revert risk |
| `check_transaction_status` | none | Looks up a tx hash via RPC |
| `check_gasless_eligibility` | none | Calls BOT Chain's real `pm_isSponsorable` paymaster method |
| `fetch_explorer_state` | none | Queries the block explorer — API shape unverified, see FEEDBACK.md |
| `execute_terminal_cmd` | runs local commands | Allow-listed: forge, npx, npm, which, git only |
| `deploy_contract` | sends a tx, costs gas | Deploys from a Foundry build artifact |
| `send_transaction` | sends a tx, costs gas | Native or ERC-20 transfer |
| `batch_transfer` | sends N txs, costs gas | Sequential transfers to multiple recipients |

## Environment variables

See `.env.example`. All chain tools read `BOTCHAIN_RPC_URL`; signing tools
additionally need `BOTCHAIN_PRIVATE_KEY` (testnet-only).

## Design notes

- `execute_terminal_cmd` uses `execFile` with an explicit argv array against
  a hardcoded allow-list (`forge`, `npx`, `npm`, `which`, `git`) — never a
  shell string — so there's no injection surface via shell metacharacters.
- Signing tools fetch the nonce explicitly (`"latest"`, tracked locally
  across a batch) rather than relying on ethers' automatic pending-nonce
  population, to avoid races against fast-mining local/test chains.
- `lib/chain.js` creates a fresh `ethers.JsonRpcProvider` per call rather
  than a module-level singleton, so nothing in the server holds long-lived
  state between tool invocations.
