import { Pool, PoolClient, QueryResult } from "pg";
import { appConfig } from "../utils/config";

// const pool = new Pool({
//   host: appConfig.DB_HOST,
//   port: appConfig.DB_PORT,
//   user: appConfig.DB_USER,
//   password: appConfig.DB_PASSWORD,
//   database: appConfig.DB_NAME,
//   // ssl: {
//   //     rejectUnauthorized: false  // For testing. Use proper CA in production.
//   // }
// });

let pool: any;
if (Number(process.env.IS_PROD) === 1) {
  pool = new Pool({
    connectionString: appConfig.DB_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })
} else {
  pool = new Pool({
    connectionString: appConfig.DB_URL,
  })
}

export async function openDb(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}

export async function getDbClient(): Promise<PoolClient> {
  return pool.connect();
}

export async function runQuery(
  q: string,
  params: any[] = [],
  client?: PoolClient
) {
  const executor: { query: (text: string, params?: any[]) => Promise<QueryResult> } =
    client ?? pool;

  const res = await executor.query(q, params);

  if (res.rows && res.rows.length > 0) {
    return res.rows;
  }

  return {
    changes: res.rowCount,
  };
}