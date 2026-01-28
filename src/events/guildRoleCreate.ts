import {
    Events,
    Role,
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
    name: Events.GuildRoleCreate,
    async execute(role: Role) {
        const logsChannel = role.guild.channels.cache.get(
            env.SERVER_LOGS_CHANNEL,
        );
        if (!logsChannel || !logsChannel.isTextBased()) return;

        logger.info(`[ROLE_CREATE] ${role.name} (${role.id})`);

        const section = new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `<:settings:1315248897051983873> **Event**\n\`ROLE_CREATE\``,
                ),
                new TextDisplayBuilder().setContent(
                    `<:role:1315248779917656145> **Role**\n${role} - \`${role.name}\``,
                ),
            )
            .setThumbnailAccessory((th) =>
                th.setURL(
                    role.guild?.iconURL({ size: 128 }) ??
                        "https://cdn.discordapp.com/embed/avatars/0.png",
                ),
            );

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(section)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
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
