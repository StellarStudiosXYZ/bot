import {
    Events,
    Message,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
    time,
    TimestampStyles,
} from "discord.js";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

export default {
    name: Events.MessageUpdate,
    async execute(oldMessage: Message, newMessage: Message) {
        if (!newMessage.guild) return;
        if (oldMessage.partial || newMessage.partial) return;
        if (oldMessage.content === newMessage.content) return;

        const logsChannel = newMessage.guild.channels.cache.get(
            env.SERVER_LOGS_CHANNEL,
        );
        if (!logsChannel || !logsChannel.isTextBased()) return;

        const oldContent = oldMessage.content?.trim().slice(0, 1750) || null;
        const newContent = newMessage.content?.trim().slice(0, 1750) || null;

        logger.info(
            `[MESSAGE_UPDATE] Message: ${newMessage.id} | User: ${newMessage.author.id} | Channel: ${newMessage.channel.id}`,
        );

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                `<:settings:1315248897051983873> **Event**\n\`MESSAGE_EDIT\``,
                            ),
                        (t) =>
                            t.setContent(
                                `<:member:1315248772527423551> **Author**\n<@${newMessage.author.id}>`,
                            ),
                        (t) =>
                            t.setContent(
                                `<:channel:1315248776398766161> **Message**\n${newMessage.url}`,
                            ),
                    )
                    .setThumbnailAccessory((th) =>
                        th.setURL(
                            newMessage.guild?.iconURL({ size: 128 }) ??
                                "https://cdn.discordapp.com/embed/avatars/0.png",
                        ),
                    ),
            );

        if (oldContent) {
            container.addTextDisplayComponents((t) =>
                t.setContent(
                    `<:content:1465235859874910269> **Before**\n${oldContent}`,
                ),
            );
        }

        if (newContent) {
            container.addTextDisplayComponents((t) =>
                t.setContent(
                    `<:content:1465235859874910269> **After**\n${newContent}`,
                ),
            );
        }

        container.addTextDisplayComponents((t) =>
            t.setContent(
                `-# ${time(
                    newMessage.editedAt ?? new Date(),
                    TimestampStyles.FullDateShortTime,
                )}`,
            ),
        );

        await logsChannel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: [] },
        });
    },
};
