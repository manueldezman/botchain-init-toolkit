import { z } from "zod";
import { getConfig } from "../lib/chain.js";

export const fetchExplorerStateTool = {
  name: "fetch_explorer_state",
  config: {
    title: "Fetch explorer state",
    description:
      "Read-only. Queries the BOT Chain block explorer API for a transaction hash or " +
      "contract address and returns the verified, indexed record (confirmation status, " +
      "verification status, etc). Use this after deploy_contract/send_transaction to give " +
      "the user a verified link instead of just the raw tx hash.",
    inputSchema: {
      query: z.string().describe("Transaction hash or contract address to look up"),
      kind: z.enum(["tx", "address"]).default("tx"),
    },
  },
  handler: async ({ query, kind }) => {
    const { explorerApi } = getConfig();
    const endpoint =
      kind === "tx"
        ? `${explorerApi}/tx/${query}`
        : `${explorerApi}/address/${query}`;

    try {
      const res = await fetch(endpoint, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { query, endpoint, error: `Explorer API returned ${res.status}` },
                null,
                2
              ),
            },
          ],
        };
      }
      const data = await res.json();
      return {
        content: [
          { type: "text", text: JSON.stringify({ query, endpoint, data }, null, 2) },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { query, endpoint, error: err.message, note: "Explorer may be unreachable from this environment." },
              null,
              2
            ),
          },
        ],
      };
    }
  },
};
