import { z } from "zod";
import { getProvider } from "../lib/chain.js";

// Wraps BOT Chain's EOA Paymaster JSON-RPC method, pm_isSponsorable.
// This is a real, documented BOT Chain feature (unlike the agent-identity
// material in references/boundary-rules.md) — see
// https://dev-docs.botchain.ai/docs/Developers/eoa-paymaster/
//
// Note: that doc page has a known error — one section calls this method
// `gm_sponsorable` instead of `pm_isSponsorable`. `pm_isSponsorable` is
// correct; see FEEDBACK.md submission #6.

export const checkGaslessEligibilityTool = {
  name: "check_gasless_eligibility",
  config: {
    title: "Check gasless transaction eligibility",
    description:
      "Read-only. Calls BOT Chain's pm_isSponsorable RPC method to check whether a " +
      "transaction is eligible to be sponsored (gasless) by the network's EOA Paymaster. " +
      "Use this before telling a user a transaction can be sent gaslessly — don't assume.",
    inputSchema: {
      to: z.string().describe("Target address the transaction would call"),
      from: z.string().describe("Sender address"),
      data: z.string().default("0x").describe("Encoded call data"),
      value: z.string().default("0x0").describe("Value to send, as a hex string, e.g. \"0x1b4\""),
    },
  },
  handler: async ({ to, from, data, value }) => {
    const provider = getProvider();
    try {
      const sponsorable = await provider.send("pm_isSponsorable", [
        { to, from, data, value },
      ]);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ to, from, sponsorable }, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                to,
                from,
                error: err.shortMessage || err.message,
                note:
                  "pm_isSponsorable may not be available on this RPC endpoint, or the " +
                  "paymaster may be unreachable. This is not necessarily a bug in this tool.",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  },
};
