import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, "..", "index.js");

async function main() {
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
    env: {
      ...process.env,
      // Intentionally leave BOTCHAIN_RPC_URL unset to test the "missing config"
      // error path returns a clean message instead of crashing the server.
    },
  });

  const client = new Client({ name: "smoke-test-client", version: "1.0.0" });
  await client.connect(transport);

  console.log("== tools/list ==");
  const { tools } = await client.listTools();
  console.log(`Registered ${tools.length} tools:`);
  for (const t of tools) console.log(` - ${t.name}`);

  const expected = [
    "check_environment_health",
    "check_balance",
    "read_contract",
    "estimate_gas",
    "check_transaction_status",
    "execute_terminal_cmd",
    "deploy_contract",
    "send_transaction",
    "batch_transfer",
    "fetch_explorer_state",
    "check_gasless_eligibility",
  ];
  const missing = expected.filter((n) => !tools.some((t) => t.name === n));
  if (missing.length) throw new Error(`Missing tools: ${missing.join(", ")}`);

  console.log("\n== calling check_environment_health (no RPC configured) ==");
  const health = await client.callTool({ name: "check_environment_health", arguments: {} });
  console.log(health.content[0].text);

  console.log("\n== calling execute_terminal_cmd: which node ==");
  const which = await client.callTool({
    name: "execute_terminal_cmd",
    arguments: { binary: "which", args: ["node"] },
  });
  console.log(which.content[0].text);

  console.log("\n== calling execute_terminal_cmd with a disallowed binary (expect error) ==");
  const blocked = await client.callTool({
    name: "execute_terminal_cmd",
    arguments: { binary: "rm", args: ["-rf", "/"] },
  }).catch((e) => ({ error: e.message }));
  console.log(JSON.stringify(blocked, null, 2));

  console.log("\n== calling check_balance without RPC configured (expect clean error) ==");
  const balance = await client.callTool({
    name: "check_balance",
    arguments: { address: "0x0000000000000000000000000000000000000001" },
  });
  console.log(JSON.stringify(balance, null, 2));

  await client.close();
  console.log("\nSMOKE TEST PASSED");
}

main().catch((err) => {
  console.error("SMOKE TEST FAILED:", err);
  process.exit(1);
});
