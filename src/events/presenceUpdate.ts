import {
    Events,
    Presence,
    ActivityType,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
    time,
    TimestampStyles,
} from "discord.js";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

function formatActivity(activity: any): string {
    if (!activity) return "None";

    const typeMap: Record<number, string> = {
        [ActivityType.Playing]: "Playing",
        [ActivityType.Streaming]: "Streaming",
        [ActivityType.Listening]: "Listening to",
        [ActivityType.Watching]: "Watching",
        [ActivityType.Custom]: "Custom Status",
        [ActivityType.Competing]: "Competing in",
    };

    let text = `${typeMap[activity.type] ?? "Activity"} ${activity.name}`;

    if (activity.details) text += `\n**Details:** ${activity.details}`;
    if (activity.state) text += `\n**State:** ${activity.state}`;
    if (activity.url) text += `\n**URL:** ${activity.url}`;

    return text;
}

export default {
    name: Events.PresenceUpdate,
    async execute(oldPresence: Presence | null, newPresence: Presence) {
        const guild = newPresence.guild;
        if (!guild) return;

        const logsChannel = guild.channels.cache.get(env.SERVER_LOGS_CHANNEL);
        if (!logsChannel || !logsChannel.isTextBased()) return;

        const user = newPresence.user;
        if (!user) return;

        const changes: string[] = [];

        const oldStatus = oldPresence?.status ?? "offline";
        const newStatus = newPresence.status ?? "offline";

        if (oldStatus !== newStatus) {
            changes.push(`**Status**\n\`${oldStatus}\` → \`${newStatus}\``);
        }

        const oldClient = oldPresence?.clientStatus ?? {};
        const newClient = newPresence.clientStatus ?? {};

        if (JSON.stringify(oldClient) !== JSON.stringify(newClient)) {
            changes.push(
                `**Device**\n\`${Object.keys(oldClient).join(", ") || "none"}\` → \`${Object.keys(newClient).join(", ") || "none"}\``,
            );
        }

        const oldActivity = oldPresence?.activities[0];
        const newActivity = newPresence.activities[0];

        if (
            oldActivity?.name !== newActivity?.name ||
            oldActivity?.type !== newActivity?.type
        ) {
            if (newActivity) {
                changes.push(
                    `**Activity Started / Changed**\n${formatActivity(newActivity)}`,
                );
            } else {
                changes.push(
                    `**Activity Ended**\n${formatActivity(oldActivity)}`,
                );
            }
        }

        if (!changes.length) return;

        logger.info(
            `[PRESENCE_UPDATE] Name: ${user.username} | ID: ${user.id}`,
        );

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                `<:settings:1315248897051983873> **Event**\n\`PRESENCE_UPDATE\``,
                            ),
                        (t) =>
                            t.setContent(
                                `<:member:1315248772527423551> **User**\n<@${user.id}>`,
                            ),
                    )
                    .setThumbnailAccessory((thumb) =>
                        thumb.setURL(user.displayAvatarURL({ size: 128 })),
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
