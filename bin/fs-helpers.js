import { mkdir, cp, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";

export async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

export async function copySkillDir(srcDir, destParentDir, skillName) {
  const destDir = path.join(destParentDir, skillName);
  await mkdir(destParentDir, { recursive: true });
  await cp(srcDir, destDir, { recursive: true, force: true });
  return destDir;
}

/**
 * Merge a { mcpServers: { name: {...} } } block into a JSON config file,
 * creating the file if it doesn't exist and leaving any unrelated keys
 * (other MCP servers, unrelated settings) untouched.
 */
export async function upsertJsonMcpServer(configPath, serverName, serverEntry) {
  await mkdir(path.dirname(configPath), { recursive: true });

  let config = {};
  if (await exists(configPath)) {
    try {
      const raw = await readFile(configPath, "utf-8");
      config = raw.trim() ? JSON.parse(raw) : {};
    } catch (err) {
      throw new Error(
        `${configPath} exists but isn't valid JSON — refusing to overwrite it. ` +
          `Add the MCP server manually. (${err.message})`
      );
    }
  }

  config.mcpServers = config.mcpServers || {};
  const alreadyPresent = !!config.mcpServers[serverName];
  config.mcpServers[serverName] = serverEntry;

  await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
  return { configPath, alreadyPresent };
}

/**
 * Upsert a [mcp_servers.<name>] TOML table into Codex's config.toml.
 * Avoids pulling in a TOML parser dependency: if a table with this name
 * already exists, replace it in place; otherwise append.
 */
export async function upsertTomlMcpServer(configPath, serverName, tomlBlock) {
  await mkdir(path.dirname(configPath), { recursive: true });

  let content = "";
  if (await exists(configPath)) {
    content = await readFile(configPath, "utf-8");
  }

  const header = `[mcp_servers.${serverName}]`;
  const tableRegex = new RegExp(
    `\\[mcp_servers\\.${serverName}\\][^\\[]*`,
    "m"
  );

  const alreadyPresent = content.includes(header);
  if (alreadyPresent) {
    content = content.replace(tableRegex, tomlBlock.trimEnd() + "\n");
  } else {
    content = content.trimEnd() + (content.trim() ? "\n\n" : "") + tomlBlock.trimEnd() + "\n";
  }

  await writeFile(configPath, content, "utf-8");
  return { configPath, alreadyPresent };
}
