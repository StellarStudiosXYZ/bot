import { client } from "@/client";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import { registerEvents } from "@/events";
import { loadCommands } from "@/commands";
import { deployCommandsIfNeeded } from "@/commands/deploy";

async function bootstrap() {
    await registerEvents();
    await loadCommands();
    await deployCommandsIfNeeded();
    await client.login(env.DISCORD_BOT_TOKEN);
}

bootstrap().catch((error) => {
    logger.fatal(error, "Failed to start dicsord bot");
    process.exit(1);
});
