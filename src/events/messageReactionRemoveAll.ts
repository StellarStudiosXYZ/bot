import {
    Events,
    Message,
    Collection,
    MessageReaction,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
} from "discord.js";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

export default {
    name: Events.MessageReactionRemoveAll,
    async execute(
        message: Message,
        reactions: Collection<string, MessageReaction>,
    ) {
        const logsChannel = message.guild?.channels.cache.get(
            env.SERVER_LOGS_CHANNEL,
        );
        if (!logsChannel || !logsChannel.isTextBased()) return;

        logger.info(`[REACTION_REMOVE_ALL] ${reactions}`);

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                `<:settings:1315248897051983873> **Event**\n\`REACTION_REMOVE_ALL\``,
                            ),
                        (t) =>
                            t.setContent(
                                `All reactions were cleared from ${message.url}`,
                            ),
                    )
                    .setThumbnailAccessory((th) =>
                        th.setURL(
                            message.guild?.iconURL() ??
                                "https://cdn.discordapp.com/embed/avatars/0.png",
                        ),
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
