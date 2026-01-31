import {
    ChatInputCommandInteraction,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
    ChannelType,
    GuildMember,
    time,
    TimestampStyles,
} from "discord.js";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import { errorContainer } from "@/utils/errorContainer";
import { successContainer } from "@/utils/successContainer";

export async function handleTicketAdd(
    interaction: ChatInputCommandInteraction,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild!;
    const member = interaction.member as GuildMember;
    const targetUser = interaction.options.getUser("user", true);
    const ticketIdInput = interaction.options.getString("ticket_id");
    const isStaff = member.roles.cache.has(env.SUPPORT_ROLE);

    if (!isStaff) {
        return interaction.editReply(
            errorContainer("Only staff can add users to tickets."),
        );
    }

    let ticket;
    let channel;

    if (ticketIdInput) {
        ticket = await db.query.tickets.findFirst({
            where: eq(tickets.id, ticketIdInput),
        });

        if (!ticket) {
            return interaction.editReply(errorContainer("Ticket not found."));
        }

        channel = guild.channels.cache.get(ticket.channelId);
    } else {
        channel = interaction.channel;

        if (!channel || channel.type !== ChannelType.GuildText) {
            return interaction.editReply(
                errorContainer("Invalid ticket channel."),
            );
        }

        ticket = await db.query.tickets.findFirst({
            where: eq(tickets.channelId, channel.id),
        });

        if (!ticket) {
            return interaction.editReply(
                errorContainer("This channel is not a ticket."),
            );
        }
    }

    if (!channel || channel.type !== ChannelType.GuildText) {
        return interaction.editReply(
            errorContainer("Ticket channel no longer exists."),
        );
    }

    await channel.permissionOverwrites.edit(targetUser.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
    });

    await channel.send({
        components: [
            new ContainerBuilder()
                .setAccentColor(env.ACCENT_COLOR)
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            (t) => t.setContent(`### User Added to Ticket`),
                            (t) =>
                                t.setContent(
                                    `<:member:1315248772527423551> **User Added**\n${targetUser} - \`${targetUser.id}\``,
                                ),
                            (t) =>
                                t.setContent(
                                    `<:member:1315248772527423551> **Added By**\n${interaction.user} - \`${interaction.user.id}\``,
                                ),
                        )
                        .setThumbnailAccessory((th) =>
                            th.setURL(
                                channel.guild?.iconURL({ size: 128 }) ??
                                    "https://cdn.discordapp.com/embed/avatars/0.png",
                            ),
                        ),
                )
                .addTextDisplayComponents((t) =>
                    t.setContent(
                        `-# ${time(new Date(), TimestampStyles.FullDateShortTime)}`,
                    ),
                ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: {
            users: [targetUser.id],
        },
    });

    logger.info(
        `[TICKET_MEMBER_ADD] ${targetUser.username} (${targetUser.id}) was added to ticket #${ticket.id} by ${interaction.user.username} (${interaction.user.id}).`,
    );

    return interaction.followUp(
        successContainer(
            `${targetUser.tag} was added to ticket <#${ticket.channelId}>.`,
        ),
    );
}
