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
        .setName("warn")
        .setDescription("Warn a user")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("User to warn")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("reason")
                .setDescription("Reason for the warning")
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

        if (!moderator.roles.cache.has(env.MODERATOR_ROLE)) {
            return interaction.followUp(
                errorContainer(
                    "You do not have permission to use this command.",
                ),
            );
        }

        if (targetUser.id === moderator.id) {
            return interaction.followUp(
                errorContainer("You cannot warn yourself."),
            );
        }

        if (targetUser.id === interaction.client.user?.id) {
            return interaction.followUp(
                errorContainer("You cannot warn the bot."),
            );
        }

        const caseId = await createCase({
            action: "WARN",
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

        const warnAuditReason =
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
                                    `### <:judgement:1466353777387901032> You were warned in **${guild.name}**`,
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
                `[MEMBER_WARN] Failed to DM User: ${targetUser.username} | ID: ${targetUser.id}`,
            );
        }

        logger.info(`[MEMBER_WARN] ${warnAuditReason}`);

        const successContainer = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                `<:judgement:1466353777387901032> **Action**\n\`MEMBER_WARN\`\n<:channel:1315248776398766161> **Case ID**\n\`${caseId}\``,
                            ),
                        (t) =>
                            t.setContent(
                                `<:member:1315248772527423551> **User**\n${targetUser} - \`${targetUser.id}\`\n` +
                                    `<:shield:1466354394563088395> **Moderator**\n${interaction.user}`,
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

        await logsChannel.send({
            components: [successContainer],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: [] },
        });
    },
};
