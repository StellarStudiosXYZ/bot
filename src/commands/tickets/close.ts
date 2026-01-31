import {
    ChatInputCommandInteraction,
    ContainerBuilder,
    MessageFlags,
    GuildMember,
    ChannelType,
    GuildTextBasedChannel,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/config/env";
import { errorContainer } from "@/utils/errorContainer";

export async function handleTicketClose(
    interaction: ChatInputCommandInteraction,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild!;
    const member = interaction.member as GuildMember;
    const ticketIdInput = interaction.options.getString("ticket_id");
    const isStaff = member.roles.cache.has(env.SUPPORT_ROLE);

    let ticket;
    let channel: GuildTextBasedChannel;

    if (ticketIdInput) {
        if (!isStaff) {
            return interaction.editReply(
                errorContainer(
                    "You do not have permission to close tickets by ID.",
                ),
            );
        }

        ticket = await db.query.tickets.findFirst({
            where: eq(tickets.id, ticketIdInput),
        });

        if (!ticket) {
            return interaction.editReply(errorContainer("Ticket not found."));
        }

        const fetched = guild.channels.cache.get(ticket.channelId);
        if (!fetched || fetched.type !== ChannelType.GuildText) {
            return interaction.editReply(
                errorContainer("Ticket channel no longer exists."),
            );
        }

        channel = fetched;
    } else {
        if (
            !interaction.channel ||
            interaction.channel.type !== ChannelType.GuildText
        ) {
            return interaction.editReply(
                errorContainer("Invalid ticket channel."),
            );
        }

        ticket = await db.query.tickets.findFirst({
            where: eq(tickets.channelId, interaction.channel.id),
        });

        if (!ticket) {
            return interaction.editReply(
                errorContainer("This channel is not a ticket."),
            );
        }

        if (!isStaff && ticket.discordUserId !== interaction.user.id) {
            return interaction.editReply(
                errorContainer(
                    "Only the ticket creator or staff can close this ticket.",
                ),
            );
        }

        channel = interaction.channel;
    }

    if (ticket.status !== "OPEN") {
        return interaction.editReply(
            errorContainer("This ticket cannot be closed."),
        );
    }

    const container = new ContainerBuilder()
        .addTextDisplayComponents((t) =>
            t.setContent(
                `Are you sure you want to close ticket <#${ticket.channelId}>?`,
            ),
        )
        .addActionRowComponents((row) =>
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`tickets:close_confirm:${ticket.id}`)
                    .setLabel("Yes, close ticket")
                    .setStyle(ButtonStyle.Danger),
            ),
        )
        .setAccentColor(env.ACCENT_COLOR);

    return interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
    });
}
