import {
  ChatInputCommandInteraction,
  ContainerBuilder,
  SectionBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import { env } from "@/config/env";
import { errorContainer } from "@/utils/errorContainer";
import crypto from "node:crypto";
import { rps } from "@/services/games/rps";

export async function handleRockPaperScissorsGame(
  interaction: ChatInputCommandInteraction,
) {
  const opponent = interaction.options.getUser("user", true);

  if (opponent.bot || opponent.id === interaction.user.id) {
    return interaction.reply(
      errorContainer("You must challenge another user."),
    );
  }

  await interaction.deferReply();

  const gameId = crypto.randomUUID();

  rps.set(gameId, {
    challengerId: interaction.user.id,
    opponentId: opponent.id,
    choices: {},
  });

  const container = new ContainerBuilder()
    .setAccentColor(env.ACCENT_COLOR)
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          (t) => t.setContent("🪨 **Rock Paper Scissors**"),
          (t) =>
            t.setContent(
              `${interaction.user} has challenged ${opponent} to a game.`,
            ),
        )
        .setThumbnailAccessory((th) =>
          th.setURL(
            interaction.guild!.iconURL() ??
              "https://cdn.discordapp.com/embed/avatars/0.png",
          ),
        ),
    )
    .addActionRowComponents((row) =>
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`rps:accept:${gameId}`)
          .setLabel("Accept")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`rps:decline:${gameId}`)
          .setLabel("Decline")
          .setStyle(ButtonStyle.Danger),
      ),
    );

  await interaction.editReply({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  });
}
