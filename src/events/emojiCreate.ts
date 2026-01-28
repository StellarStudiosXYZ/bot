import {
    Events,
    GuildEmoji,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
    time,
    TimestampStyles,
} from "discord.js";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

export default {
    name: Events.GuildEmojiCreate,
    async execute(emoji: GuildEmoji) {
        const logsChannel = emoji.guild.channels.cache.get(
            env.SERVER_LOGS_CHANNEL,
        );
        if (!logsChannel || !logsChannel.isTextBased()) return;

        logger.info(`[EMOJI_CREATE] ${emoji.name} (${emoji.id})`);

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                `<:settings:1315248897051983873> **Event**\n\`EMOJI_CREATE\``,
                            ),
                        (t) =>
                            t.setContent(
                                `<:mention:1315248893910581249> **Name**\n\`:${emoji.name}:\``,
                            ),
                    )
                    .setThumbnailAccessory((th) => th.setURL(emoji.imageURL())),
            )
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
