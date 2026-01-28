import {
    Events,
    NonThreadGuildBasedChannel,
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    MessageFlags,
    time,
    TimestampStyles,
    OverwriteType,
} from "discord.js";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

export default {
    name: Events.ChannelUpdate,
    async execute(
        oldChannel: NonThreadGuildBasedChannel,
        newChannel: NonThreadGuildBasedChannel,
    ) {
        if (!newChannel.guild) return;

        const logsChannel = newChannel.guild.channels.cache.get(
            env.SERVER_LOGS_CHANNEL,
        );
        if (!logsChannel || !logsChannel.isTextBased()) return;

        const changes: string[] = [];

        if (oldChannel.name !== newChannel.name) {
            changes.push(
                `<:mention:1315248893910581249> **Name**\n\`#${oldChannel.name}\` → \`#${newChannel.name}\``,
            );
        }

        if (oldChannel.parentId !== newChannel.parentId) {
            const oldParent = oldChannel.parent?.name ?? "None";
            const newParent = newChannel.parent?.name ?? "None";
            changes.push(`**Category**\n\`${oldParent}\` → \`${newParent}\``);
        }

        if (oldChannel.isTextBased() && newChannel.isTextBased()) {
            if (
                "topic" in oldChannel &&
                "topic" in newChannel &&
                oldChannel.topic !== newChannel.topic
            ) {
                changes.push(
                    `**Topic**\n${oldChannel.topic ?? "None"} → ${newChannel.topic ?? "None"}`,
                );
            }

            if (
                "rateLimitPerUser" in oldChannel &&
                "rateLimitPerUser" in newChannel &&
                oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser
            ) {
                changes.push(
                    `**Slowmode**\n\`${oldChannel.rateLimitPerUser}s\` → \`${newChannel.rateLimitPerUser}s\``,
                );
            }

            if (
                "nsfw" in oldChannel &&
                "nsfw" in newChannel &&
                oldChannel.nsfw !== newChannel.nsfw
            ) {
                changes.push(
                    `**NSFW**\n\`${oldChannel.nsfw}\` → \`${newChannel.nsfw}\``,
                );
            }
        }

        const oldOverwrites = oldChannel.permissionOverwrites.cache;
        const newOverwrites = newChannel.permissionOverwrites.cache;

        if (!oldOverwrites.equals(newOverwrites)) {
            newOverwrites.forEach((newOv, id) => {
                const oldOv = oldOverwrites.get(id);

                if (!oldOv) {
                    const mention =
                        newOv.type === OverwriteType.Role
                            ? `<@&${id}>`
                            : `<@${id}>`;
                    changes.push(`**Permissions added for ${mention}**`);
                    return;
                }

                if (
                    !oldOv.allow.equals(newOv.allow) ||
                    !oldOv.deny.equals(newOv.deny)
                ) {
                    const mention =
                        newOv.type === OverwriteType.Role
                            ? `<@&${id}>`
                            : `<@${id}>`;

                    const allowed = newOv.allow
                        .toArray()
                        .filter((p) => !oldOv.allow.has(p));
                    const denied = newOv.deny
                        .toArray()
                        .filter((p) => !oldOv.deny.has(p));
                    const neutralized = [
                        ...oldOv.allow
                            .toArray()
                            .filter((p) => !newOv.allow.has(p)),
                        ...oldOv.deny
                            .toArray()
                            .filter((p) => !newOv.deny.has(p)),
                    ];

                    let detail = `**Permissions changed for ${mention}:**`;
                    if (allowed.length)
                        detail += `\n<:success:1315248756094009404> **Allowed:** \`${allowed.join(", ")}\``;
                    if (denied.length)
                        detail += `\n<:error:1315248759617228842> **Denied:** \`${denied.join(", ")}\``;
                    if (neutralized.length)
                        detail += `\n⚪ **Neutral:** \`${neutralized.join(", ")}\``;

                    changes.push(detail);
                }
            });

            oldOverwrites.forEach((_, id) => {
                if (!newOverwrites.has(id)) {
                    const mention =
                        id === newChannel.guild.id ? "@everyone" : `<@&${id}>`;
                    changes.push(`**Permissions removed for ${mention}**`);
                }
            });
        }

        if (changes.length === 0) return;

        logger.info(`[CHANNEL_UPDATE] ${newChannel.name} (${newChannel.id})`);

        const section = new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `<:settings:1315248897051983873> **Event**\n\`CHANNEL_UPDATE\``,
                ),
                new TextDisplayBuilder().setContent(
                    `<:channel:1315248776398766161> **Channel**\n${newChannel}`,
                ),
            )
            .setThumbnailAccessory((th) =>
                th.setURL(
                    newChannel.guild?.iconURL({ size: 128 }) ??
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
