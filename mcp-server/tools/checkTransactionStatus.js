import { z } from "zod";
import { getProvider } from "../lib/chain.js";

export const checkTransactionStatusTool = {
  name: "check_transaction_status",
  config: {
    title: "Check transaction status",
    description:
      "Read-only. Looks up a transaction hash directly via RPC and returns its status, " +
      "from/to, value, and gas used. Falls back gracefully if the transaction is still pending.",
    inputSchema: {
      txHash: z.string().describe("Transaction hash to look up"),
    },
  },
  handler: async ({ txHash }) => {
    const provider = getProvider();
    const [tx, receipt] = await Promise.all([
      provider.getTransaction(txHash),
      provider.getTransactionReceipt(txHash),
    ]);

    if (!tx) {
      return {
        content: [
          { type: "text", text: JSON.stringify({ txHash, status: "not_found" }, null, 2) },
        ],
      };
    }

    const result = {
      txHash,
      status: receipt ? (receipt.status === 1 ? "confirmed" : "failed") : "pending",
      from: tx.from,
      to: tx.to,
      valueNative: tx.value?.toString(),
      gasUsed: receipt?.gasUsed?.toString() ?? null,
      blockNumber: receipt?.blockNumber ?? null,
    };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
};
