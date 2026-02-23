import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { handleRockPaperScissorsGame } from "@/commands/game/rps";
import { handleTtt } from "@/commands/game/ttt";

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
    )

    .addSubcommand((s) =>
      s
        .setName("tic-tac-toe")
        .setDescription("Challenge someone to Tic Tac Toe")
        .addUserOption((o) =>
          o
            .setName("user")
            .setDescription("User to challenge")
            .setRequired(true),
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case "rock-paper-scissors":
        return handleRockPaperScissorsGame(interaction);
      case "tic-tac-toe":
        return handleTtt(interaction);
    }
  },
};
