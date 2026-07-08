import { ethers } from "ethers";
import { z } from "zod";
import { getWallet, ERC20_MIN_ABI } from "../lib/chain.js";

export const batchTransferTool = {
  name: "batch_transfer",
  config: {
    title: "Batch transfer",
    description:
      "Side-effecting — costs testnet gas per recipient. Sends the same token amount to " +
      "a list of recipients, sequentially (one tx per recipient, waiting for each " +
      "confirmation before sending the next). Requires user approval. Warn the user first " +
      "if recipients.length > 25 — see references/gas-estimation.md.",
    inputSchema: {
      recipients: z.array(z.string()).min(1).max(200),
      amountEach: z.string().describe("Amount per recipient, in human units"),
      tokenAddress: z.string().optional().describe("ERC-20 contract address; omit for native transfers"),
    },
  },
  handler: async ({ recipients, amountEach, tokenAddress }) => {
    const wallet = getWallet();
    const results = [];

    let token = null;
    let decimals = 18;
    if (tokenAddress) {
      token = new ethers.Contract(tokenAddress, ERC20_MIN_ABI, wallet);
      decimals = await token.decimals();
    }

    let nonce = await wallet.provider.getTransactionCount(wallet.address, "latest");
    for (const to of recipients) {
      try {
        const tx = token
          ? await token.transfer(to, ethers.parseUnits(amountEach, decimals), { nonce })
          : await wallet.sendTransaction({ to, value: ethers.parseEther(amountEach), nonce });
        nonce += 1;
        const receipt = await tx.wait();
        results.push({ to, txHash: tx.hash, status: receipt?.status === 1 ? "confirmed" : "failed" });
      } catch (err) {
        results.push({ to, error: err.shortMessage || err.message });
      }
    }

    const summary = {
      totalRecipients: recipients.length,
      succeeded: results.filter((r) => r.status === "confirmed").length,
      failed: results.filter((r) => r.error || r.status === "failed").length,
      results,
    };
    return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
  },
};
