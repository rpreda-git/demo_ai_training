import type {
  AuthorDTO,
  BoardSummaryDTO,
  CardDTO,
  ChecklistItemDTO,
  ColumnDTO,
  CommentDTO,
  LabelDTO,
  MemberDTO,
  OrgDTO,
} from "@shared/types";
import type {
  BoardRow,
  CardRow,
  ChecklistItemRow,
  ColumnRow,
  LabelRow,
  OrganizationRow,
  OrgRole,
} from "../db/schema";

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);

export function toLabelDTO(row: LabelRow): LabelDTO {
  return { id: row.id, boardId: row.boardId, name: row.name, color: row.color };
}

export function toAuthorDTO(
  user: { id: string; name: string; image: string | null } | null | undefined,
): AuthorDTO | null {
  return user ? { id: user.id, name: user.name, image: user.image } : null;
}

export function toChecklistItemDTO(row: ChecklistItemRow): ChecklistItemDTO {
  return {
    id: row.id,
    cardId: row.cardId,
    text: row.text,
    completed: row.completed,
    position: row.position,
  };
}

export interface CardExtras {
  labels: LabelRow[];
  commentCount: number;
  assignee: AuthorDTO | null;
  checklistTotal: number;
  checklistDone: number;
}

export const EMPTY_CARD_EXTRAS: CardExtras = {
  labels: [],
  commentCount: 0,
  assignee: null,
  checklistTotal: 0,
  checklistDone: 0,
};

export function toCardDTO(row: CardRow, extra: CardExtras): CardDTO {
  return {
    id: row.id,
    columnId: row.columnId,
    boardId: row.boardId,
    title: row.title,
    description: row.description,
    position: row.position,
    dueDate: iso(row.dueDate),
    completed: row.completed,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    labels: extra.labels.map(toLabelDTO),
    commentCount: extra.commentCount,
    assignee: extra.assignee,
    checklistTotal: extra.checklistTotal,
    checklistDone: extra.checklistDone,
  };
}

export function toColumnDTO(row: ColumnRow, cards: CardDTO[]): ColumnDTO {
  return {
    id: row.id,
    boardId: row.boardId,
    title: row.title,
    position: row.position,
    cards,
  };
}

export function toBoardSummaryDTO(
  row: BoardRow,
  meta: { columnCount: number; cardCount: number; role: OrgRole; memberCount: number },
): BoardSummaryDTO {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    color: row.color,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    columnCount: meta.columnCount,
    cardCount: meta.cardCount,
    role: meta.role,
    memberCount: meta.memberCount,
  };
}

export function toOrgDTO(
  row: OrganizationRow,
  meta: { role: OrgRole; memberCount: number; isActive: boolean },
): OrgDTO {
  return {
    id: row.id,
    name: row.name,
    role: meta.role,
    memberCount: meta.memberCount,
    isActive: meta.isActive,
  };
}

export function toMemberDTO(row: {
  role: OrgRole;
  user: { id: string; name: string; email: string; image: string | null };
}): MemberDTO {
  return {
    userId: row.user.id,
    name: row.user.name,
    email: row.user.email,
    image: row.user.image,
    role: row.role,
  };
}

export function toCommentDTO(row: {
  id: string;
  cardId: string;
  body: string;
  createdAt: Date;
  author: AuthorDTO;
}): CommentDTO {
  return {
    id: row.id,
    cardId: row.cardId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    author: row.author,
  };
}
