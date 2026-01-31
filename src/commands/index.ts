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
    let registeredCount = 0;
    let executableCount = 0;

    const categories = fs
        .readdirSync(commandsPath, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

    for (const category of categories) {
        const categoryPath = path.join(commandsPath, category);

        const indexFile = path.join(categoryPath, "index.ts");
        const files = fs.existsSync(indexFile)
            ? ["index.ts"]
            : fs.readdirSync(categoryPath).filter((f) => f.endsWith(".ts"));

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
                registeredCount++;

                const json = command.data.toJSON();
                const options = json.options ?? [];

                const subcommands = options.filter((o: any) => o.type === 1);
                const subcommandGroups = options.filter(
                    (o: any) => o.type === 2,
                );

                if (subcommands.length === 0 && subcommandGroups.length === 0) {
                    executableCount++;
                    logger.info(
                        `Loaded command: /${command.data.name} (${category})`,
                    );
                } else {
                    for (const sub of subcommands) {
                        executableCount++;
                        logger.info(
                            `Loaded command: /${command.data.name} ${sub.name} (${category})`,
                        );
                    }

                    for (const group of subcommandGroups) {
                        for (const sub of group.options ?? []) {
                            executableCount++;
                            logger.info(
                                `Loaded command: /${command.data.name} ${group.name} ${sub.name} (${category})`,
                            );
                        }
                    }
                }
            } catch (error) {
                logger.error(
                    { error, file: `${category}/${file}` },
                    "Failed to load command",
                );
            }
        }
    }

    logger.info(
        `Loaded ${registeredCount} registered commands (${executableCount} usable commands)`,
    );
}
