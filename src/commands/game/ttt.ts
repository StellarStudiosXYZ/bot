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
import { createTtt } from "@/services/games/ttt";

export async function handleTtt(interaction: ChatInputCommandInteraction) {
  const opponent = interaction.options.getUser("user", true);

  if (opponent.bot || opponent.id === interaction.user.id) {
    return interaction.reply(
      errorContainer("You must challenge another user."),
    );
  }

  const game = createTtt(interaction.user.id, opponent.id);

  const icon =
    interaction.guild?.iconURL() ??
    "https://cdn.discordapp.com/embed/avatars/0.png";

  await interaction.reply({
    components: [
      new ContainerBuilder()
        .setAccentColor(env.ACCENT_COLOR)
        .addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              (t) => t.setContent("❌⭕ **Tic Tac Toe**"),
              (t) =>
                t.setContent(
                  `${interaction.user} has challenged ${opponent}\nTurn: ❌`,
                ),
            )
            .setThumbnailAccessory((th) => th.setURL(icon)),
        )
        .addActionRowComponents((row) =>
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`ttt:accept:${game.id}`)
              .setLabel("Accept")
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`ttt:decline:${game.id}`)
              .setLabel("Decline")
              .setStyle(ButtonStyle.Danger),
          ),
        ),
    ],
    flags: MessageFlags.IsComponentsV2,
  });
}
