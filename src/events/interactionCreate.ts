import { Events, Interaction } from "discord.js";
import { commands } from "@/commands";
import { logger } from "@/utils/logger";
import { handleProductsButton } from "@/buttons/products";
import { handleCasesButton } from "@/buttons/cases";
import { handleTicketsButton } from "@/buttons/tickets";
import { handleTicketCreateModal } from "@/modals/tickets";
import { errorContainer } from "@/utils/errorContainer";

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

                    case "cases":
                        await handleCasesButton(interaction);
                        break;

                    case "tickets":
                        await handleTicketsButton(interaction);
                        break;
                }
            }

            if (interaction.isModalSubmit()) {
                const [namespace, action] = interaction.customId.split(":");

                switch (namespace) {
                    case "tickets":
                        switch (action) {
                            case "create":
                                await handleTicketCreateModal(interaction);
                                break;
                        }
                        break;
                }
            }
        } catch (err) {
            logger.error(err);
            if (
                interaction.isRepliable() &&
                (interaction.deferred || interaction.replied)
            ) {
                await interaction.editReply(
                    errorContainer("Something went wrong."),
                );
            }
        }
    },
};
