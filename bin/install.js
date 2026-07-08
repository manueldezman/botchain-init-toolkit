#!/usr/bin/env node
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { copySkillDir, upsertJsonMcpServer, upsertTomlMcpServer, exists } from "./fs-helpers.js";
import { runEnvironmentDoctor } from "./env-doctor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, "..");
const SKILL_SRC = path.join(PACKAGE_ROOT, "skills", "botchain-skill-engine");
const MCP_SERVER_ENTRY = path.join(PACKAGE_ROOT, "mcp-server", "index.js");
const SKILL_NAME = "botchain-skill-engine";
const MCP_SERVER_NAME = "botchain-mcp-server";

const args = process.argv.slice(2);
const flags = {
  global: args.includes("--global") || args.length === 0,
  skipMcp: args.includes("--skip-mcp"),
  dryRun: args.includes("--dry-run"),
  help: args.includes("--help") || args.includes("-h"),
};

const HOME = os.homedir();

// Global skill directories, matching the paths every supported IDE reads
// skills from (see SKILL.md "Skill File Storage Path").
const SKILL_TARGETS = [
  { label: "Claude Code", dir: path.join(HOME, ".claude", "skills") },
  { label: "Codex", dir: path.join(HOME, ".codex", "skills") },
  { label: "Cursor", dir: path.join(HOME, ".cursor", "skills") },
  { label: "Windsurf", dir: path.join(HOME, ".windsurf", "skills") },
];

function mcpServerEntryJson() {
  return {
    command: "node",
    args: [MCP_SERVER_ENTRY],
    env: {
      BOTCHAIN_RPC_URL: "https://rpc.bohr.life",
      BOTCHAIN_CHAIN_ID: "968",
      BOTCHAIN_EXPLORER_API: "https://scan.bohr.life",
      BOTCHAIN_PRIVATE_KEY: "",
    },
  };
}

// JSON-based MCP config files this installer knows how to update.
// Claude Code also supports `claude mcp add` — we still write the config
// file directly so this works headlessly / in CI too.
function jsonMcpTargets() {
  const platform = os.platform();
  const claudeDesktopConfig =
    platform === "darwin"
      ? path.join(HOME, "Library", "Application Support", "Claude", "claude_desktop_config.json")
      : platform === "win32"
      ? path.join(process.env.APPDATA || HOME, "Claude", "claude_desktop_config.json")
      : path.join(HOME, ".config", "Claude", "claude_desktop_config.json");

  return [
    { label: "Claude Desktop / Claude Code", configPath: claudeDesktopConfig },
    { label: "Cursor", configPath: path.join(HOME, ".cursor", "mcp.json") },
    { label: "Windsurf", configPath: path.join(HOME, ".codeium", "windsurf", "mcp_config.json") },
  ];
}

function codexTomlTarget() {
  return {
    label: "Codex",
    configPath: path.join(HOME, ".codex", "config.toml"),
    block:
      `[mcp_servers.${MCP_SERVER_NAME}]\n` +
      `command = "node"\n` +
      `args = ["${MCP_SERVER_ENTRY.replace(/\\/g, "\\\\")}"]\n` +
      `env = { BOTCHAIN_RPC_URL = "https://rpc.bohr.life", BOTCHAIN_CHAIN_ID = "968", BOTCHAIN_EXPLORER_API = "https://scan.bohr.life", BOTCHAIN_PRIVATE_KEY = "" }\n`,
  };
}

function printHelp() {
  console.log(`
@botchain/init-toolkit

Usage:
  npx @botchain/init-toolkit --global     Install skill + MCP server for all supported IDEs
  npx @botchain/init-toolkit --dry-run    Show what would happen without writing anything
  npx @botchain/init-toolkit --skip-mcp   Install the skill files only, skip MCP registration
  npx @botchain/init-toolkit --help       Show this message
`);
}

async function main() {
  if (flags.help) {
    printHelp();
    return;
  }

  console.log("\n@botchain/init-toolkit — setting up BOT Chain skill + MCP server\n");

  if (!(await exists(SKILL_SRC))) {
    throw new Error(`Skill source not found at ${SKILL_SRC} — package may be corrupted.`);
  }

  // 1. Skill directory — Anthropic Progressive Skill Directory layer
  console.log("1. Installing skill files:");
  for (const target of SKILL_TARGETS) {
    if (flags.dryRun) {
      console.log(`   [dry-run] would copy skill to ${path.join(target.dir, SKILL_NAME)}`);
      continue;
    }
    const dest = await copySkillDir(SKILL_SRC, target.dir, SKILL_NAME);
    console.log(`   ✓ ${target.label.padEnd(28)} ${dest}`);
  }

  // 2. MCP server registration — Universal MCP Server layer
  if (!flags.skipMcp) {
    console.log("\n2. Registering MCP server:");
    for (const target of jsonMcpTargets()) {
      if (flags.dryRun) {
        console.log(`   [dry-run] would register MCP server in ${target.configPath}`);
        continue;
      }
      try {
        const { configPath, alreadyPresent } = await upsertJsonMcpServer(
          target.configPath,
          MCP_SERVER_NAME,
          mcpServerEntryJson()
        );
        console.log(
          `   ${alreadyPresent ? "↻ updated" : "✓ added  "} ${target.label.padEnd(28)} ${configPath}`
        );
      } catch (err) {
        console.log(`   ✗ ${target.label.padEnd(28)} skipped — ${err.message}`);
      }
    }

    const codex = codexTomlTarget();
    if (flags.dryRun) {
      console.log(`   [dry-run] would register MCP server in ${codex.configPath}`);
    } else {
      const { configPath, alreadyPresent } = await upsertTomlMcpServer(
        codex.configPath,
        MCP_SERVER_NAME,
        codex.block
      );
      console.log(
        `   ${alreadyPresent ? "↻ updated" : "✓ added  "} ${codex.label.padEnd(28)} ${configPath}`
      );
    }

    console.log(
      "\n   Note: env values are written blank. Edit the config file (or set BOTCHAIN_RPC_URL / \n" +
        "   BOTCHAIN_CHAIN_ID / BOTCHAIN_PRIVATE_KEY in your shell) before using any chain tool."
    );
  } else {
    console.log("\n2. Skipping MCP server registration (--skip-mcp).");
  }

  // 3. Environment doctor — quick compiler availability check, install-time only
  console.log("\n3. Checking local compiler tooling:");
  const health = await runEnvironmentDoctor();
  console.log(`   node    : ${health.node ? "found" : "missing"}`);
  console.log(`   forge   : ${health.forge ? "found" : "missing"}`);
  console.log(`   hardhat : ${health.hardhat ? "found" : "missing (via npx)"}`);
  if (!health.compilerAvailable) {
    console.log(
      "\n   Neither Foundry nor Hardhat was found. The agent will offer to install Foundry\n" +
        "   (via foundryup) the first time you ask it to compile or deploy a contract —\n" +
        "   it will ask for your approval first. To install it yourself now instead:\n" +
        "     curl -L https://foundry.paradigm.xyz | bash && foundryup"
    );
  }

  console.log("\nDone. Restart Claude Code / Codex / Cursor / Windsurf to load the new skill.\n");
}

main().catch((err) => {
  console.error("\n@botchain/init-toolkit failed:", err.message);
  process.exit(1);
});
