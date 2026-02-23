import {
  ButtonInteraction,
  ContainerBuilder,
  SectionBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import { env } from "@/config/env";
import { errorContainer } from "@/utils/errorContainer";
import { rps } from "@/services/games/rps";

type Choice = "rock" | "paper" | "scissors";

const EMOJI: Record<Choice, string> = {
  rock: "🪨",
  paper: "📰",
  scissors: "✂️",
};

const BEATS: Record<Choice, Choice> = {
  rock: "scissors",
  paper: "rock",
  scissors: "paper",
};

function buildSection(title: string, body: string, guildIcon?: string) {
  return new SectionBuilder()
    .addTextDisplayComponents(
      (t) => t.setContent(title),
      (t) => t.setContent(body),
    )
    .setThumbnailAccessory((th) =>
      th.setURL(guildIcon ?? "https://cdn.discordapp.com/embed/avatars/0.png"),
    );
}

export async function handleRpsButton(interaction: ButtonInteraction) {
  const [, action, gameId, pick] = interaction.customId.split(":");
  const game = rps.get(gameId);

  if (!game) {
    return interaction.reply(errorContainer("This game has expired."));
  }

  const icon = interaction.guild?.iconURL() ?? undefined;

  if (action === "decline") {
    if (interaction.user.id !== game.opponentId) {
      return interaction.reply(
        errorContainer("You are not part of this game."),
      );
    }

    rps.delete(gameId);

    return interaction.update({
      components: [
        new ContainerBuilder()
          .setAccentColor(env.ACCENT_COLOR)
          .addSectionComponents(
            buildSection(
              "❌ **Rock Paper Scissors**",
              `${interaction.user} declined the challenge.`,
              icon,
            ),
          ),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  }

  if (action === "accept") {
    if (interaction.user.id !== game.opponentId) {
      return interaction.reply(
        errorContainer("You are not part of this game."),
      );
    }

    return interaction.update({
      components: [
        new ContainerBuilder()
          .setAccentColor(env.ACCENT_COLOR)
          .addSectionComponents(
            buildSection(
              "🪨 **Rock Paper Scissors**",
              `<@${game.challengerId}> vs <@${game.opponentId}>`,
              icon,
            ),
          )
          .addActionRowComponents((row) =>
            row.addComponents(
              new ButtonBuilder()
                .setCustomId(`rps:pick:${gameId}:rock`)
                .setEmoji("🪨")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`rps:pick:${gameId}:paper`)
                .setEmoji("📰")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`rps:pick:${gameId}:scissors`)
                .setEmoji("✂️")
                .setStyle(ButtonStyle.Secondary),
            ),
          ),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  }

  if (action === "pick") {
    if (
      interaction.user.id !== game.challengerId &&
      interaction.user.id !== game.opponentId
    ) {
      return interaction.reply(
        errorContainer("You are not part of this game."),
      );
    }

    if (game.choices[interaction.user.id]) {
      return interaction.reply(errorContainer("You already picked."));
    }

    game.choices[interaction.user.id] = pick as Choice;

    await interaction.reply({
      content: `You picked ${EMOJI[pick as Choice]}`,
      flags: MessageFlags.Ephemeral,
    });

    const a = game.choices[game.challengerId];
    const b = game.choices[game.opponentId];
    if (!a || !b) return;

    rps.delete(gameId);

    let result;
    if (a === b) result = "🤝 **It's a tie!**";
    else if (BEATS[a] === b) result = `🎉 <@${game.challengerId}> wins!`;
    else result = `🎉 <@${game.opponentId}> wins!`;

    return interaction.message.edit({
      components: [
        new ContainerBuilder()
          .setAccentColor(env.ACCENT_COLOR)
          .addSectionComponents(
            buildSection(
              "🪨 **Rock Paper Scissors**",
              `<@${game.challengerId}>: ${EMOJI[a]}\n<@${game.opponentId}>: ${EMOJI[b]}\n\n${result}`,
              icon,
            ),
          ),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  }
}
