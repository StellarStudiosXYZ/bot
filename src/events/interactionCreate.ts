import { Events, Interaction } from "discord.js";
import { commands } from "@/commands";
import { logger } from "@/utils/logger";

export default {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            logger.error(error, `Error executing /${interaction.commandName}`);

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply("Something went wrong.");
            } else {
                await interaction.reply({
                    content: "Something went wrong.",
                    ephemeral: true,
                });
            }
        }
    },
};
