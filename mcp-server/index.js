#!/usr/bin/env node
import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { checkEnvironmentHealthTool } from "./tools/checkEnvironmentHealth.js";
import { checkBalanceTool } from "./tools/checkBalance.js";
import { readContractTool } from "./tools/readContract.js";
import { estimateGasTool } from "./tools/estimateGas.js";
import { checkTransactionStatusTool } from "./tools/checkTransactionStatus.js";
import { executeTerminalCmdTool } from "./tools/executeTerminalCmd.js";
import { deployContractTool } from "./tools/deployContract.js";
import { sendTransactionTool } from "./tools/sendTransaction.js";
import { batchTransferTool } from "./tools/batchTransfer.js";
import { fetchExplorerStateTool } from "./tools/fetchExplorerState.js";
import { checkGaslessEligibilityTool } from "./tools/checkGaslessEligibility.js";

const server = new McpServer({
  name: "botchain-mcp-server",
  version: "1.0.0",
});

const tools = [
  checkEnvironmentHealthTool,
  checkBalanceTool,
  readContractTool,
  estimateGasTool,
  checkTransactionStatusTool,
  executeTerminalCmdTool,
  deployContractTool,
  sendTransactionTool,
  batchTransferTool,
  fetchExplorerStateTool,
  checkGaslessEligibilityTool,
];

for (const tool of tools) {
  server.registerTool(tool.name, tool.config, async (args) => {
    try {
      return await tool.handler(args);
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify({ tool: tool.name, error: err.message }, null, 2),
          },
        ],
      };
    }
  });
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdio is used for MCP protocol traffic — never write logs to stdout.
  console.error(`[botchain-mcp-server] ready — ${tools.length} tools registered.`);
}

main().catch((err) => {
  console.error("[botchain-mcp-server] fatal:", err);
  process.exit(1);
});
