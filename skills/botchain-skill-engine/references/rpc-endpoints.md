# BOT Chain — Network Endpoints

Load this file only when a task needs a concrete endpoint, chain ID, or
explorer URL. Values below are the real, published network parameters as
of the last verification date at the bottom of this file — re-check
against https://dev-docs.botchain.ai/docs/Developers/quick-guide/ if it's
been a while, since these can change.

## Testnet (default target)

| Field | Value |
|---|---|
| Network name | `botchain-testnet` |
| Chain ID | `968` |
| RPC URL | `https://rpc.bohr.life` |
| Explorer UI | `https://scan.bohr.life` |
| Explorer API | **Not documented.** No API reference is published for either explorer. If you need programmatic access, verify empirically (many BSC-fork explorers run Blockscout with a conventional `/api` path) before relying on it in production. |
| Faucet | `https://faucet.botchain.ai/basic` — **note:** BOT Chain's own docs also describe a separate "contact us via Discord bot" flow on a different page with no linked Discord invite. The two instructions disagree; the self-serve URL above is the one that's actually clickable. Verify before depending on either. |
| Native token symbol | `tBOT` (testnet) |

## Mainnet

Only use mainnet values if the user explicitly says "mainnet" or
"production."

| Field | Value |
|---|---|
| Network name | `botchain-mainnet` |
| Chain ID | `677` |
| RPC URL | `https://rpc.botchain.ai` |
| Explorer UI | `https://scan.botchain.ai` |
| Explorer API | Not documented — same caveat as testnet above. |
| Native token symbol | `BOT` |

## Known gotchas from the official docs

- `eth_getLogs` is **disabled** on the public mainnet RPC endpoint. The
  docs say to use a third-party endpoint but don't name one. If a task
  needs log queries on mainnet, tell the user this up front rather than
  letting a silent RPC error look like a bug in this toolkit.
- BOT Chain is a BNB Smart Chain fork (Parlia consensus, BEP-126/BEP-341,
  Geth-compatible JSON-RPC). Standard `ethers`/`web3.js`/Foundry/Hardhat
  tooling works as-is — there is no BOT-Chain-specific SDK required for
  ordinary contract deployment or calls.
- BOT Chain also exposes a gasless-transaction (EOA Paymaster) JSON-RPC
  method, `pm_isSponsorable` — see the `check_gasless_eligibility` MCP
  tool. This is a real, distinctive BOT Chain feature (unlike the
  "Agent Identity" material in `boundary-rules.md`, which is a proposed
  convention from this toolkit, not a native chain feature — see the
  disclaimer at the top of that file).

## Configuration

The MCP server reads these from environment variables so they're never
hardcoded into generated contracts or scripts:

```
BOTCHAIN_RPC_URL=https://rpc.bohr.life
BOTCHAIN_CHAIN_ID=968
BOTCHAIN_EXPLORER_API=https://scan.bohr.life
BOTCHAIN_PRIVATE_KEY=...      # testnet dev key only — never mainnet funds
```

Set these in a local `.env` file next to the MCP server. Never print the
private key back into chat, logs, or generated files.

_Last verified against https://dev-docs.botchain.ai/docs/Developers/ on
2026-07-08. That site has several documentation gaps of its own — see
FEEDBACK.md at the repo root._
