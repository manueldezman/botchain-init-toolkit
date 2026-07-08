import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
import { getConfig, getProvider } from "../lib/chain.js";

const execFileAsync = promisify(execFile);

async function which(bin) {
  try {
    const { stdout } = await execFileAsync("which", [bin]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export const checkEnvironmentHealthTool = {
  name: "check_environment_health",
  config: {
    title: "Check environment health",
    description:
      "Read-only. Checks whether Foundry (forge), Hardhat (via npx), and Node.js are " +
      "installed, and whether the configured BOT Chain RPC endpoint is reachable. " +
      "Call this before any deploy/compile/send tool so failures are diagnosed up front.",
    inputSchema: {},
  },
  handler: async () => {
    const [forgePath, nodePath, npxPath] = await Promise.all([
      which("forge"),
      which("node"),
      which("npx"),
    ]);

    let hardhatAvailable = false;
    if (npxPath) {
      try {
        await execFileAsync("npx", ["--no-install", "hardhat", "--version"], {
          timeout: 5000,
        });
        hardhatAvailable = true;
      } catch {
        hardhatAvailable = false;
      }
    }

    const { rpcUrl, chainId, networkLabel } = getConfig();
    let rpcReachable = false;
    let rpcError = null;
    let liveChainId = null;
    if (rpcUrl) {
      try {
        const provider = getProvider();
        const network = await provider.getNetwork();
        liveChainId = network.chainId.toString();
        rpcReachable = true;
      } catch (err) {
        rpcError = err.message;
      }
    } else {
      rpcError = "BOTCHAIN_RPC_URL not set";
    }

    const result = {
      network: networkLabel,
      configuredChainId: chainId ?? null,
      liveChainId,
      rpc: { reachable: rpcReachable, url: rpcUrl ?? null, error: rpcError },
      tooling: {
        forge: { installed: !!forgePath, path: forgePath },
        hardhat: { installed: hardhatAvailable },
        node: { installed: !!nodePath, path: nodePath },
      },
      recommendation: !forgePath && !hardhatAvailable
        ? "Neither Foundry nor Hardhat is installed. Ask the user for approval before running foundryup."
        : "Compiler tooling looks available.",
    };

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
};
