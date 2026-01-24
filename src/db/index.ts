import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

pool.on("connect", () => {
    logger.info("Connected to PostgreSQL");
});

pool.on("error", (error) => {
    logger.error(error, "PostgreSQL pool error");
});

export const db = drizzle(pool, { schema });
