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

export const command = {
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Kick a user from the server")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("User to kick")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("reason")
                .setDescription("Reason for the kick")
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
                    errorContainer("You cannot kick yourself."),
                );
            }

            if (
                moderator.roles.highest.position <=
                targetMember.roles.highest.position
            ) {
                return interaction.followUp(
                    errorContainer(
                        "You cannot kick a user with equal or higher role than you.",
                    ),
                );
            }

            if (!targetMember.kickable) {
                return interaction.followUp(
                    errorContainer(
                        "I cannot kick this user due to permission hierarchy.",
                    ),
                );
            }

            if (targetMember.id === interaction.client.user?.id) {
                return interaction.followUp(
                    errorContainer("You cannot kick the bot."),
                );
            }
        }

        const caseId = await createCase({
            action: "KICK",
            targetUserId: targetUser.id,
            moderatorUserId: moderator.id,
            reason: reason,
            attachment: attachment?.url,
        });

        const formattedTime = new Date().toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

        const kickAuditReason =
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
                                    `### <:judgement:1466353777387901032> You were kicked from **${guild.name}**`,
                                ),
                            (t) =>
                                t.setContent(
                                    `<:channel:1315248776398766161> **Case ID**\n\`${caseId}\``,
                                ),
                            (t) =>
                                t.setContent(
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

            await targetUser.send({
                components: [dmContainer],
                flags: MessageFlags.IsComponentsV2,
            });
        } catch (error) {
            logger.error(
                error,
                `[MEMBER_KICK] Failed to DM User: ${targetUser.username} | ID: ${targetUser.id}`,
            );
        }

        await guild.members.kick(targetUser.id, kickAuditReason);

        logger.info(`[MEMBER_KICK] ${kickAuditReason}`);

        const successContainer = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                `<:judgement:1466353777387901032> **Action**\n\`MEMBER_KICK\`\n<:channel:1315248776398766161> **Case ID**\n \`${caseId}\``,
                            ),
                        (t) =>
                            t.setContent(
                                `<:member:1315248772527423551> **User**\n${targetUser} - \`${targetUser.id}\`\n<:shield:1466354394563088395> **Moderator**\n${interaction.user}`,
                            ),
                        (t) =>
                            t.setContent(
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
                                `<:judgement:1466353777387901032> **Action**\n\`MEMBER_KICK\`\n<:channel:1315248776398766161> **Case ID**\n \`${caseId}\``,
                            ),
                        (t) =>
                            t.setContent(
                                `<:member:1315248772527423551> **User**\n@${targetUser.username} - \`${targetUser.id}\`\n<:shield:1466354394563088395> **Moderator**\n${interaction.user}`,
                            ),
                        (t) =>
                            t.setContent(
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
