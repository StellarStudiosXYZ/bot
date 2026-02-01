import {
    SlashCommandSubcommandBuilder,
    ChatInputCommandInteraction,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
    time,
    TimestampStyles,
    ButtonBuilder,
    ButtonStyle,
    MediaGalleryBuilder,
} from "discord.js";
import { env } from "@/config/env";

export const command = {
    data: new SlashCommandSubcommandBuilder()
        .setName("link-sourcexchange")
        .setDescription("Link your sourceXchange purchases"),

    async execute(interaction: ChatInputCommandInteraction) {
        const guild = interaction.guild!;

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                "### <:sxc:1291789674687500441> Link sourceXchange Purchase",
                            ),
                        (t) =>
                            t.setContent(
                                "To link one of your purchases, please visit your [accesses](https://www.sourcexchange.net/accesses) and copy the **Transaction ID** of the product you want to link as shown below.",
                            ),
                    )
                    .setThumbnailAccessory((th) =>
                        th.setURL(
                            guild.iconURL() ??
                                interaction.user.displayAvatarURL(),
                        ),
                    ),
            )
            .addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems((mediaGalleryItem) =>
                    mediaGalleryItem
                        .setDescription(
                            "Where to find your sourceXchange Transaction ID",
                        )
                        .setURL(
                            "https://cdn.discordapp.com/attachments/1298726101664923648/1467438742129348795/Screenshot_2.png",
                        ),
                ),
            )
            .addActionRowComponents((row) =>
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId("link:sourcexchange")
                        .setLabel("Link Purchase")
                        .setEmoji("<:link:1467155398942396581>")
                        .setStyle(ButtonStyle.Primary),
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
