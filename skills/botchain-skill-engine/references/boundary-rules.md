# BOT Chain — Agent Identity & Boundary Rules

> **⚠️ Disclaimer — read before using this file.** Everything below is a
> **proposed convention from this toolkit**, not a documented BOT Chain
> network feature. As of the last verification date at the bottom of this
> file, BOT Chain's official docs (dev-docs.botchain.ai) describe a
> standard BNB-Smart-Chain-fork EVM — there is no native "Agent Wallet
> Handle," "Blueprint Code Hash," or "Boundary Policy Field" primitive on
> chain. If you scaffold a contract from this file, tell the user
> explicitly that it's an application-level pattern this toolkit
> recommends, not something BOT Chain enforces natively. Do not represent
> it as an official chain feature in a hackathon submission or elsewhere.

Load this file only when a task involves writing, deploying, or reasoning
about an agent-identity-style contract, or when a boundary/permission
question comes up and the user wants this toolkit's recommended pattern.

## The three fields of an Agent Identity

Every on-chain AI agent identity on BOT Chain is composed of three parts.
When scaffolding an identity contract, all three must be present:

1. **Agent Wallet Handle** — the address the agent signs transactions
   from. Rotating this requires re-registering the identity.
2. **Blueprint Code Hash / DID** — a hash of the agent's code/prompt
   bundle, used to prove which version of the agent produced a given
   transaction. Treat this as immutable once registered.
3. **Boundary Policy Field** — a machine-readable limit on what the
   agent is allowed to do on-chain. At minimum this should express:
   - a maximum per-transaction value
   - a maximum per-day cumulative value
   - an allow-list of contract methods the agent may call

## Boundary Policy Field — minimal schema

```solidity
struct BoundaryPolicy {
    uint256 maxPerTxValue;
    uint256 maxDailyValue;
    bytes4[] allowedSelectors; // function selectors this agent may call
}
```

## Rules the skill must follow

- Never generate a Boundary Policy with unlimited (`type(uint256).max`)
  fields unless the user explicitly asks for an unrestricted agent and
  acknowledges the risk in the same message.
- When deploying an identity contract, always echo the resolved
  `maxPerTxValue` / `maxDailyValue` back to the user before deployment,
  in human-readable units, not raw wei.
- Any `execute_terminal_cmd` call that would install software (e.g.
  `foundryup`) must be preceded by an explicit user approval in the
  conversation — the MCP server does not enforce this on its own, the
  agent must ask first.

---
_Last verified against https://dev-docs.botchain.ai/docs/Developers/ on
2026-07-08 — no agent-identity primitive found in the official docs as of
that date._
