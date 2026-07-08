import { ethers } from "ethers";
import { z } from "zod";
import { getWallet, ERC20_MIN_ABI } from "../lib/chain.js";

export const sendTransactionTool = {
  name: "send_transaction",
  config: {
    title: "Send transaction",
    description:
      "Side-effecting — costs testnet gas. Sends a native token transfer, or an ERC-20 " +
      "transfer if a tokenAddress is provided. Requires user approval before calling. " +
      "Run estimate_gas first for anything non-trivial.",
    inputSchema: {
      to: z.string().describe("Recipient address"),
      amount: z.string().describe("Amount to send, in human units (e.g. \"0.1\")"),
      tokenAddress: z.string().optional().describe("ERC-20 contract address; omit for native transfer"),
    },
  },
  handler: async ({ to, amount, tokenAddress }) => {
    const wallet = getWallet();
    const nonce = await wallet.provider.getTransactionCount(wallet.address, "latest");

    if (!tokenAddress) {
      const tx = await wallet.sendTransaction({ to, value: ethers.parseEther(amount), nonce });
      const receipt = await tx.wait();
      const result = {
        txHash: tx.hash,
        from: wallet.address,
        to,
        amount,
        token: "native",
        status: receipt?.status === 1 ? "confirmed" : "failed",
      };
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    const token = new ethers.Contract(tokenAddress, ERC20_MIN_ABI, wallet);
    const decimals = await token.decimals();
    const tx = await token.transfer(to, ethers.parseUnits(amount, decimals), { nonce });
    const receipt = await tx.wait();
    const result = {
      txHash: tx.hash,
      from: wallet.address,
      to,
      amount,
      token: tokenAddress,
      status: receipt?.status === 1 ? "confirmed" : "failed",
    };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
};
