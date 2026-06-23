-- Demo seed for kanban-db (generated from a real Better Auth signup).
-- Apply to remote D1:  npx wrangler d1 execute kanban-db --remote --file=drizzle/seed-demo.sql
-- Demo login: demo@kanban.dev / demo1234

INSERT OR IGNORE INTO "user" ("id", "name", "email", "email_verified", "image", "created_at", "updated_at") VALUES ('vbBGWKxpyZJzxIc3DDR6xmgU7dieWFpn', 'Ada Lovelace', 'demo@kanban.dev', 0, NULL, 1782236657, 1782236657);

INSERT OR IGNORE INTO "account" ("id", "account_id", "provider_id", "user_id", "access_token", "refresh_token", "id_token", "access_token_expires_at", "refresh_token_expires_at", "scope", "password", "created_at", "updated_at") VALUES ('jMpgXOaaCfPZQaSDn2cv2DsrE5SniUZW', 'vbBGWKxpyZJzxIc3DDR6xmgU7dieWFpn', 'credential', 'vbBGWKxpyZJzxIc3DDR6xmgU7dieWFpn', NULL, NULL, NULL, NULL, NULL, NULL, 'a2268d2fa2f936d641f628a65203b5bf:4dd9d9521aba63aa72262a1a6f94c7272e5e467a37c6c54d7a49e103719a3667451dddbf28891159b4d3b47bdaba528ea18ff51d2a5542bf253ecd5935d4989d', 1782236657, 1782236657);

INSERT OR IGNORE INTO "board" ("id", "owner_id", "title", "description", "color", "created_at", "updated_at") VALUES ('92dab8b2-7abe-4867-900b-39e4c9a25937', 'vbBGWKxpyZJzxIc3DDR6xmgU7dieWFpn', 'Product Roadmap', 'Q3 planning for the web platform.', '#6366f1', 1782236657, 1782236657);
INSERT OR IGNORE INTO "board" ("id", "owner_id", "title", "description", "color", "created_at", "updated_at") VALUES ('d2a8514c-b689-4b1e-b00c-90ddc5f12168', 'vbBGWKxpyZJzxIc3DDR6xmgU7dieWFpn', 'Personal Tasks', 'Day-to-day todos.', '#10b981', 1782236658, 1782236658);

INSERT OR IGNORE INTO "column" ("id", "board_id", "title", "position", "created_at") VALUES ('088b1811-2c61-4500-beae-5758e057f5b7', '92dab8b2-7abe-4867-900b-39e4c9a25937', 'To Do', 1000, 1782236657);
INSERT OR IGNORE INTO "column" ("id", "board_id", "title", "position", "created_at") VALUES ('147acb31-0cf5-4b8d-8ee8-4ea01ecd9c8b', '92dab8b2-7abe-4867-900b-39e4c9a25937', 'In Progress', 2000, 1782236657);
INSERT OR IGNORE INTO "column" ("id", "board_id", "title", "position", "created_at") VALUES ('14a81ccb-00cb-45c3-b913-3ca6a35253e0', '92dab8b2-7abe-4867-900b-39e4c9a25937', 'Done', 3000, 1782236657);
INSERT OR IGNORE INTO "column" ("id", "board_id", "title", "position", "created_at") VALUES ('7a2f9d69-291a-4d0f-92bb-c4daf1e75d55', 'd2a8514c-b689-4b1e-b00c-90ddc5f12168', 'To Do', 1000, 1782236658);
INSERT OR IGNORE INTO "column" ("id", "board_id", "title", "position", "created_at") VALUES ('ae5f9955-c9bf-4724-8231-9c477eac41a0', 'd2a8514c-b689-4b1e-b00c-90ddc5f12168', 'In Progress', 2000, 1782236658);
INSERT OR IGNORE INTO "column" ("id", "board_id", "title", "position", "created_at") VALUES ('e3a03535-f3b7-4382-9bba-d78dcb4286b6', 'd2a8514c-b689-4b1e-b00c-90ddc5f12168', 'Done', 3000, 1782236658);

