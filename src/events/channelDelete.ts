import {
    Events,
    GuildChannel,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
    time,
    TimestampStyles,
} from "discord.js";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

export default {
    name: Events.ChannelDelete,
    async execute(channel: GuildChannel) {
        if (!channel.guild) return;

        const logsChannel = channel.guild.channels.cache.get(
            env.SERVER_LOGS_CHANNEL,
        );
        if (!logsChannel || !logsChannel.isTextBased()) return;

        logger.info(`[CHANNEL_DELETE] ${channel.name} (${channel.id})`);

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                `<:settings:1315248897051983873> **Event**\n\`CHANNEL_DELETE\``,
                            ),
                        (t) =>
                            t.setContent(
                                `<:channel:1315248776398766161> **Channel**\n#${channel.name}`,
                            ),
                    )
                    .setThumbnailAccessory((th) =>
                        th.setURL(
                            channel.guild?.iconURL({ size: 128 }) ??
                                "https://cdn.discordapp.com/embed/avatars/0.png",
                        ),
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
