import "dotenv/config";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type pg from "pg";

import { loadEnv } from "../config/env.js";
import { createPool, type PgPool } from "./pool.js";

export async function runMigrations(
  pool: Pick<pg.Pool, "connect">,
  migrationsDir = path.join(process.cwd(), "migrations")
): Promise<string[]> {
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const client = await pool.connect();
  const applied: string[] = [];

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    for (const file of files) {
      const existing = await client.query(
        "SELECT 1 FROM schema_migrations WHERE name = $1",
        [file]
      );

      if (existing.rowCount) {
        continue;
      }

      const sql = await readFile(path.join(migrationsDir, file), "utf8");

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
          file
        ]);
        await client.query("COMMIT");
        applied.push(file);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    client.release();
  }

  return applied;
}

async function main(): Promise<void> {
  const config = loadEnv();
  const pool: PgPool = createPool(config.migrationDatabaseUrl);

  try {
    const applied = await runMigrations(pool);
    if (applied.length === 0) {
      console.log("No pending migrations.");
      return;
    }

    console.log(`Applied migrations: ${applied.join(", ")}`);
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
