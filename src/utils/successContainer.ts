import {
    ContainerBuilder,
    time,
    TimestampStyles,
    MessageFlags,
} from "discord.js";

export const successContainer = (message: string) => ({
    components: [
        new ContainerBuilder()
            .setAccentColor(0x57f287)
            .addTextDisplayComponents((t) => t.setContent(`**${message}**`))
            .addTextDisplayComponents((t) =>
                t.setContent(
                    `-# ${time(new Date(), TimestampStyles.FullDateShortTime)}`,
                ),
            ),
    ],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
});
