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
    name: Events.MessageDelete,
    async execute(message: Message) {
        if (!message.guild) return;

        const logsChannel = message.guild.channels.cache.get(
            env.SERVER_LOGS_CHANNEL,
        );
        if (!logsChannel || !logsChannel.isTextBased()) return;

        const author = message.author ?? message.member?.user ?? null;
        const authorId = author?.id ?? null;
        const authorMention = authorId ? `<@${authorId}>` : "`unknown`";

        const content =
            message.content && message.content.trim().length
                ? message.content.trim().slice(0, 3500)
                : null;

        const images = [...message.attachments.values()]
            .filter((a) => a.contentType?.startsWith("image/"))
            .slice(0, 10);

        logger.info(
            `[MESSAGE_DELETE] Message: ${message.id} | User: ${authorId} | Channel: ${message.channel.id}`,
        );

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                `<:settings:1315248897051983873> **Event**\n\`MESSAGE_DELETE\``,
                            ),
                        (t) =>
                            t.setContent(
                                `<:member:1315248772527423551> **Author**\n${authorMention}`,
                            ),
                        (t) =>
                            t.setContent(
                                `<:channel:1315248776398766161> **Channel**\n<#${message.channel.id}>`,
                            ),
                    )
                    .setThumbnailAccessory((th) =>
                        th.setURL(
                            message.guild?.iconURL({ size: 128 }) ??
                                "https://cdn.discordapp.com/embed/avatars/0.png",
                        ),
                    ),
            );

        if (content) {
            container.addTextDisplayComponents((t) =>
                t.setContent(
                    `<:content:1465235859874910269> **Content**\n${content}`,
                ),
            );
        }

        if (images.length) {
            container.addMediaGalleryComponents((media) =>
                media.addItems(
                    images.map(
                        (img) => (item) =>
                            item
                                .setURL(img.url)
                                .setDescription("deleted attachment"),
                    ),
                ),
            );
        }

        container.addTextDisplayComponents((t) =>
            t.setContent(
                `-# ${time(
                    message.createdAt ?? new Date(),
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
