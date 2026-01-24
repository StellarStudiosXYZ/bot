import { client } from "@/client";
import fs from "node:fs";
import path from "node:path";
import { logger } from "@/utils/logger";

export async function registerEvents() {
    const eventsPath = path.join(__dirname);

    const eventFiles = fs
        .readdirSync(eventsPath)
        .filter((file) => file !== "index.ts" && file.endsWith(".ts"));

    let loadedCount = 0;

    for (const file of eventFiles) {
        try {
            const { default: event } = await import(
                path.join(eventsPath, file)
            );

            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }

            loadedCount++;
            logger.info(`Loaded event: ${event.name}`);
        } catch (error) {
            logger.error({ error, file }, "Failed to load event");
        }
    }

    logger.info(`Loaded ${loadedCount} events`);
}
