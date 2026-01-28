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
    name: Events.GuildEmojiUpdate,
    async execute(oldEmoji: GuildEmoji, newEmoji: GuildEmoji) {
        if (oldEmoji.name === newEmoji.name) return;

        const logsChannel = newEmoji.guild.channels.cache.get(
            env.SERVER_LOGS_CHANNEL,
        );
        if (!logsChannel || !logsChannel.isTextBased()) return;

        logger.info(
            `[EMOJI_UPDATE] Name: ${newEmoji.name} | ID: ${newEmoji.id}`,
        );

        const container = new ContainerBuilder()
            .setAccentColor(0x7040ff)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                `<:settings:1315248897051983873> **Event**\n\`EMOJI_UPDATE\``,
                            ),
                        (t) =>
                            t.setContent(
                                `<:mention:1315248893910581249> **Name**\n\`:${oldEmoji.name}:\` → \`:${newEmoji.name}:\``,
                            ),
                    )
                    .setThumbnailAccessory((th) =>
                        th.setURL(newEmoji.imageURL()),
                    ),
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
