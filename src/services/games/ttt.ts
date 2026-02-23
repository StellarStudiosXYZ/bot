import crypto from "node:crypto";

export type TttGame = {
  id: string;
  challengerId: string;
  opponentId: string;
  board: (null | "❌" | "⭕")[];
  turn: "❌" | "⭕";
};

export const ttt = new Map<string, TttGame>();

export function createTtt(challengerId: string, opponentId: string) {
  const game: TttGame = {
    id: crypto.randomUUID(),
    challengerId,
    opponentId,
    board: Array(9).fill(null),
    turn: "❌",
  };

  ttt.set(game.id, game);
  return game;
}
