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
        .setName("unban")
        .setDescription("Unban a user from the server")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("User to unban")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("reason")
                .setDescription("Reason for unban")
                .setRequired(true),
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const guild = interaction.guild!;
        const moderator = interaction.member as GuildMember;
        const targetUser = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason", true);

        if (!moderator.roles.cache.has(env.MODERATOR_ROLE)) {
            return interaction.followUp(
                errorContainer(
                    "You do not have permission to use this command.",
                ),
            );
        }

        const ban = await guild.bans.fetch(targetUser.id).catch(() => null);

        if (!ban) {
            return interaction.followUp(
                errorContainer("This user is not banned."),
            );
        }

        const caseId = await createCase({
            action: "UNBAN",
            targetUserId: targetUser.id,
            moderatorUserId: moderator.id,
            reason: reason,
        });

        const formattedTime = new Date().toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

        const unbanAuditReason = `#${caseId} ${formattedTime} | Reason: ${reason}`;

        try {
            const dmContainer = new ContainerBuilder()
                .setAccentColor(env.ACCENT_COLOR)
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            (t) =>
                                t.setContent(
                                    `### <:judgement:1466353777387901032> You were unbanned from **${guild.name}**`,
                                ),
                            (t) =>
                                t.setContent(
                                    `<:channel:1315248776398766161> **Case ID**\n\`${caseId}\``,
                                ),
                            (t) =>
                                t.setContent(
                                    `<:content:1465235859874910269> **Reason**\n\`\`\`${reason}\`\`\``,
                                ),
                        )
                        .setThumbnailAccessory((th) =>
                            th.setURL(
                                guild.iconURL({ size: 128 }) ??
                                    interaction.client.user!.displayAvatarURL({
                                        size: 128,
                                    }),
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
                `[MEMBER_UNBAN] Failed to DM User: ${targetUser.username} | ID: ${targetUser.id}`,
            );
        }

        await guild.members.unban(targetUser.id, unbanAuditReason);

        logger.info(`[MEMBER_UNBAN] ${unbanAuditReason}`);

        const successContainer = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                `<:judgement:1466353777387901032> **Action**\n\`MEMBER_UNBAN\`\n<:channel:1315248776398766161> **Case ID**\n\`${caseId}\``,
                            ),
                        (t) =>
                            t.setContent(
                                `<:member:1315248772527423551> **User**\n${targetUser} - \`${targetUser.id}\`\n` +
                                    `<:shield:1466354394563088395> **Moderator**\n${interaction.user}`,
                            ),
                        (t) =>
                            t.setContent(
                                `<:content:1465235859874910269> **Reason**\n\`\`\`${reason}\`\`\``,
                            ),
                    )
                    .setThumbnailAccessory((th) =>
                        th.setURL(
                            guild.iconURL({ size: 128 }) ??
                                interaction.client.user!.displayAvatarURL({
                                    size: 128,
                                }),
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
