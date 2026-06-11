import pg from "pg";

const { Pool } = pg;

export type PgPool = pg.Pool;
export type Queryable = Pick<pg.Pool, "query"> | Pick<pg.PoolClient, "query">;

export function createPool(databaseUrl: string): PgPool {
  return new Pool({
    connectionString: databaseUrl
  });
}
