import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { seedSql } from "../tests/helpers/account-seed";

const DATABASE = "ap-calculus-practice";

function run(args: string[]): void {
  execFileSync("npx", ["wrangler", ...args], { stdio: "inherit" });
}

async function main(): Promise<void> {
  // `d1 migrations apply` waits for a confirmation that a test server cannot
  // give. The migration only uses CREATE ... IF NOT EXISTS, so run it directly.
  run(["d1", "execute", DATABASE, "--local", "--file", "migrations/0001_accounts.sql"]);
  const directory = mkdtempSync(path.join(tmpdir(), "ap-calculus-db-"));
  try {
    const file = path.join(directory, "seed.sql");
    writeFileSync(file, await seedSql(), "utf8");
    run(["d1", "execute", DATABASE, "--local", "--file", file]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  console.error(`[db:local] ${(error as Error).message}`);
  process.exitCode = 1;
});
