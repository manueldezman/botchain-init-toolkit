import { ethers } from "ethers";
import { z } from "zod";
import { getProvider } from "../lib/chain.js";

export const readContractTool = {
  name: "read_contract",
  config: {
    title: "Read contract",
    description:
      "Read-only. Calls a view/pure method on a contract and returns the result. " +
      "Provide a human-readable ABI fragment for just the method being called, e.g. " +
      '"function totalSupply() view returns (uint256)".',
    inputSchema: {
      contractAddress: z.string().describe("Contract address to call"),
      abiFragment: z
        .string()
        .describe('Single human-readable ABI fragment, e.g. "function totalSupply() view returns (uint256)"'),
      methodName: z.string().describe("Name of the method to call"),
      args: z.array(z.union([z.string(), z.number(), z.boolean()])).optional().describe("Method arguments, in order"),
    },
  },
  handler: async ({ contractAddress, abiFragment, methodName, args }) => {
    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, [abiFragment], provider);
    const fn = contract[methodName];
    if (!fn) {
      throw new Error(`Method ${methodName} not found in the provided ABI fragment.`);
    }
    const raw = await fn(...(args ?? []));
    const serializable = Array.isArray(raw)
      ? raw.map((v) => v?.toString?.() ?? v)
      : raw?.toString?.() ?? raw;

    const result = { contractAddress, methodName, result: serializable };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
};
