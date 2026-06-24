import type { ActivityDTO } from "@shared/types";
import type { DB } from "../db";
import { activity } from "../db/schema";
import type { ActivityRow } from "../db/schema";

export type ActivityType =
  | "card.created"
  | "card.moved"
  | "card.assigned"
  | "card.completed"
  | "comment.added";

/** Records a board activity entry. Best-effort: never blocks the main action. */
export async function logActivity(
  db: DB,
  entry: {
    boardId: string;
    userId: string;
    type: ActivityType;
    data: Record<string, string>;
  },
): Promise<void> {
  try {
    await db.insert(activity).values({
      boardId: entry.boardId,
      userId: entry.userId,
      type: entry.type,
      data: JSON.stringify(entry.data),
    });
  } catch {
    // Activity logging must never break the underlying operation.
  }
}

export function toActivityDTO(row: ActivityRow & {
  user: { id: string; name: string; image: string | null };
}): ActivityDTO {
  let data: Record<string, string> = {};
  try {
    data = JSON.parse(row.data) as Record<string, string>;
  } catch {
    data = {};
  }
  return {
    id: row.id,
    type: row.type,
    createdAt: row.createdAt.toISOString(),
    actor: { id: row.user.id, name: row.user.name, image: row.user.image },
    data,
  };
}