INSERT OR IGNORE INTO "card" ("id", "column_id", "board_id", "title", "description", "position", "due_date", "completed", "created_at", "updated_at") VALUES ('8f24bfa1-630a-438c-a235-edc8635a7e7d', '088b1811-2c61-4500-beae-5758e057f5b7', '92dab8b2-7abe-4867-900b-39e4c9a25937', 'Design the new onboarding flow', 'Reduce drop-off on the first run experience.', 1000, 1782668657, 0, 1782236657, 1782236658);
INSERT OR IGNORE INTO "card" ("id", "column_id", "board_id", "title", "description", "position", "due_date", "completed", "created_at", "updated_at") VALUES ('73f932d1-af64-4bf0-ad2c-ecef751f5ceb', '088b1811-2c61-4500-beae-5758e057f5b7', '92dab8b2-7abe-4867-900b-39e4c9a25937', 'Investigate slow dashboard query', NULL, 2000, 1782323058, 0, 1782236658, 1782236658);
INSERT OR IGNORE INTO "card" ("id", "column_id", "board_id", "title", "description", "position", "due_date", "completed", "created_at", "updated_at") VALUES ('4e336253-3777-42c0-a1bf-e1a37440d9e2', '147acb31-0cf5-4b8d-8ee8-4ea01ecd9c8b', '92dab8b2-7abe-4867-900b-39e4c9a25937', 'Build the Kanban drag-and-drop', 'Cards should move between columns optimistically.', 1000, NULL, 0, 1782236658, 1782236658);
INSERT OR IGNORE INTO "card" ("id", "column_id", "board_id", "title", "description", "position", "due_date", "completed", "created_at", "updated_at") VALUES ('d1417168-60ca-4316-a855-d844287d4f72', '147acb31-0cf5-4b8d-8ee8-4ea01ecd9c8b', '92dab8b2-7abe-4867-900b-39e4c9a25937', 'Wire up Better Auth sessions', NULL, 2000, NULL, 0, 1782236658, 1782236658);
INSERT OR IGNORE INTO "card" ("id", "column_id", "board_id", "title", "description", "position", "due_date", "completed", "created_at", "updated_at") VALUES ('facde6c1-067f-4475-8100-025f5bb72458', '14a81ccb-00cb-45c3-b913-3ca6a35253e0', '92dab8b2-7abe-4867-900b-39e4c9a25937', 'Set up Cloudflare Workers + D1', NULL, 1000, NULL, 1, 1782236658, 1782236658);
INSERT OR IGNORE INTO "card" ("id", "column_id", "board_id", "title", "description", "position", "due_date", "completed", "created_at", "updated_at") VALUES ('c5b5eb97-a1be-4d22-993e-eabc0fa6eb9c', '14a81ccb-00cb-45c3-b913-3ca6a35253e0', '92dab8b2-7abe-4867-900b-39e4c9a25937', 'Scaffold the project', NULL, 2000, NULL, 1, 1782236658, 1782236658);
INSERT OR IGNORE INTO "card" ("id", "column_id", "board_id", "title", "description", "position", "due_date", "completed", "created_at", "updated_at") VALUES ('87d82091-977f-48da-a9ff-470e1ba41723', '7a2f9d69-291a-4d0f-92bb-c4daf1e75d55', 'd2a8514c-b689-4b1e-b00c-90ddc5f12168', 'Buy groceries', NULL, 1000, 1782236658, 0, 1782236658, 1782236658);
INSERT OR IGNORE INTO "card" ("id", "column_id", "board_id", "title", "description", "position", "due_date", "completed", "created_at", "updated_at") VALUES ('4d63a472-1987-47ef-badd-7b3a474fc7c6', '7a2f9d69-291a-4d0f-92bb-c4daf1e75d55', 'd2a8514c-b689-4b1e-b00c-90ddc5f12168', 'Read ''Designing Data-Intensive Applications''', NULL, 2000, NULL, 0, 1782236658, 1782236658);
INSERT OR IGNORE INTO "card" ("id", "column_id", "board_id", "title", "description", "position", "due_date", "completed", "created_at", "updated_at") VALUES ('69eb6158-6aac-40c8-be72-631efa53f052', 'ae5f9955-c9bf-4724-8231-9c477eac41a0', 'd2a8514c-b689-4b1e-b00c-90ddc5f12168', 'Plan weekend trip', NULL, 1000, 1782495858, 0, 1782236658, 1782236658);
INSERT OR IGNORE INTO "card" ("id", "column_id", "board_id", "title", "description", "position", "due_date", "completed", "created_at", "updated_at") VALUES ('2272a32d-7825-4cc0-9397-d60f0fcd0231', 'e3a03535-f3b7-4382-9bba-d78dcb4286b6', 'd2a8514c-b689-4b1e-b00c-90ddc5f12168', 'Renew gym membership', NULL, 1000, NULL, 1, 1782236658, 1782236658);

