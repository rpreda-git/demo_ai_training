export const queryKeys = {
  me: ["me"] as const,
  orgs: ["orgs"] as const,
  boards: ["boards"] as const,
  board: (boardId: string) => ["board", boardId] as const,
  activity: (boardId: string) => ["board", boardId, "activity"] as const,
  card: (cardId: string) => ["card", cardId] as const,
};
