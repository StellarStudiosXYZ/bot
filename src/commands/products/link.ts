import {
    SlashCommandSubcommandBuilder,
    ChatInputCommandInteraction,
    ContainerBuilder,
    SectionBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
} from "discord.js";
import { env } from "@/config/env";

export const command = {
    data: new SlashCommandSubcommandBuilder()
        .setName("link")
        .setDescription("Link your product purchases"),

    async execute(interaction: ChatInputCommandInteraction) {
        const guild = interaction.guild!;

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                "### <:link:1467155398942396581> Link Product",
                            ),
                        (t) =>
                            t.setContent(
                                "Select the marketplace where you purchased the product from.\n",
                            ),
                        (t) =>
                            t.setContent(
                                `-# > Once linked, your account will be granted the <@&${env.CUSTOMER_ROLE}> role and the relevant product role.`,
                            ),
                    )
                    .setThumbnailAccessory((th) =>
                        th.setURL(
                            guild.iconURL() ??
                                interaction.user.displayAvatarURL(),
                        ),
                    ),
            )
            .addActionRowComponents(
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId("products:link:sourcexchange")
                        .setLabel("sourceXchange")
                        .setEmoji("<:sxc:1291789674687500441>")
                        .setStyle(ButtonStyle.Secondary),

                    new ButtonBuilder()
                        .setCustomId("products:link:builtbybit")
                        .setLabel("BuiltByBit")
                        .setEmoji("<:bbb:1291789674083389531>")
                        .setStyle(ButtonStyle.Secondary),
                ),
            );

        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { roles: [] },
        });
    },
};
