import {
    Events,
    Sticker,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
    time,
    TimestampStyles,
} from "discord.js";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

export default {
    name: Events.GuildStickerCreate,
    async execute(sticker: Sticker) {
        if (!sticker.guild) return;

        const logsChannel = sticker.guild.channels.cache.get(
            env.SERVER_LOGS_CHANNEL,
        );
        if (!logsChannel || !logsChannel.isTextBased()) return;

        logger.info(
            `[STICKER_CREATE] Name: ${sticker.name} | ID: ${sticker.id}`,
        );

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                `<:settings:1315248897051983873> **Event**\n\`STICKER_CREATE\``,
                            ),
                        (t) =>
                            t.setContent(
                                `<:mention:1315248893910581249> **Name**\n\`${sticker.name}\``,
                            ),
                    )
                    .setThumbnailAccessory((th) => th.setURL(sticker.url)),
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
