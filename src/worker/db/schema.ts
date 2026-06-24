import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  index,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date());

/* -------------------------------------------------------------------------- */
/*  Better Auth tables                                                        */
/*  Property keys (camelCase) must match Better Auth's expected field names;  */
/*  SQL column names may be snake_case.                                       */
/* -------------------------------------------------------------------------- */

export const user = sqliteTable("user", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  // The organization whose boards the user is currently viewing.
  activeOrganizationId: text("active_organization_id").references(
    (): AnySQLiteColumn => organization.id,
    { onDelete: "set null" },
  ),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = sqliteTable("session", {
  id: id(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: id(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const verification = sqliteTable("verification", {
  id: id(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* -------------------------------------------------------------------------- */
/*  Application tables                                                        */
/* -------------------------------------------------------------------------- */

export const board = sqliteTable("board", {
  id: id(),
  // Nullable in the DB to keep the migration simple; always set by the app.
  organizationId: text("organization_id").references(() => organization.id, {
    onDelete: "cascade",
  }),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#6366f1"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const column = sqliteTable(
  "column",
  {
    id: id(),
    boardId: text("board_id")
      .notNull()
      .references(() => board.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: real("position").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("column_board_idx").on(t.boardId)],
);

export const card = sqliteTable(
  "card",
  {
    id: id(),
    columnId: text("column_id")
      .notNull()
      .references(() => column.id, { onDelete: "cascade" }),
    boardId: text("board_id")
      .notNull()
      .references(() => board.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    position: real("position").notNull(),
    dueDate: integer("due_date", { mode: "timestamp" }),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
    assigneeId: text("assignee_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("card_column_idx").on(t.columnId), index("card_board_idx").on(t.boardId)],
);

export const checklistItem = sqliteTable(
  "checklist_item",
  {
    id: id(),
    cardId: text("card_id")
      .notNull()
      .references(() => card.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
    position: real("position").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("checklist_card_idx").on(t.cardId)],
);

export const label = sqliteTable(
  "label",
  {
    id: id(),
    boardId: text("board_id")
      .notNull()
      .references(() => board.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull(),
  },
  (t) => [index("label_board_idx").on(t.boardId)],
);

export const cardLabel = sqliteTable(
  "card_label",
  {
    cardId: text("card_id")
      .notNull()
      .references(() => card.id, { onDelete: "cascade" }),
    labelId: text("label_id")
      .notNull()
      .references(() => label.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.cardId, t.labelId] })],
);

export const comment = sqliteTable(
  "comment",
  {
    id: id(),
    cardId: text("card_id")
      .notNull()
      .references(() => card.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("comment_card_idx").on(t.cardId)],
);

export const organization = sqliteTable("organization", {
  id: id(),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
});

export const orgMember = sqliteTable(
  "org_member",
  {
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // "owner" manages the org; "admin" manages members; "member" edits content.
    role: text("role", { enum: ["owner", "admin", "member"] })
      .notNull()
      .default("member"),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.organizationId, t.userId] }),
    index("org_member_user_idx").on(t.userId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Relations (used by Drizzle's relational query API)                        */
/* -------------------------------------------------------------------------- */

export const boardRelations = relations(board, ({ many, one }) => ({
  owner: one(user, { fields: [board.ownerId], references: [user.id] }),
  organization: one(organization, {
    fields: [board.organizationId],
    references: [organization.id],
  }),
  columns: many(column),
  labels: many(label),
  cards: many(card),
}));

export const organizationRelations = relations(organization, ({ many, one }) => ({
  owner: one(user, { fields: [organization.ownerId], references: [user.id] }),
  members: many(orgMember),
  boards: many(board),
}));

export const orgMemberRelations = relations(orgMember, ({ one }) => ({
  organization: one(organization, {
    fields: [orgMember.organizationId],
    references: [organization.id],
  }),
  user: one(user, { fields: [orgMember.userId], references: [user.id] }),
}));

export const columnRelations = relations(column, ({ one, many }) => ({
  board: one(board, { fields: [column.boardId], references: [board.id] }),
  cards: many(card),
}));

export const cardRelations = relations(card, ({ one, many }) => ({
  column: one(column, { fields: [card.columnId], references: [column.id] }),
  board: one(board, { fields: [card.boardId], references: [board.id] }),
  assignee: one(user, { fields: [card.assigneeId], references: [user.id] }),
  cardLabels: many(cardLabel),
  comments: many(comment),
  checklist: many(checklistItem),
}));

export const checklistItemRelations = relations(checklistItem, ({ one }) => ({
  card: one(card, { fields: [checklistItem.cardId], references: [card.id] }),
}));

export const labelRelations = relations(label, ({ one, many }) => ({
  board: one(board, { fields: [label.boardId], references: [board.id] }),
  cardLabels: many(cardLabel),
}));

export const cardLabelRelations = relations(cardLabel, ({ one }) => ({
  card: one(card, { fields: [cardLabel.cardId], references: [card.id] }),
  label: one(label, { fields: [cardLabel.labelId], references: [label.id] }),
}));

export const commentRelations = relations(comment, ({ one }) => ({
  card: one(card, { fields: [comment.cardId], references: [card.id] }),
  user: one(user, { fields: [comment.userId], references: [user.id] }),
}));

export type BoardRow = typeof board.$inferSelect;
export type ColumnRow = typeof column.$inferSelect;
export type CardRow = typeof card.$inferSelect;
export type LabelRow = typeof label.$inferSelect;
export type CommentRow = typeof comment.$inferSelect;
export type UserRow = typeof user.$inferSelect;
export type ChecklistItemRow = typeof checklistItem.$inferSelect;
export type OrganizationRow = typeof organization.$inferSelect;
export type OrgMemberRow = typeof orgMember.$inferSelect;
export type OrgRole = OrgMemberRow["role"];
