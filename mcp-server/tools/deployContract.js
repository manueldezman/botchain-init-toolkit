import { readFile } from "node:fs/promises";
import { ethers } from "ethers";
import { z } from "zod";
import { getWallet } from "../lib/chain.js";

export const deployContractTool = {
  name: "deploy_contract",
  config: {
    title: "Deploy contract",
    description:
      "Side-effecting — costs testnet gas. Deploys a contract from a compiled Foundry " +
      "artifact (the JSON produced by `forge build`, containing `abi` and " +
      "`bytecode.object`). Run check_environment_health and compile with " +
      "execute_terminal_cmd first. Requires user approval before calling.",
    inputSchema: {
      artifactPath: z
        .string()
        .describe("Path to the compiled Foundry artifact JSON (e.g. out/SimpleStorage.sol/SimpleStorage.json)"),
      constructorArgs: z.array(z.union([z.string(), z.number(), z.boolean()])).optional(),
    },
  },
  handler: async ({ artifactPath, constructorArgs }) => {
    const raw = await readFile(artifactPath, "utf-8");
    const artifact = JSON.parse(raw);
    const abi = artifact.abi;
    const bytecode = artifact.bytecode?.object ?? artifact.bytecode;
    if (!abi || !bytecode) {
      throw new Error(
        "Artifact is missing `abi` or `bytecode.object` — is this a Foundry build artifact?"
      );
    }

    const wallet = getWallet();
    const nonce = await wallet.provider.getTransactionCount(wallet.address, "latest");
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy(...(constructorArgs ?? []), { nonce });
    const deployTx = contract.deploymentTransaction();
    await contract.waitForDeployment();

    const result = {
      contractAddress: await contract.getAddress(),
      deployTxHash: deployTx?.hash ?? null,
      deployerAddress: wallet.address,
    };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
};
