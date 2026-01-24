import { Client, Events } from "discord.js";
import { logger } from "@/utils/logger";

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client: Client<true>) {
        logger.info(`Logged in as ${client.user.tag} (ID: ${client.user.id})`);
        client.guilds.cache.forEach(guild => {
          logger.info(`Server - ${guild.name} (ID: ${guild.id})`);
        })
    },
};
