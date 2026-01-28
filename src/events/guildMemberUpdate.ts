import {
    Events,
    GuildMember,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
    time,
    TimestampStyles,
} from "discord.js";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

export default {
    name: Events.GuildMemberUpdate,
    async execute(oldMember: GuildMember, newMember: GuildMember) {
        if (!newMember.guild) return;

        const logsChannel = newMember.guild.channels.cache.get(
            env.SERVER_LOGS_CHANNEL,
        );
        if (!logsChannel || !logsChannel.isTextBased()) return;

        const changes: string[] = [];

        if (oldMember.nickname !== newMember.nickname) {
            changes.push(
                `<:mention:1315248893910581249> **Nickname**\n\`${oldMember.nickname ?? "None"}\` → \`${newMember.nickname ?? "None"}\``,
            );
        }

        await newMember.fetch(true);

        const oldRoles = new Set(
            oldMember.roles.cache
                .filter((r) => r.id !== oldMember.guild.id)
                .keys(),
        );

        const newRoles = new Set(
            newMember.roles.cache
                .filter((r) => r.id !== newMember.guild.id)
                .keys(),
        );

        const addedRoles = [...newRoles].filter((r) => !oldRoles.has(r));
        const removedRoles = [...oldRoles].filter((r) => !newRoles.has(r));

        if (addedRoles.length) {
            changes.push(
                `<:role:1315248779917656145> **Roles Added**\n${addedRoles.map((r) => `<@&${r}>`).join(" ")}`,
            );
        }

        if (removedRoles.length) {
            changes.push(
                `<:role:1315248779917656145> **Roles Removed**\n${removedRoles.map((r) => `<@&${r}>`).join(" ")}`,
            );
        }

        if (!changes.length) return;

        logger.info(`[MEMBER_UPDATE] ${newMember.user.tag} (${newMember.id})`);

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                `<:settings:1315248897051983873> **Event**\n\`MEMBER_UPDATE\``,
                            ),
                        (t) =>
                            t.setContent(
                                `<:member:1315248772527423551> **User**\n<@${newMember.id}>`,
                            ),
                    )
                    .setThumbnailAccessory((thumb) =>
                        thumb.setURL(
                            newMember.user.displayAvatarURL({
                                size: 128,
                            }),
                        ),
                    ),
            );

        for (const change of changes) {
            container.addTextDisplayComponents((t) => t.setContent(change));
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
