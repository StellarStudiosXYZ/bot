import { Collection } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { logger } from "@/utils/logger";

type Command = {
    data: { name: string };
    execute: Function;
};

export const commands = new Collection<string, Command>();

export async function loadCommands() {
    const commandsPath = __dirname;
    let loadedCount = 0;

    const categories = fs
        .readdirSync(commandsPath, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

    for (const category of categories) {
        const categoryPath = path.join(commandsPath, category);
        const files = fs
            .readdirSync(categoryPath)
            .filter((f) => f.endsWith(".ts"));

        for (const file of files) {
            try {
                const { command } = await import(path.join(categoryPath, file));

                if (!command?.data || typeof command.execute !== "function") {
                    logger.warn(
                        { file: `${category}/${file}` },
                        "Invalid command export",
                    );
                    continue;
                }

                commands.set(command.data.name, command);
                loadedCount++;

                logger.info(
                    `Loaded command: /${command.data.name} (${category})`,
                );
            } catch (error) {
                logger.error(
                    { error, file: `${category}/${file}` },
                    "Failed to load command",
                );
            }
        }
    }

    logger.info(`Loaded ${loadedCount} commands`);
}
