import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js";

export const command = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Ping Pong!"),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const embed = new EmbedBuilder()
            .setTitle("🏓 Pong!")
            .setColor(0x7040ff)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