INSERT OR IGNORE INTO "label" ("id", "board_id", "name", "color") VALUES ('7429ac70-ea25-4c8c-9d6d-57aec2ef26d0', '92dab8b2-7abe-4867-900b-39e4c9a25937', 'Bug', '#ef4444');
INSERT OR IGNORE INTO "label" ("id", "board_id", "name", "color") VALUES ('ee1dee9e-b9d9-4abd-a8c3-d70671326f70', '92dab8b2-7abe-4867-900b-39e4c9a25937', 'Feature', '#22c55e');
INSERT OR IGNORE INTO "label" ("id", "board_id", "name", "color") VALUES ('54b1dde5-ad78-4052-8015-196ce218e30f', '92dab8b2-7abe-4867-900b-39e4c9a25937', 'Urgent', '#f97316');
INSERT OR IGNORE INTO "label" ("id", "board_id", "name", "color") VALUES ('41645715-742b-4e80-b8e2-e982e00dcae0', '92dab8b2-7abe-4867-900b-39e4c9a25937', 'Design', '#a855f7');
INSERT OR IGNORE INTO "label" ("id", "board_id", "name", "color") VALUES ('3a08adbe-ef2b-4f1d-93e2-2341e6fb5d5d', 'd2a8514c-b689-4b1e-b00c-90ddc5f12168', 'Bug', '#ef4444');
INSERT OR IGNORE INTO "label" ("id", "board_id", "name", "color") VALUES ('c937ac2f-b38e-4424-871a-02437a6724b0', 'd2a8514c-b689-4b1e-b00c-90ddc5f12168', 'Feature', '#22c55e');
INSERT OR IGNORE INTO "label" ("id", "board_id", "name", "color") VALUES ('477c728b-85e0-452b-9bc7-f32400ca6e9d', 'd2a8514c-b689-4b1e-b00c-90ddc5f12168', 'Urgent', '#f97316');
INSERT OR IGNORE INTO "label" ("id", "board_id", "name", "color") VALUES ('a6becbe9-01a2-4e45-bbbf-278a1c6373b1', 'd2a8514c-b689-4b1e-b00c-90ddc5f12168', 'Design', '#a855f7');

INSERT OR IGNORE INTO "card_label" ("card_id", "label_id") VALUES ('8f24bfa1-630a-438c-a235-edc8635a7e7d', 'ee1dee9e-b9d9-4abd-a8c3-d70671326f70');
INSERT OR IGNORE INTO "card_label" ("card_id", "label_id") VALUES ('8f24bfa1-630a-438c-a235-edc8635a7e7d', '41645715-742b-4e80-b8e2-e982e00dcae0');
INSERT OR IGNORE INTO "card_label" ("card_id", "label_id") VALUES ('73f932d1-af64-4bf0-ad2c-ecef751f5ceb', '7429ac70-ea25-4c8c-9d6d-57aec2ef26d0');
INSERT OR IGNORE INTO "card_label" ("card_id", "label_id") VALUES ('73f932d1-af64-4bf0-ad2c-ecef751f5ceb', '54b1dde5-ad78-4052-8015-196ce218e30f');
INSERT OR IGNORE INTO "card_label" ("card_id", "label_id") VALUES ('4e336253-3777-42c0-a1bf-e1a37440d9e2', 'ee1dee9e-b9d9-4abd-a8c3-d70671326f70');
INSERT OR IGNORE INTO "card_label" ("card_id", "label_id") VALUES ('d1417168-60ca-4316-a855-d844287d4f72', 'ee1dee9e-b9d9-4abd-a8c3-d70671326f70');
INSERT OR IGNORE INTO "card_label" ("card_id", "label_id") VALUES ('facde6c1-067f-4475-8100-025f5bb72458', 'ee1dee9e-b9d9-4abd-a8c3-d70671326f70');
INSERT OR IGNORE INTO "card_label" ("card_id", "label_id") VALUES ('4d63a472-1987-47ef-badd-7b3a474fc7c6', 'c937ac2f-b38e-4424-871a-02437a6724b0');

INSERT OR IGNORE INTO "comment" ("id", "card_id", "user_id", "body", "created_at") VALUES ('8735a62e-fee5-4ef6-9987-c1eef9e1bb48', '8f24bfa1-630a-438c-a235-edc8635a7e7d', 'vbBGWKxpyZJzxIc3DDR6xmgU7dieWFpn', 'Let''s keep it to three steps max.', 1782236658);
INSERT OR IGNORE INTO "comment" ("id", "card_id", "user_id", "body", "created_at") VALUES ('f05b2ed8-7e99-4d2e-a78f-6566d3edd04a', '8f24bfa1-630a-438c-a235-edc8635a7e7d', 'vbBGWKxpyZJzxIc3DDR6xmgU7dieWFpn', 'Agreed — mockups by Friday.', 1782236658);
INSERT OR IGNORE INTO "comment" ("id", "card_id", "user_id", "body", "created_at") VALUES ('f9a4e2db-8ad9-4bfb-a89f-edf7f23ea5c3', '4e336253-3777-42c0-a1bf-e1a37440d9e2', 'vbBGWKxpyZJzxIc3DDR6xmgU7dieWFpn', 'dnd-kit is working great so far.', 1782236658);
INSERT OR IGNORE INTO "comment" ("id", "card_id", "user_id", "body", "created_at") VALUES ('d59d690f-2974-4d6a-b470-7030c62dfac2', 'facde6c1-067f-4475-8100-025f5bb72458', 'vbBGWKxpyZJzxIc3DDR6xmgU7dieWFpn', 'Deployed on the first try 🎉', 1782236658);

