type Choice = "rock" | "paper" | "scissors";

export const rps = new Map<
  string,
  {
    challengerId: string;
    opponentId: string;
    choices: Partial<Record<string, Choice>>;
  }
>();
