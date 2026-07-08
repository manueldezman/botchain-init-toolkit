# BOT Chain — Gas Estimation & Batching Notes

Load this file only for tasks involving gas estimates, batch transfers, or
airdrops to multiple recipients.

## Single-call estimation

Use the `estimate_gas` MCP tool before any `send_transaction` or
`deploy_contract` call when the user hasn't already confirmed they want
to proceed. Report:

- estimated gas units
- current base fee (from `check_environment_health`'s RPC probe)
- estimated total cost in the native token
- a failure-risk flag if the simulated call reverts

## Batch transfers / airdrops

`batch_transfer` sends one transaction per recipient, sequentially — it
does **not** use a multicall contract by default. Before running a batch:

1. Estimate gas for a single transfer of the same token.
2. Multiply by recipient count to give the user a total cost estimate.
3. If the recipient list is larger than 25, warn the user this will take
   a while and ask if they want to proceed anyway, since each transfer
   waits for confirmation before the next is sent.

## Reporting format

Always report gas figures in both the native token and a rough USD
estimate if a price feed is available; if not, native token units only —
never fabricate a USD conversion.
