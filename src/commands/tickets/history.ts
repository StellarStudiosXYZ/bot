import {
    ChatInputCommandInteraction,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
    GuildMember,
    time,
    TimestampStyles,
} from "discord.js";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { env } from "@/config/env";
import { errorContainer } from "@/utils/errorContainer";
import { buildPaginationRow } from "@/utils/pagination";

export async function handleTicketHistory(
    interaction: ChatInputCommandInteraction,
) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const member = interaction.member as GuildMember;
    const targetUser =
        interaction.options.getUser("user") ?? interaction.user;

    if (
        targetUser.id !== interaction.user.id &&
        !member.roles.cache.has(env.SUPPORT_ROLE)
    ) {
        return interaction.editReply(
            errorContainer(
                "You do not have permission to view other users' ticket history.",
            ),
        );
    }

    const page = 1;
    const offset = (page - 1) * 1;

    const total = await db
        .select({ count: count(tickets.id) })
        .from(tickets)
        .where(eq(tickets.discordUserId, targetUser.id))
        .then((r) => r[0].count);

    if (total === 0) {
        return interaction.editReply(
            errorContainer("No tickets found for this user."),
        );
    }

    const [ticket] = await db
        .select()
        .from(tickets)
        .where(eq(tickets.discordUserId, targetUser.id))
        .orderBy(desc(tickets.createdAt))
        .limit(1)
        .offset(offset);

    const container = new ContainerBuilder()
        .setAccentColor(env.ACCENT_COLOR)
        .addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    (t) =>
                        t.setContent(
                            `## <:mailopen:1467092687042773076> Ticket History`,
                        ),
                    (t) =>
                        t.setContent(
                            `<:channel:1315248776398766161> **Ticket ID**\n\`${ticket.id}\`\n` +
                                `<:folder:1476101710916354252> **Category**\n\`${ticket.category}\`\n` +
                                `<:focus:1476101713130815649> **Status**\n\`${ticket.status}\``,
                        ),
                    (t) =>
                        t.setContent(
                            `<:calender:1467417818843578451> **Created**\n${time(
                                ticket.createdAt,
                                TimestampStyles.FullDateShortTime,
                            )}\n` +
                                (ticket.closedAt
                                    ? `\`🔒\` **Closed**\n${time(
                                          ticket.closedAt,
                                          TimestampStyles.FullDateShortTime,
                                      )}\n`
                                    : "") +
                                (ticket.status === "OPEN"
                                    ? `<:link:1467155398942396581> **Channel**\n<#${ticket.channelId}>\n`
                                    : "") +
                                (ticket.transcriptUrl
                                    ? `<:content:1465235859874910269> **Transcript**\n${ticket.transcriptUrl}`
                                    : ""),
                        ),
                )
                .setThumbnailAccessory((th) =>
                    th.setURL(
                        interaction.guild?.iconURL() ??
                            interaction.user.displayAvatarURL(),
                    ),
                ),
        )
        .addTextDisplayComponents((t) =>
            t.setContent(`-# User ID: ${targetUser.id}`),
        );

    const paginationRow = buildPaginationRow(
        "tickets:history",
        page,
        Math.ceil(total / 1),
    );

    return interaction.editReply({
        components: [container, paginationRow],
        flags: MessageFlags.IsComponentsV2,
    });
}
