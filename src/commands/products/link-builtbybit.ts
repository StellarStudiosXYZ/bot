import {
    SlashCommandSubcommandBuilder,
    ChatInputCommandInteraction,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
    time,
    TimestampStyles,
} from "discord.js";
import { env } from "@/config/env";

export const command = {
    data: new SlashCommandSubcommandBuilder()
        .setName("link-builtbybit")
        .setDescription("Link your BuiltByBit purchases"),

    async execute(interaction: ChatInputCommandInteraction) {
        const guild = interaction.guild!;

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                "### <:bbb:1291789674083389531> Link BuiltByBit Purchases",
                            ),
                        (t) =>
                            t.setContent(
                                "To link your purchases from BuiltByBit please run </sync:1051865976221733014> command.",
                            ),
                    )
                    .setThumbnailAccessory((th) =>
                        th.setURL(
                            guild.iconURL() ??
                                interaction.user.displayAvatarURL(),
                        ),
                    ),
            )
            .addTextDisplayComponents((t) =>
                t.setContent(
                    `-# ${time(new Date(), TimestampStyles.FullDateShortTime)}`,
                ),
            );

        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
    },
};
