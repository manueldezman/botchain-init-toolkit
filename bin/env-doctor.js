import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function which(bin) {
  try {
    const { stdout } = await execFileAsync("which", [bin]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export async function runEnvironmentDoctor() {
  const [node, npx, forge] = await Promise.all([which("node"), which("npx"), which("forge")]);

  let hardhat = false;
  if (npx) {
    try {
      await execFileAsync("npx", ["--no-install", "hardhat", "--version"], { timeout: 5000 });
      hardhat = true;
    } catch {
      hardhat = false;
    }
  }

  return {
    node: !!node,
    npx: !!npx,
    forge: !!forge,
    hardhat,
    compilerAvailable: !!forge || hardhat,
  };
}
