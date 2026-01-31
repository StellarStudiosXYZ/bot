import {
    ModalBuilder,
    LabelBuilder,
    TextInputBuilder,
    TextInputStyle,
    FileUploadBuilder,
    StringSelectMenuBuilder,
    ModalSubmitInteraction,
} from "discord.js";
import { createTicket } from "@/services/tickets/createTicket";

export function buildTicketCreateModal() {
    const categoryLabel = new LabelBuilder()
        .setLabel("Ticket category")
        .setStringSelectMenuComponent(
            new StringSelectMenuBuilder()
                .setCustomId("category")
                .setPlaceholder("Select ticket category")
                .setRequired(true)
                .addOptions([
                    {
                        label: "Support",
                        value: "SUPPORT",
                        emoji: { id: "1466820484912910387" },
                        description: "Get help using our product or service.",
                    },
                    {
                        label: "Question",
                        value: "QUESTION",
                        emoji: { id: "1466821157524340858" },
                        description: "General inquiries and information.",
                    },
                    {
                        label: "Bug Report",
                        value: "BUG",
                        emoji: { id: "1466820490059583519" },
                        description: "Something isn’t working as expected.",
                    },
                    {
                        label: "Other",
                        value: "OTHER",
                        emoji: { id: "1466820487547195589" },
                        description: "Anything else that doesn’t fit above.",
                    },
                ]),
        );

    const titleLabel = new LabelBuilder()
        .setLabel("Title")
        .setTextInputComponent(
            new TextInputBuilder()
                .setCustomId("title")
                .setPlaceholder("Provide a brief title for your ticket")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(100),
        );

    const descriptionLabel = new LabelBuilder()
        .setLabel("Description")
        .setTextInputComponent(
            new TextInputBuilder()
                .setCustomId("description")
                .setPlaceholder("Provide as much detail as possible")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(4000),
        );

    const fileUploadLabel = new LabelBuilder()
        .setLabel("Attachment (optional)")
        .setFileUploadComponent(
            new FileUploadBuilder().setCustomId("file").setRequired(false),
        );

    return new ModalBuilder()
        .setCustomId("tickets:create")
        .setTitle("Create Ticket")
        .addLabelComponents(
            categoryLabel,
            titleLabel,
            descriptionLabel,
            fileUploadLabel,
        );
}

export async function handleTicketCreateModal(
    interaction: ModalSubmitInteraction,
) {
    if (interaction.customId !== "tickets:create") return;
    return createTicket(interaction);
}
