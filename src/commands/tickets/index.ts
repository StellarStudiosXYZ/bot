import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { handleTicketPanel } from "@/commands/tickets/panel";
import { handleTicketClose } from "@/commands/tickets/close";
import { handleTicketAdd } from "@/commands/tickets/add";
import { handleTicketRemove } from "@/commands/tickets/remove";
import { handleTicketHistory } from "@/commands/tickets/history";

export const command = {
    data: new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Tickets")
        .addSubcommand((s) =>
            s
                .setName("panel")
                .setDescription("Send or update ticket panel")
                .addStringOption((o) =>
                    o
                        .setName("message_id")
                        .setDescription(
                            "Message ID of an existing panel to update",
                        )
                        .setRequired(false),
                ),
        )
        .addSubcommand((s) =>
            s
                .setName("close")
                .setDescription("Close a ticket")
                .addStringOption((o) =>
                    o
                        .setName("ticket_id")
                        .setDescription("Ticket ID")
                        .setRequired(false),
                ),
        )
        .addSubcommand((s) =>
            s
                .setName("add")
                .setDescription("Add a user to a ticket")
                .addUserOption((o) =>
                    o
                        .setName("user")
                        .setDescription("User to add to the ticket")
                        .setRequired(true),
                )
                .addStringOption((o) =>
                    o
                        .setName("ticket_id")
                        .setDescription("Ticket ID")
                        .setRequired(false),
                ),
        )
        .addSubcommand((s) =>
            s
                .setName("remove")
                .setDescription("Remove a user from a ticket")
                .addUserOption((o) =>
                    o
                        .setName("user")
                        .setDescription("User to remove from the ticket")
                        .setRequired(true),
                )
                .addStringOption((o) =>
                    o
                        .setName("ticket_id")
                        .setDescription("Ticket ID")
                        .setRequired(false),
                ),
        )
        .addSubcommand((s) =>
            s
                .setName("history")
                .setDescription("View ticket history")
                .addUserOption((o) =>
                    o
                        .setName("user")
                        .setDescription("View ticket history for a user"),
                ),
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const sub = interaction.options.getSubcommand();

        if (sub === "panel") {
            return handleTicketPanel(interaction);
        }

        if (sub === "close") {
            return handleTicketClose(interaction);
        }

        if (sub === "add") {
            return handleTicketAdd(interaction);
        }

        if (sub === "remove") {
            return handleTicketRemove(interaction);
        }

        if (sub === "history") {
            return handleTicketHistory(interaction);
        }
    },
};
