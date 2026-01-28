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
    name: Events.GuildRoleUpdate,
    async execute(oldRole: Role, newRole: Role) {
        const logsChannel = newRole.guild.channels.cache.get(
            env.SERVER_LOGS_CHANNEL,
        );
        if (!logsChannel || !logsChannel.isTextBased()) return;

        const changes: string[] = [];

        if (oldRole.name !== newRole.name) {
            changes.push(
                `<:mention:1315248893910581249> **Name**\n\`${oldRole.name}\` → \`${newRole.name}\``,
            );
        }

        if (oldRole.color !== newRole.color) {
            changes.push(
                `**Color**\n\`#${oldRole.color.toString(16).padStart(6, "0")}\` → \`#${newRole.color.toString(16).padStart(6, "0")}\``,
            );
        }

        if (oldRole.hoist !== newRole.hoist) {
            changes.push(
                `**Separated**\n\`${oldRole.hoist}\` → \`${newRole.hoist}\``,
            );
        }

        if (!oldRole.permissions.equals(newRole.permissions)) {
            const added = newRole.permissions
                .toArray()
                .filter((p) => !oldRole.permissions.has(p));
            const removed = oldRole.permissions
                .toArray()
                .filter((p) => !newRole.permissions.has(p));

            let permDetail = `**Permissions Updated**`;
            if (added.length)
                permDetail += `\n<:success:1315248756094009404> **Added**\n\`${added.join(", ")}\``;
            if (removed.length)
                permDetail += `\n<:error:1315248759617228842> **Removed**\n\`${removed.join(", ")}\``;
            changes.push(permDetail);
        }

        if (changes.length === 0) return;

        logger.info(`[ROLE_UPDATE] Name: ${newRole.name} | ID: ${newRole.id}`);

        const section = new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `<:settings:1315248897051983873> **Event**\n\`ROLE_UPDATE\``,
                ),
                new TextDisplayBuilder().setContent(
                    `<:role:1315248779917656145> **Role**\n${newRole}`,
                ),
            )
            .setThumbnailAccessory((th) =>
                th.setURL(
                    newRole.guild?.iconURL({ size: 128 }) ??
                        "https://cdn.discordapp.com/embed/avatars/0.png",
                ),
            );

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(section);

        for (const change of changes) {
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(change),
            );
        }

        container.addTextDisplayComponents(
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
