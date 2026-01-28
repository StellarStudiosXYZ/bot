import {
    Events,
    User,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
    time,
    TimestampStyles,
} from "discord.js";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

export default {
    name: Events.UserUpdate,
    async execute(oldUser: User, newUser: User) {
        const changes: string[] = [];

        if (oldUser.username !== newUser.username) {
            changes.push(
                `**Username**\n\`${oldUser.username}\` → \`${newUser.username}\``,
            );
        }

        if (oldUser.globalName !== newUser.globalName) {
            changes.push(
                `**Global Name**\n\`${oldUser.globalName ?? "None"}\` → \`${newUser.globalName ?? "None"}\``,
            );
        }

        if (oldUser.avatar !== newUser.avatar) {
            changes.push(
                `**Avatar Changed**\n[New Avatar URL](${newUser.displayAvatarURL()})`,
            );
        }

        if (changes.length === 0) return;

        const sharedGuild = newUser.client.guilds.cache.find((g) =>
            g.members.cache.has(newUser.id),
        );
        if (!sharedGuild) return;

        const logsChannel = sharedGuild.channels.cache.get(
            env.SERVER_LOGS_CHANNEL,
        );
        if (!logsChannel || !logsChannel.isTextBased()) return;

        logger.info(`[USER_UPDATE] ${newUser.tag} (${newUser.id})`);

        const section = new SectionBuilder()
            .addTextDisplayComponents(
                (t) =>
                    t.setContent(
                        `<:settings:1315248897051983873> **Event**\n\`USER_UPDATE\``,
                    ),
                (t) =>
                    t.setContent(
                        `<:member:1315248772527423551> **User**\n${newUser}`,
                    ),
            )
            .setThumbnailAccessory((th) =>
                th.setURL(newUser.displayAvatarURL({ size: 128 })),
            );

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(section);

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
