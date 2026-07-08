---
name: botchain-skill-engine
description: Use this skill for any task involving the BOT Chain EVM network (mainnet chain ID 677, testnet "Bohr" chain ID 968, rpc.botchain.ai / rpc.bohr.life) — checking wallet or token balances, reading or writing smart contracts, deploying contracts (including via Foundry/forge), sending transactions, estimating gas, checking gasless/paymaster eligibility, batch transfers/airdrops, or checking transaction/explorer status. Trigger on mentions of "BOT Chain", "botchain.ai", "bohr.life", or requests to deploy/interact with EVM contracts on that specific network. Note: "BotChain" is also the name of several unrelated projects (a robotics SDK, a proof-of-work chain, a trading bot) — if the request doesn't match the chain IDs/domains above, ask before assuming it's this network.
license: MIT-0
version: 1.1.0
---

# BOT Chain Skill Engine

This skill turns a coding agent into a BOT Chain engineer. It bundles the
network's context (RPC endpoints, layer architecture, boundary rules) and
routes execution through the `botchain-mcp-server`, which exposes safe,
narrow tools for environment checks, terminal execution, and explorer
lookups.

## When to use this

Use this skill whenever the user's request involves BOT Chain: querying
balances, reading/writing contracts, deploying, sending transactions,
estimating gas, batch transfers, or checking transaction status. If the
request is about a different chain, do not use this skill.

## How to operate (progressive disclosure)

Don't load every reference up front. Load only what the current task needs:

1. **Always start here.** This file is enough to route simple reads
   (balance checks, tx status, contract reads) directly to MCP tools.
2. **Writing or deploying a contract?** Read `references/boundary-rules.md`
   for the identity/permission schema, then copy the starting point from
   `assets/contract-template.sol` by path — don't retype it into context.
3. **Anything involving gas, batching, or multiple recipients?** Read
   `references/gas-estimation.md` first.
4. **Need an endpoint, chain ID, or explorer URL?** Read
   `references/rpc-endpoints.md`.

## Standard operating loop

```
STATE 0  User makes a natural-language request involving BOT Chain.
STATE 1  Load only the reference file(s) this task needs (see above).
STATE 2  Call check_environment_health via the MCP server.
STATE 3  If a required tool (forge/hardhat) is missing, ask the user for
         approval before installing anything. Never install silently.
STATE 4  Call execute_terminal_cmd / deploy_contract / send_transaction /
         batch_transfer as appropriate. Always use the MCP tools for
         chain interaction — never hand-roll RPC calls in generated code
         unless the user explicitly asks for a standalone script.
STATE 5  Call fetch_explorer_state or check_transaction_status to confirm
         the result, and report the verified address/hash back to the user.
```

## Available MCP tools

These are exposed by `botchain-mcp-server` (see the toolkit's `mcp-server/`
directory). Call them by name — do not guess at parameters; if unsure,
call the tool with no risky side effects first (e.g. `check_environment_health`)
to confirm the server is reachable.

| Tool | Purpose |
|---|---|
| `check_environment_health` | Verifies forge/hardhat/node availability and RPC reachability. Read-only. |
| `check_balance` | Reads native or ERC-20 balance for an address. Read-only. |
| `read_contract` | Calls a read-only contract method. Read-only. |
| `estimate_gas` | Simulates a call to estimate gas cost and failure risk. Read-only. |
| `check_transaction_status` | Looks up a tx hash on the explorer. Read-only. |
| `check_gasless_eligibility` | Calls BOT Chain's real `pm_isSponsorable` method to check paymaster sponsorship. Read-only. |
| `execute_terminal_cmd` | Runs an allow-listed local shell command (forge/hardhat/npm only). Side-effecting — confirm with user first for anything that installs software. |
| `deploy_contract` | Compiles and deploys a contract via forge create. Side-effecting — costs testnet gas. |
| `send_transaction` | Signs and sends a native or ERC-20 transfer. Side-effecting — costs testnet gas. |
| `batch_transfer` | Sends the same token to multiple recipients in sequence. Side-effecting. |
| `fetch_explorer_state` | Fetches data from the explorer. Read-only — note: no explorer API is documented by BOT Chain; verify the API shape before relying on this. |

## Boundary rules (always apply)

- Never send a transaction, deploy a contract, or install software without
  the user's explicit go-ahead in the current conversation.
- Never fabricate a transaction hash, contract address, or balance. If a
  tool call fails or the server is unreachable, say so — do not guess.
- If scaffolding an "agent identity" style contract from
  `references/boundary-rules.md`, tell the user explicitly that this is a
  proposed pattern from this toolkit, not a native BOT Chain feature —
  see the disclaimer at the top of that file.
- This skill targets the BOT Chain **testnet** (chain ID 968) by default.
  Only touch mainnet (chain ID 677) if the user names it explicitly.
- BOT Chain's official docs have several known gaps (broken links, a
  wrong RPC method name on the paymaster page, contradictory faucet
  instructions). See `FEEDBACK.md` at the toolkit root before assuming
  something you read there is accurate — verify against the live docs
  if it matters for the task.
