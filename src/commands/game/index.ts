import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { handleRockPaperScissorsGame } from "@/commands/game/rps";

export const command = {
    data: new SlashCommandBuilder()
        .setName("game")
        .setDescription("Play games")
        .addSubcommand((s) =>
            s
                .setName("rock-paper-scissors")
                .setDescription("Challenge someone to Rock Paper Scissors")
                .addUserOption((o) =>
                    o
                        .setName("user")
                        .setDescription("User to challenge")
                        .setRequired(true),
                ),
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const sub = interaction.options.getSubcommand();

        if (sub === "rock-paper-scissors") {
            return handleRockPaperScissorsGame(interaction);
        }
    },
};
