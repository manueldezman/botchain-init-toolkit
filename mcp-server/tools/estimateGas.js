import { ethers } from "ethers";
import { z } from "zod";
import { getProvider } from "../lib/chain.js";

export const estimateGasTool = {
  name: "estimate_gas",
  config: {
    title: "Estimate gas",
    description:
      "Read-only. Simulates a transaction to estimate gas usage and cost, and flags " +
      "whether the call would revert. Use before send_transaction/deploy_contract/" +
      "batch_transfer when the user hasn't already confirmed they want to proceed.",
    inputSchema: {
      to: z.string().describe("Target address or contract"),
      data: z.string().optional().describe("Encoded call data, if calling a contract method"),
      valueWei: z.string().optional().describe("Native value to send, in wei, as a string"),
    },
  },
  handler: async ({ to, data, valueWei }) => {
    const provider = getProvider();
    const tx = {
      to,
      data: data ?? undefined,
      value: valueWei ? BigInt(valueWei) : undefined,
    };

    let gasEstimate = null;
    let willRevert = false;
    let revertReason = null;
    try {
      gasEstimate = await provider.estimateGas(tx);
    } catch (err) {
      willRevert = true;
      revertReason = err.shortMessage || err.message;
    }

    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas ?? 0n;
    const estimatedCostWei = gasEstimate ? gasEstimate * gasPrice : null;

    const result = {
      to,
      gasUnits: gasEstimate?.toString() ?? null,
      gasPriceWei: gasPrice.toString(),
      estimatedCostNative: estimatedCostWei ? ethers.formatEther(estimatedCostWei) : null,
      willLikelyRevert: willRevert,
      revertReason,
    };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
};
