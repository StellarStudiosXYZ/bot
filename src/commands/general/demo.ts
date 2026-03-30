import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
    time,
    TimestampStyles,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";
import { env } from "@/config/env";

export const command = {
    data: new SlashCommandBuilder()
        .setName("demo")
        .setDescription("Access demo panels"),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply({
            components: [
                new ContainerBuilder()
                    .setAccentColor(env.ACCENT_COLOR)
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(
                                (t) =>
                                    t.setContent(
                                        "### Demo Panels Login Credentials",
                                    ),
                                (t) =>
                                    t.setContent(
                                        "- **Username:** `demo`\n- **Password:** `demo`",
                                    ),
                            )
                            .setThumbnailAccessory((th) =>
                                th.setURL(
                                    interaction.client.user?.displayAvatarURL({
                                        size: 128,
                                    }) ??
                                        "https://cdn.discordapp.com/embed/avatars/0.png",
                                ),
                            ),
                    )
                    .addSectionComponents((section) =>
                        section
                            .addTextDisplayComponents((textDisplay) =>
                                textDisplay.setContent(
                                    "-# Our Pterodactyl Extensions Demo on Default Pterodactyl!",
                                ),
                            )
                            .setButtonAccessory((button) =>
                                button
                                    .setLabel("Pterodactyl Demo")
                                    .setStyle(ButtonStyle.Link)
                                    .setURL(
                                        "https://pterodactyl.stellarstudios.xyz",
                                    ),
                            ),
                    )
                    .addSectionComponents((section) =>
                        section
                            .addTextDisplayComponents((textDisplay) =>
                                textDisplay.setContent(
                                    "-# Our Pterodactyl Extensions Demo on Nova Theme!",
                                ),
                            )
                            .setButtonAccessory((button) =>
                                button
                                    .setLabel("Nova Demo")
                                    .setStyle(ButtonStyle.Link)
                                    .setURL("https://nova.stellarstudios.xyz"),
                            ),
                    )
                    .addSectionComponents((section) =>
                        section
                            .addTextDisplayComponents((textDisplay) =>
                                textDisplay.setContent(
                                    "-# Our Blueprint Extensions Demo on Nebula Theme!",
                                ),
                            )
                            .setButtonAccessory((button) =>
                                button
                                    .setLabel("Nebula Demo")
                                    .setStyle(ButtonStyle.Link)
                                    .setURL(
                                        "https://nebula.stellarstudios.xyz",
                                    ),
                            ),
                    )
                    .addSectionComponents((section) =>
                        section
                            .addTextDisplayComponents((textDisplay) =>
                                textDisplay.setContent(
                                    "-# Our Calagopus Extensions Demo!",
                                ),
                            )
                            .setButtonAccessory((button) =>
                                button
                                    .setLabel("Calagopus Demo")
                                    .setStyle(ButtonStyle.Link)
                                    .setURL(
                                        "https://calagopus.stellarstudios.xyz",
                                    ),
                            ),
                    ),
          ],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
