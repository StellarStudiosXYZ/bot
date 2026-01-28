import {
    Events,
    GuildBan,
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    MessageFlags,
    time,
    TimestampStyles,
} from "discord.js";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

export default {
    name: Events.GuildBanRemove,
    async execute(ban: GuildBan) {
        const logsChannel = ban.guild.channels.cache.get(
            env.SERVER_LOGS_CHANNEL,
        );
        if (!logsChannel || !logsChannel.isTextBased()) return;

        logger.info(
            `[BAN_REMOVE] User: ${ban.user.username} | ID: ${ban.user.id}`,
        );

        const section = new SectionBuilder()
            .addTextDisplayComponents(
                (t) =>
                    t.setContent(
                        `<:settings:1315248897051983873> **Event**\n\`BAN_REMOVE\``,
                    ),
                (t) =>
                    t.setContent(
                        `<:member:1315248772527423551> **User**\n${ban.user} - \`${ban.user.username}\``,
                    ),
            )
            .setThumbnailAccessory((th) =>
                th.setURL(ban.user.displayAvatarURL({ size: 128 })),
            );

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(section)
            .addTextDisplayComponents((t) =>
                t.setContent(
                    `-# ${time(new Date(), TimestampStyles.FullDateShortTime)}`,
                ),
            );

        await logsChannel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: [] },
        });
    },
};
