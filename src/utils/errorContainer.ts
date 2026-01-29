import {
    ContainerBuilder,
    time,
    TimestampStyles,
    MessageFlags,
} from "discord.js";

export const errorContainer = (message: string) => ({
    components: [
        new ContainerBuilder()
            .setAccentColor(0xed4245)
            .addTextDisplayComponents((t) => t.setContent(`**${message}**`))
            .addTextDisplayComponents((t) =>
                t.setContent(
                    `-# ${time(new Date(), TimestampStyles.FullDateShortTime)}`,
                ),
            ),
    ],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
});
