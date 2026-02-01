import {
    ChatInputCommandInteraction,
    ContainerBuilder,
    SectionBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    GuildMember,
    ChannelType,
    time,
    TimestampStyles,
} from "discord.js";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import { errorContainer } from "@/utils/errorContainer";
import { successContainer } from "@/utils/successContainer";

export async function handleTicketPanel(
    interaction: ChatInputCommandInteraction,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const member = interaction.member;
    if (
        !(member instanceof GuildMember) ||
        !member.roles.cache.has(env.MODERATOR_ROLE)
    ) {
        return interaction.editReply(
            errorContainer("You do not have permission to use this command."),
        );
    }

    const panelChannel = interaction.guild?.channels.cache.get(
        env.TICKET_CREATION_CHANNEL,
    );

    if (!panelChannel || panelChannel.type !== ChannelType.GuildText) {
        return interaction.editReply(
            errorContainer("Ticket creation channel is misconfigured."),
        );
    }

    const messageId = interaction.options.getString("message_id");

    const now = new Date();

    const supportStart = new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            3,
            30,
            0,
        ),
    );

    const supportEnd = new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            18,
            30,
            0,
        ),
    );

    const container = new ContainerBuilder()
        .addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    (t) =>
                        t.setContent(
                            "## <:information:1467086356470567016> Tickets Information",
                        ),
                    (t) =>
                        t.setContent(
                            "- **Support Hours**\n" +
                                `> We generally respond to tickets between ${time(supportStart, TimestampStyles.ShortTime)} and ${time(supportEnd, TimestampStyles.ShortTime)} and may be unavailable outside of these hours.`,
                        ),
                    (t) =>
                        t.setContent(
                            "- **Link your Account**\n" +
                                `> For faster support please link your purchases by running </product link:1464885667040460801> command in a channel of your choice.\n`,
                        ),
                )
                .setThumbnailAccessory((th) =>
                    th.setURL(
                        interaction.guild?.iconURL({ size: 128 }) ??
                            "https://cdn.discordapp.com/embed/avatars/0.png",
                    ),
                ),
        )
        .addSeparatorComponents((s) => s.setDivider(true))
        .addTextDisplayComponents((t) =>
            t.setContent("## <:mailopen:1467092687042773076> Create Ticket"),
        )
        .addTextDisplayComponents((t) =>
            t.setContent(
                "> Click the button below to create a ticket and we will assist you as soon as possible.",
            ),
        )
        .addActionRowComponents((row) =>
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId("tickets:create")
                    .setLabel("Create Ticket")
                    .setEmoji("<:ticket:1467083178203156704>")
                    .setStyle(ButtonStyle.Primary),
            ),
        )
        .setAccentColor(env.ACCENT_COLOR);

    if (messageId) {
        let message;
        try {
            message = await panelChannel.messages.fetch(messageId);
        } catch {
            return interaction.editReply(
                errorContainer(
                    "Message not found in the ticket creation channel.",
                ),
            );
        }

        await message.edit({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });

        logger.info(
            `[TICKET_PANEL] Panel updated in #${panelChannel.name} (${panelChannel.id}) by ${interaction.user.username} (${interaction.user.id})`,
        );

        return interaction.editReply(
            successContainer("Ticket panel has been updated."),
        );
    }

    await panelChannel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
    });

    logger.info(
        `[TICKET_PANEL] Panel sent to #${panelChannel.name} (${panelChannel.id}) by ${interaction.user.username} (${interaction.user.id})`,
    );

    return interaction.editReply(
        successContainer("Ticket panel has been sent."),
    );
}
