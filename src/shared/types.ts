/**
 * API DTOs shared between the worker (producers) and the client (consumers).
 * Dates are serialized as ISO-8601 strings over the wire.
 */

export interface LabelDTO {
  id: string;
  boardId: string;
  name: string;
  color: string;
}

export interface AuthorDTO {
  id: string;
  name: string;
  image: string | null;
}

export interface CommentDTO {
  id: string;
  cardId: string;
  body: string;
  createdAt: string;
  author: AuthorDTO;
}

export type Priority = "none" | "low" | "medium" | "high" | "urgent";

export const PRIORITY_RANK: Record<Priority, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

export const PRIORITY_META: Record<Exclude<Priority, "none">, { label: string; color: string }> = {
  low: { label: "Low", color: "#64748b" },
  medium: { label: "Medium", color: "#eab308" },
  high: { label: "High", color: "#f97316" },
  urgent: { label: "Urgent", color: "#ef4444" },
};

export interface ActivityDTO {
  id: string;
  type: string;
  createdAt: string;
  actor: AuthorDTO;
  data: Record<string, string>;
}

export type OrgRole = "owner" | "admin" | "member";

export interface OrgDTO {
  id: string;
  name: string;
  role: OrgRole;
  memberCount: number;
  isActive: boolean;
}

export interface MemberDTO {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: OrgRole;
}

export interface ChecklistItemDTO {
  id: string;
  cardId: string;
  text: string;
  completed: boolean;
  position: number;
}

export interface CardDTO {
  id: string;
  columnId: string;
  boardId: string;
  title: string;
  description: string | null;
  position: number;
  dueDate: string | null;
  completed: boolean;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  labels: LabelDTO[];
  commentCount: number;
  assignee: AuthorDTO | null;
  checklistTotal: number;
  checklistDone: number;
}

export interface ColumnDTO {
  id: string;
  boardId: string;
  title: string;
  position: number;
  cards: CardDTO[];
}

export interface BoardSummaryDTO {
  id: string;
  title: string;
  description: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
  columnCount: number;
  cardCount: number;
  role: OrgRole;
  memberCount: number;
}

export interface BoardDetailDTO {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
  columns: ColumnDTO[];
  labels: LabelDTO[];
  members: MemberDTO[];
  role: OrgRole;
}

export interface CardDetailDTO extends CardDTO {
  comments: CommentDTO[];
  checklist: ChecklistItemDTO[];
}

export interface ApiError {
  error: string;
}

/** Palette offered in the UI for boards and labels. */
export const LABEL_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#64748b",
] as const;

export const BOARD_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
] as const;
