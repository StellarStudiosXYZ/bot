import {
    Events,
    MessageReaction,
    User,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
} from "discord.js";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

export default {
    name: Events.MessageReactionAdd,
    async execute(reaction: MessageReaction, user: User) {
        if (reaction.partial) await reaction.fetch();
        const { message } = reaction;
        const logsChannel = message.guild?.channels.cache.get(
            env.SERVER_LOGS_CHANNEL,
        );
        if (!logsChannel || !logsChannel.isTextBased()) return;

        logger.info(`[REACTION_ADD] ${reaction.emoji.id}`);

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                `<:settings:1315248897051983873> **Event**\n\`REACTION_ADD\``,
                            ),
                        (t) =>
                            t.setContent(
                                `**User**\n${user}\n**Emoji**\n${reaction.emoji}`,
                            ),
                        (t) => t.setContent(`**Message**\n${message.url}`),
                    )
                    .setThumbnailAccessory((th) =>
                        th.setURL(
                            reaction.message.guild?.iconURL() ??
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
