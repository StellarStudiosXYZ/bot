import {
    Events,
    Invite,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
    time,
    TimestampStyles,
} from "discord.js";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

export default {
    name: Events.InviteDelete,
    async execute(invite: Invite) {
        const guild = invite.client.guilds.cache.get(invite.guild?.id ?? "");
        if (!guild) return;

        const logsChannel = guild.channels.cache.get(env.SERVER_LOGS_CHANNEL);
        if (!logsChannel || !logsChannel.isTextBased()) return;

        logger.info(`[INVITE_DELETE] Code: ${invite.code}`);

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                `<:settings:1315248897051983873> **Event**\n\`INVITE_DELETE\``,
                            ),
                        (t) => t.setContent(`**Code**\n\`${invite.code}\``),
                        (t) =>
                            t.setContent(`**Channel**\n<#${invite.channelId}>`),
                    )
                    .setThumbnailAccessory((th) =>
                        th.setURL(
                            guild.iconURL() ??
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
