export const queryKeys = {
  me: ["me"] as const,
  boards: ["boards"] as const,
  board: (boardId: string) => ["board", boardId] as const,
  card: (cardId: string) => ["card", cardId] as const,
};
