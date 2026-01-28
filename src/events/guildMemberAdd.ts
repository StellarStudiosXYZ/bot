import {
    Events,
    GuildMember,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
    time,
    TimestampStyles,
} from "discord.js";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

export default {
    name: Events.GuildMemberAdd,
    async execute(member: GuildMember) {
        if (member.user.bot) return;

        const logsChannel = member.guild.channels.cache.get(
            env.SERVER_LOGS_CHANNEL,
        );
        const memberRole = member.guild.roles.cache.get(env.MEMBER_ROLE);

        if (!logsChannel || !logsChannel.isTextBased() || !memberRole) return;

        try {
            await new Promise((r) => setTimeout(r, 1000));

            await member.roles.add(memberRole, "Auto-assigned on join");

            logger.info(
                `[MEMBER_JOIN] Assigned ${memberRole.name} to ${member.user.username} (${member.id})`,
            );
        } catch (error) {
            logger.error(
                error,
                `[MEMBER_JOIN] Failed to assign role to ${member.user.username} (${member.id})`,
            );
        }

        logger.info(
            `[MEMBER_JOIN] Username: ${member.user.username} | ID: ${member.id}`,
        );

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                `<:settings:1315248897051983873> **Event**\n\`MEMBER_JOIN\``,
                            ),
                        (t) =>
                            t.setContent(
                                `<:member:1315248772527423551> **User**\n<@${member.id}> - \`${member.user.username}\``,
                            ),
                    )
                    .setThumbnailAccessory((th) =>
                        th.setURL(member.user.displayAvatarURL({ size: 128 })),
                    ),
            )
            .addTextDisplayComponents((t) =>
                t.setContent(
                    `-# ${time(
                        member.joinedAt ?? new Date(),
                        TimestampStyles.FullDateShortTime,
                    )}`,
                ),
            );

        await logsChannel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: [] },
        });
    },
};
