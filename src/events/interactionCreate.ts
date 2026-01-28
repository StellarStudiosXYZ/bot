import { Events, Interaction } from "discord.js";
import { commands } from "@/commands";
import { logger } from "@/utils/logger";
import { handleProductsButton } from "@/buttons/products";

export default {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        try {
            if (interaction.isChatInputCommand()) {
                const command = commands.get(interaction.commandName);
                if (!command) return;
                await command.execute(interaction);
                return;
            }

            if (interaction.isButton()) {
                const [namespace] = interaction.customId.split(":");

                switch (namespace) {
                    case "products":
                        await handleProductsButton(interaction);
                        break;
                }
            }
        } catch (err) {
            logger.error(err);
            if (
                interaction.isRepliable() &&
                (interaction.deferred || interaction.replied)
            ) {
                await interaction.editReply("Something went wrong.");
            }
        }
    },
};
