import { ethers } from "ethers";
import { z } from "zod";
import { getProvider, ERC20_MIN_ABI } from "../lib/chain.js";

export const checkBalanceTool = {
  name: "check_balance",
  config: {
    title: "Check balance",
    description:
      "Read-only. Returns the native token balance for an address, or an ERC-20 token " +
      "balance if a token contract address is provided.",
    inputSchema: {
      address: z.string().describe("Wallet address to check, e.g. 0x..."),
      tokenAddress: z
        .string()
        .optional()
        .describe("ERC-20 contract address. Omit to check the native token balance."),
    },
  },
  handler: async ({ address, tokenAddress }) => {
    const provider = getProvider();

    if (!tokenAddress) {
      const raw = await provider.getBalance(address);
      const result = {
        address,
        token: "native",
        balanceWei: raw.toString(),
        balanceFormatted: ethers.formatEther(raw),
      };
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    const token = new ethers.Contract(tokenAddress, ERC20_MIN_ABI, provider);
    const [raw, decimals, symbol] = await Promise.all([
      token.balanceOf(address),
      token.decimals(),
      token.symbol().catch(() => "TOKEN"),
    ]);
    const result = {
      address,
      token: tokenAddress,
      symbol,
      balanceRaw: raw.toString(),
      balanceFormatted: ethers.formatUnits(raw, decimals),
    };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
};
