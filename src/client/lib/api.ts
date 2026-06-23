import type {
  BoardDetailDTO,
  BoardSummaryDTO,
  CardDetailDTO,
  CardDTO,
  ColumnDTO,
  CommentDTO,
  LabelDTO,
} from "@shared/types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const body = (data: unknown) => ({ method: "POST", body: JSON.stringify(data) });
const patch = (data: unknown) => ({ method: "PATCH", body: JSON.stringify(data) });
const del = { method: "DELETE" };

export interface Me {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export const api = {
  me: () => http<Me>("/me"),

  // Boards
  listBoards: () => http<BoardSummaryDTO[]>("/boards"),
  getBoard: (boardId: string) => http<BoardDetailDTO>(`/boards/${boardId}`),
  createBoard: (data: { title: string; description?: string; color?: string }) =>
    http<BoardSummaryDTO>("/boards", body(data)),
  updateBoard: (
    boardId: string,
    data: { title?: string; description?: string | null; color?: string },
  ) => http<BoardSummaryDTO>(`/boards/${boardId}`, patch(data)),
  deleteBoard: (boardId: string) => http<void>(`/boards/${boardId}`, del),

  // Columns
  createColumn: (boardId: string, title: string) =>
    http<ColumnDTO>(`/boards/${boardId}/columns`, body({ title })),
  updateColumn: (columnId: string, data: { title?: string; position?: number }) =>
    http<ColumnDTO>(`/columns/${columnId}`, patch(data)),
  deleteColumn: (columnId: string) => http<void>(`/columns/${columnId}`, del),

  // Cards
  createCard: (columnId: string, title: string) =>
    http<CardDTO>(`/columns/${columnId}/cards`, body({ title })),
  getCard: (cardId: string) => http<CardDetailDTO>(`/cards/${cardId}`),
  updateCard: (
    cardId: string,
    data: {
      title?: string;
      description?: string | null;
      dueDate?: string | null;
      completed?: boolean;
      columnId?: string;
      position?: number;
    },
  ) => http<CardDTO>(`/cards/${cardId}`, patch(data)),
  deleteCard: (cardId: string) => http<void>(`/cards/${cardId}`, del),
  addCardLabel: (cardId: string, labelId: string) =>
    http<CardDTO>(`/cards/${cardId}/labels`, body({ labelId })),
  removeCardLabel: (cardId: string, labelId: string) =>
    http<CardDTO>(`/cards/${cardId}/labels/${labelId}`, del),
  addComment: (cardId: string, body_: string) =>
    http<CommentDTO>(`/cards/${cardId}/comments`, body({ body: body_ })),
  deleteComment: (commentId: string) => http<void>(`/comments/${commentId}`, del),

  // Labels
  createLabel: (boardId: string, data: { name: string; color: string }) =>
    http<LabelDTO>(`/boards/${boardId}/labels`, body(data)),
  updateLabel: (labelId: string, data: { name?: string; color?: string }) =>
    http<LabelDTO>(`/labels/${labelId}`, patch(data)),
  deleteLabel: (labelId: string) => http<void>(`/labels/${labelId}`, del),
};
