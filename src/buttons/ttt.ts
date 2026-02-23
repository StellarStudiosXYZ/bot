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
import { ttt } from "@/services/games/ttt";

const wins = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const EMPTY = "\u200b";

export async function handleTttButton(interaction: ButtonInteraction) {
  const [, action, gameId, indexRaw] = interaction.customId.split(":");
  const game = ttt.get(gameId);

  if (!game) {
    return interaction.reply(errorContainer("This game has expired."));
  }

  const icon =
    interaction.guild?.iconURL() ??
    "https://cdn.discordapp.com/embed/avatars/0.png";

  if (action === "decline") {
    if (interaction.user.id !== game.opponentId) {
      return interaction.reply(
        errorContainer("You are not part of this game."),
      );
    }

    ttt.delete(gameId);

    return interaction.update({
      components: [
        new ContainerBuilder()
          .setAccentColor(env.ACCENT_COLOR)
          .addSectionComponents(
            new SectionBuilder()
              .addTextDisplayComponents(
                (t) => t.setContent("❌⭕ **Tic Tac Toe**"),
                (t) => t.setContent("Challenge declined."),
              )
              .setThumbnailAccessory((th) => th.setURL(icon)),
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
  }

  if (action === "move") {
    const index = Number(indexRaw);

    const symbol =
      interaction.user.id === game.challengerId
        ? "❌"
        : interaction.user.id === game.opponentId
          ? "⭕"
          : null;

    if (!symbol) {
      return interaction.reply(
        errorContainer("You are not part of this game."),
      );
    }

    if (symbol !== game.turn) {
      return interaction.reply(errorContainer("It's not your turn."));
    }

    if (game.board[index]) {
      return interaction.reply(errorContainer("That spot is taken."));
    }

    game.board[index] = symbol;
    game.turn = symbol === "❌" ? "⭕" : "❌";
  }

  const winnerLine = wins.find((l) =>
    l.every((i) => game.board[i] === game.board[l[0]] && game.board[i]),
  );

  const draw = game.board.every(Boolean);

  const winnerSymbol = winnerLine ? game.board[winnerLine[0]] : null;
  const winnerId =
    winnerSymbol === "❌"
      ? game.challengerId
      : winnerSymbol === "⭕"
        ? game.opponentId
        : null;

  const loserId =
    winnerId === game.challengerId
      ? game.opponentId
      : winnerId === game.opponentId
        ? game.challengerId
        : null;

  const buttons = game.board.map((cell, i) =>
    new ButtonBuilder()
      .setCustomId(`ttt:move:${game.id}:${i}`)
      .setLabel(cell ?? EMPTY)
      .setStyle(
        winnerLine?.includes(i) ? ButtonStyle.Primary : ButtonStyle.Secondary,
      )
      .setDisabled(!!cell || !!winnerLine || draw),
  );

  if (winnerLine || draw) ttt.delete(gameId);

  return interaction.update({
    components: [
      new ContainerBuilder()
        .setAccentColor(env.ACCENT_COLOR)
        .addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              (t) => t.setContent("❌⭕ **Tic Tac Toe**"),
              (t) =>
                t.setContent(
                  winnerId && loserId
                    ? `🎉 <@${winnerId}> wins!\n💀 <@${loserId}> loses`
                    : draw
                      ? "🤝 It's a draw!"
                      : `<@${game.challengerId}> vs <@${game.opponentId}>\nTurn: ${game.turn}`,
                ),
            )
            .setThumbnailAccessory((th) => th.setURL(icon)),
        )
        .addActionRowComponents((r) => r.addComponents(...buttons.slice(0, 3)))
        .addActionRowComponents((r) => r.addComponents(...buttons.slice(3, 6)))
        .addActionRowComponents((r) => r.addComponents(...buttons.slice(6, 9))),
    ],
    flags: MessageFlags.IsComponentsV2,
  });
}
