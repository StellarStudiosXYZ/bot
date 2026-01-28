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
    name: Events.GuildStickerUpdate,
    async execute(oldSticker: Sticker, newSticker: Sticker) {
        if (!newSticker.guild) return;

        const nameChanged = oldSticker.name !== newSticker.name;
        const descChanged = oldSticker.description !== newSticker.description;
        if (!nameChanged && !descChanged) return;

        const logsChannel = newSticker.guild.channels.cache.get(
            env.SERVER_LOGS_CHANNEL,
        );
        if (!logsChannel || !logsChannel.isTextBased()) return;

        logger.info(`[STICKER_UPDATE] ${newSticker.name} (${newSticker.id})`);

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                `<:settings:1315248897051983873> **Event**\n\`STICKER_UPDATE\``,
                            ),
                        (t) =>
                            t.setContent(
                                nameChanged
                                    ? `<:mention:1315248893910581249> **Name**\n\`${oldSticker.name}\` → \`${newSticker.name}\``
                                    : `<:mention:1315248893910581249> **Name**\n\`${newSticker.name}\``,
                            ),
                    )
                    .setThumbnailAccessory((th) => th.setURL(newSticker.url)),
            );

        if (descChanged) {
            container.addTextDisplayComponents((t) =>
                t.setContent(
                    `**Description**\n\`${oldSticker.description ?? "None"}\` → \`${newSticker.description ?? "None"}\``,
                ),
            );
        }

        container.addTextDisplayComponents((t) =>
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
