import { REST, Routes } from "discord.js";
import { env } from "@/config/env";
import { getCommandsHash, getCommandPayload } from "@commands/registry";
import { getLastHash, setLastHash } from "@commands/deploy-state";
import { logger } from "@/utils/logger";

export async function deployCommandsIfNeeded() {
    const currentHash = getCommandsHash();
    const lastHash = getLastHash();

    if (currentHash === lastHash) {
        logger.info("Commands unchanged — skipping deploy");
        return;
    }

    logger.info("Command changes detected — deploying");

    const rest = new REST({ version: "10" }).setToken(env.DISCORD_BOT_TOKEN);

    await rest.put(
        Routes.applicationGuildCommands(
            env.DISCORD_CLIENT_ID,
            env.DISCORD_GUILD_ID,
        ),
        { body: getCommandPayload() },
    );

    setLastHash(currentHash);
    logger.info("Commands deployed successfully");
}
