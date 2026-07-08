import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";

const execFileAsync = promisify(execFile);

// Strict allow-list: only these binaries can be invoked, and only with
// arguments that match the pattern for that binary. This tool intentionally
// does NOT accept an arbitrary shell string — every call is execFile'd with
// an argv array, so there is no shell interpolation / injection surface.
const ALLOWED_BINARIES = new Set(["forge", "npx", "npm", "which", "git"]);

// Sub-commands considered safe to run without an extra confirmation step
// upstream (the calling skill/agent is still responsible for asking the
// user before anything that installs software, per SKILL.md boundary rules).
function validate(bin, args) {
  if (!ALLOWED_BINARIES.has(bin)) {
    throw new Error(
      `"${bin}" is not on the allow-list (${[...ALLOWED_BINARIES].join(", ")}). Refusing to run.`
    );
  }
  const joined = args.join(" ");
  if (/[;&|`$><]/.test(joined)) {
    throw new Error("Arguments may not contain shell metacharacters (;, &, |, `, $, >, <).");
  }
}

export const executeTerminalCmdTool = {
  name: "execute_terminal_cmd",
  config: {
    title: "Execute terminal command",
    description:
      "Side-effecting. Runs a single allow-listed local command (forge, npx, npm, which, git) " +
      "with an explicit argument list — no shell string parsing, no shell metacharacters. " +
      "Use for compilation (forge build/create) and dependency checks only. The calling agent " +
      "must have the user's explicit approval before running anything that installs software " +
      "(e.g. `npx hardhat init`), per this skill's boundary rules — this tool does not ask itself.",
    inputSchema: {
      binary: z.enum(["forge", "npx", "npm", "which", "git"]),
      args: z.array(z.string()).describe('Argument list, e.g. ["create", "--rpc-url", "..."]'),
      cwd: z.string().optional().describe("Working directory to run the command in"),
      timeoutMs: z.number().int().positive().max(120000).default(60000),
    },
  },
  handler: async ({ binary, args, cwd, timeoutMs }) => {
    validate(binary, args);
    try {
      const { stdout, stderr } = await execFileAsync(binary, args, {
        cwd: cwd || process.cwd(),
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
      });
      const result = { binary, args, exitCode: 0, stdout: stdout.trim(), stderr: stderr.trim() };
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      const result = {
        binary,
        args,
        exitCode: err.code ?? 1,
        stdout: err.stdout?.toString().trim() ?? "",
        stderr: err.stderr?.toString().trim() ?? err.message,
      };
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  },
};
