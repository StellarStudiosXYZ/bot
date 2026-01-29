import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
    time,
    TimestampStyles,
    GuildMember,
} from "discord.js";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import { errorContainer } from "@/utils/errorContainer";
import { createCase } from "@/utils/createCase";

function formatDuration(seconds: number) {
    if (seconds % 86400 === 0) return `${seconds / 86400} Day(s)`;
    if (seconds % 3600 === 0) return `${seconds / 3600} Hour(s)`;
    if (seconds % 60 === 0) return `${seconds / 60} Minute(s)`;
    return `${seconds}s`;
}

export const command = {
    data: new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("Timeout a user")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("User to timeout")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("reason").setDescription("Reason").setRequired(true),
        )
        .addIntegerOption((option) =>
            option
                .setName("duration")
                .setDescription("Timeout duration")
                .addChoices(
                    { name: "5 Minutes", value: 5 * 60 },
                    { name: "10 Minutes", value: 10 * 60 },
                    { name: "30 Minutes", value: 30 * 60 },
                    { name: "1 Hour", value: 60 * 60 },
                    { name: "6 Hours", value: 6 * 60 * 60 },
                    { name: "12 Hours", value: 12 * 60 * 60 },
                    { name: "1 Day", value: 24 * 60 * 60 },
                    { name: "3 Days", value: 3 * 24 * 60 * 60 },
                    { name: "7 Days", value: 7 * 24 * 60 * 60 },
                )
                .setRequired(true),
        )
        .addAttachmentOption((option) =>
            option
                .setName("attachment")
                .setDescription("Image or file related to this case")
                .setRequired(false),
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const guild = interaction.guild!;
        const moderator = interaction.member as GuildMember;
        const targetUser = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason", true);
        const duration = interaction.options.getInteger("duration", true);
        const attachment = interaction.options.getAttachment("attachment");
        const targetMember = guild.members.cache.get(targetUser.id);

        if (!moderator.roles.cache.has(env.MODERATOR_ROLE)) {
            return interaction.followUp(
                errorContainer(
                    "You do not have permission to use this command.",
                ),
            );
        }

        if (targetMember) {
            if (targetMember.id === moderator.id) {
                return interaction.followUp(
                    errorContainer("You cannot timeout yourself."),
                );
            }

            if (
                moderator.roles.highest.position <=
                targetMember.roles.highest.position
            ) {
                return interaction.followUp(
                    errorContainer(
                        "You cannot timeout a user with equal or higher role than you.",
                    ),
                );
            }

            if (!targetMember.bannable) {
                return interaction.followUp(
                    errorContainer(
                        "I cannot timeout this user due to permission hierarchy.",
                    ),
                );
            }

            if (targetMember.id === interaction.client.user?.id) {
                return interaction.followUp(
                    errorContainer("You cannot timeout the bot."),
                );
            }
        }

        const caseId = await createCase({
            action: "TIMEOUT",
            targetUserId: targetUser.id,
            moderatorUserId: moderator.id,
            reason: reason,
            attachment: attachment?.url,
            duration: duration,
        });

        const formattedTime = new Date().toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

        const timeoutAuditReason =
            `#${caseId} ${formattedTime} | Reason: ${reason}` +
            (attachment ? ` | Attachment: ${attachment.url}` : "");

        try {
            const dmContainer = new ContainerBuilder()
                .setAccentColor(env.ACCENT_COLOR)
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            (t) =>
                                t.setContent(
                                    `### <:judgement:1466353777387901032> You were timed out in **${guild.name}**`,
                                ),
                            (t) =>
                                t.setContent(
                                    `<:channel:1315248776398766161> **Case ID**\n\`${caseId}\``,
                                ),
                            (t) =>
                                t.setContent(
                                    `\`⏱️\` **Duration**\n${formatDuration(duration)}\n` +
                                        `<:content:1465235859874910269> **Reason**\n\`\`\`${reason}\`\`\`` +
                                        (attachment
                                            ? `<:camera:1466384904064467101> **Attachment**\n${attachment.url}`
                                            : ""),
                                ),
                        )
                        .setThumbnailAccessory((th) =>
                            th.setURL(
                                guild.iconURL({ size: 128 }) ??
                                    targetUser.displayAvatarURL({ size: 128 }),
                            ),
                        ),
                )
                .addTextDisplayComponents((t) =>
                    t.setContent(
                        `-# ${time(
                            new Date(),
                            TimestampStyles.FullDateShortTime,
                        )}`,
                    ),
                );

            await targetUser.send({
                components: [dmContainer],
                flags: MessageFlags.IsComponentsV2,
            });
        } catch (error) {
            logger.error(
                error,
                `[MEMBER_TIMEOUT] Failed to DM ${targetUser.id}`,
            );
        }

        await targetMember!.timeout(duration * 1000, timeoutAuditReason);

        logger.info(`[MEMBER_TIMEOUT] ${timeoutAuditReason}`);

        const successContainer = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                `<:judgement:1466353777387901032> **Action**\n\`MEMBER_TIMEOUT\`\n<:channel:1315248776398766161> **Case ID**\n\`${caseId}\``,
                            ),
                        (t) =>
                            t.setContent(
                                `<:member:1315248772527423551> **User**\n${targetUser} - \`${targetUser.id}\`\n<:shield:1466354394563088395> **Moderator**\n${interaction.user}`,
                            ),
                        (t) =>
                            t.setContent(
                                `\`⏱️\` **Duration**\n${formatDuration(duration)}\n` +
                                    `<:content:1465235859874910269> **Reason**\n\`\`\`${reason}\`\`\`` +
                                    (attachment
                                        ? `<:camera:1466384904064467101> **Attachment**\n${attachment.url}`
                                        : ""),
                            ),
                    )
                    .setThumbnailAccessory((th) =>
                        th.setURL(
                            guild.iconURL({ size: 128 }) ??
                                targetUser.displayAvatarURL({ size: 128 }),
                        ),
                    ),
            )
            .addTextDisplayComponents((t) =>
                t.setContent(
                    `-# ${time(new Date(), TimestampStyles.FullDateShortTime)}`,
                ),
            );

        await interaction.followUp({
            components: [successContainer],
            flags: MessageFlags.IsComponentsV2,
        });

        const logsChannel = guild.channels.cache.get(env.SERVER_LOGS_CHANNEL);
        if (!logsChannel || !logsChannel.isTextBased()) return;

        const logContainer = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                `<:judgement:1466353777387901032> **Action**\n\`MEMBER_TIMEOUT\`\n<:channel:1315248776398766161> **Case ID**\n \`${caseId}\``,
                            ),
                        (t) =>
                            t.setContent(
                                `<:member:1315248772527423551> **User**\n@${targetUser.username} - \`${targetUser.id}\`\n<:shield:1466354394563088395> **Moderator**\n${interaction.user}`,
                            ),
                        (t) =>
                            t.setContent(
                                `\`⏱️\` **Duration**\n${formatDuration(duration)}\n` +
                                    `<:content:1465235859874910269> **Reason**\n\`\`\`${reason}\`\`\`` +
                                    (attachment
                                        ? `<:camera:1466384904064467101> **Attachment**\n${attachment.url}`
                                        : ""),
                            ),
                    )
                    .setThumbnailAccessory((th) =>
                        th.setURL(
                            guild.iconURL({ size: 128 }) ??
                                targetUser.displayAvatarURL({ size: 128 }),
                        ),
                    ),
            )
            .addTextDisplayComponents((t) =>
                t.setContent(
                    `-# ${time(new Date(), TimestampStyles.FullDateShortTime)}`,
                ),
            );

        await logsChannel.send({
            components: [logContainer],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: [] },
        });
    },
};
