import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function connect() {
    await client.connect();
    logger.info("Connected to Database");
}

connect().catch((err) => {
    logger.error(err, "Failed to connect to Database");
    process.exit(1);
});

client.on("error", (error) => {
    logger.error(error, "PostgreSQL client error");
});

export const db = drizzle(client, { schema });
