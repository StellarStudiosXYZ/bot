import {
    Events,
    Guild,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
    time,
    TimestampStyles,
} from "discord.js";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

export default {
    name: Events.GuildUpdate,
    async execute(oldGuild: Guild, newGuild: Guild) {
        const logsChannel = newGuild.channels.cache.get(
            env.SERVER_LOGS_CHANNEL,
        );
        if (!logsChannel || !logsChannel.isTextBased()) return;

        const changes: string[] = [];
        if (oldGuild.name !== newGuild.name)
            changes.push(
                `**Name**\n\`${oldGuild.name}\` → \`${newGuild.name}\``,
            );
        if (oldGuild.description !== newGuild.description)
            changes.push(
                `**Description**\n\`${oldGuild.description ?? "None"}\` → \`${newGuild.description ?? "None"}\``,
            );
        if (oldGuild.premiumTier !== newGuild.premiumTier)
            changes.push(
                `**Boost Tier**\n\`Level ${oldGuild.premiumTier}\` → \`Level ${newGuild.premiumTier}\``,
            );

        if (changes.length === 0) return;
        logger.info(`[GUILD_UPDATE] ${newGuild.name}`);

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                `<:settings:1315248897051983873> **Event**\n\`GUILD_UPDATE\``,
                            ),
                        ...changes.map((c) => (t: any) => t.setContent(c)),
                    )
                    .setThumbnailAccessory((th) =>
                        th.setURL(
                            newGuild.iconURL() ??
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
            allowedMentions: {
                parse: [],
            },
        });
    },
};
