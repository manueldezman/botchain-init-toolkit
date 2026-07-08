# BOT Chain — Existing Project Migration

Load this file only when the user wants to migrate an existing contract
project onto BOT Chain. This is for adding BOT Chain network support to a
project that already uses Hardhat, Foundry, or Truffle.

## Hard rules

- Never overwrite a whole config file just because adding BOT Chain is
  mechanically simple.
- Detect the project's existing toolchain first, then read the current
  config and deploy scripts before proposing any change.
- Show a minimal diff and get the user's approval before editing config,
  scripts, or env files.
- Reuse the project's existing deployment path after the config update.
  Do not switch the project onto the toolkit's template contract or sample
  deployment flow unless the user explicitly asks for that.
- Migration is useful, but by itself it is not a strong judging
  differentiator. Do not over-invest here expecting the migration step
  alone to carry a demo or competition submission.

## Standard workflow

1. Detect the build tool:
   - Hardhat: `hardhat.config.js|ts|cjs|mjs`
   - Foundry: `foundry.toml`
   - Truffle: `truffle-config.js`
2. Read the existing config file and the existing deploy script(s).
3. Propose a minimal BOT Chain diff.
4. Wait for user approval.
5. Apply only the approved diff.
6. Update any required env values.
7. Run the project's existing deploy command or deploy script.
8. Verify the deployment on BOT Chain with the MCP tools.

## Network values

Default to testnet unless the user explicitly says mainnet.

- Testnet chain ID: `968`
- Testnet RPC: `https://rpc.bohr.life`
- Mainnet chain ID: `677`
- Mainnet RPC: `https://rpc.botchain.ai`

## Hardhat snippet

Add only the `botchainTestnet` entry into the existing `networks` object,
then wire secrets through env vars the project already uses.

```ts
networks: {
  // ...existing networks
  botchainTestnet: {
    url: process.env.BOTCHAIN_RPC_URL || "https://rpc.bohr.life",
    chainId: 968,
    accounts: process.env.BOTCHAIN_PRIVATE_KEY
      ? [process.env.BOTCHAIN_PRIVATE_KEY]
      : [],
  },
}
```

## Foundry snippet

Add only the BOT Chain RPC alias into the existing config.

```toml
[rpc_endpoints]
botchain_testnet = "${BOTCHAIN_RPC_URL}"
```

If the project already keeps chain-specific script defaults elsewhere,
follow that pattern instead of inventing a new one.

## Truffle snippet

Add only the BOT Chain testnet network entry into the existing `networks`
config and keep the project's current provider pattern.

```js
botchainTestnet: {
  provider: () =>
    new HDWalletProvider(process.env.MNEMONIC, process.env.BOTCHAIN_RPC_URL || "https://rpc.bohr.life"),
  network_id: 968,
  confirmations: 1,
  timeoutBlocks: 200,
  skipDryRun: true,
}
```

## Verification expectations

After migration, verify the result by checking one or more of:

- deploy command completed successfully
- contract address exists on the target chain
- transaction hash resolves
- a read-only call succeeds against the deployed contract
