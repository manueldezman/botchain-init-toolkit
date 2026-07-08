import { ethers } from "ethers";

/**
 * Central place for provider/wallet/env config so every tool reads the
 * same source of truth. Throws a clear error if required env vars are
 * missing rather than silently falling back to a public default.
 */

export function getConfig() {
  const rpcUrl = process.env.BOTCHAIN_RPC_URL;
  const chainId = process.env.BOTCHAIN_CHAIN_ID;
  // No explorer API is documented in BOT Chain's official docs (see
  // FEEDBACK.md). This default points at the real explorer UI domain,
  // not a verified API base — confirm the actual API shape before
  // relying on fetch_explorer_state in production.
  const explorerApi = process.env.BOTCHAIN_EXPLORER_API || "https://scan.bohr.life";
  const networkLabel = process.env.BOTCHAIN_NETWORK_LABEL || "BOT Chain Testnet";
  return { rpcUrl, chainId, explorerApi, networkLabel };
}

// Intentionally NOT a singleton. ethers v6's JsonRpcProvider dedupes
// identical in-flight/near-in-flight calls (including
// eth_getTransactionCount) against a shared instance, which can hand back
// a stale nonce to a signing call made immediately after a previous one.
// A fresh provider per call keeps every read honest at the cost of a
// slightly heavier connection setup, which is negligible for a local tool.
export function getProvider() {
  const { rpcUrl } = getConfig();
  if (!rpcUrl) {
    throw new Error(
      "BOTCHAIN_RPC_URL is not set. Add it to mcp-server/.env before calling chain tools."
    );
  }
  return new ethers.JsonRpcProvider(rpcUrl);
}

export function getWallet() {
  const key = process.env.BOTCHAIN_PRIVATE_KEY;
  if (!key) {
    throw new Error(
      "BOTCHAIN_PRIVATE_KEY is not set. Add a testnet-only dev key to mcp-server/.env " +
        "before calling any signing tool (send_transaction, deploy_contract, batch_transfer)."
    );
  }
  return new ethers.Wallet(key, getProvider());
}

export const ERC20_MIN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function totalSupply() view returns (uint256)",
];
