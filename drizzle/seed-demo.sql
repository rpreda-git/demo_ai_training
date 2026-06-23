-- Demo seed for kanban-db (generated from a real, fully-featured session).
-- Apply to remote D1:  npx wrangler d1 execute kanban-db --remote --file=drizzle/seed-demo.sql
-- Logins: demo@kanban.dev / demo1234   and   grace@kanban.dev / grace1234

INSERT OR IGNORE INTO "user" ("id", "name", "email", "email_verified", "image", "created_at", "updated_at") VALUES ('LxAmh2eluag28qi4dy2UA9nbwXRuHOWl', 'Ada Lovelace', 'demo@kanban.dev', 0, NULL, 1782239932, 1782239932);
INSERT OR IGNORE INTO "user" ("id", "name", "email", "email_verified", "image", "created_at", "updated_at") VALUES ('Bd6Ai9UWjEuR240kIuncQgeRg2ErcRea', 'Grace Hopper', 'grace@kanban.dev', 0, NULL, 1782239933, 1782239933);

INSERT OR IGNORE INTO "account" ("id", "account_id", "provider_id", "user_id", "access_token", "refresh_token", "id_token", "access_token_expires_at", "refresh_token_expires_at", "scope", "password", "created_at", "updated_at") VALUES ('CrNrCoM9IVrdRCMhEnd1NcAZDzHaMXvN', 'LxAmh2eluag28qi4dy2UA9nbwXRuHOWl', 'credential', 'LxAmh2eluag28qi4dy2UA9nbwXRuHOWl', NULL, NULL, NULL, NULL, NULL, NULL, 'fdbb49a516f67656267681879bd503b1:7592a550ed1fab41f7b2c75fecfc0adb50ef9ab7417dc3593eb944479064cd34c59a03b0ebd472c7732a23fe8ff8619946ff124abc24f68e1313e39ca87a79da', 1782239932, 1782239932);
INSERT OR IGNORE INTO "account" ("id", "account_id", "provider_id", "user_id", "access_token", "refresh_token", "id_token", "access_token_expires_at", "refresh_token_expires_at", "scope", "password", "created_at", "updated_at") VALUES ('ZFEJRYnEl5tU5WyFhTx0HINFCsVBeJ3i', 'Bd6Ai9UWjEuR240kIuncQgeRg2ErcRea', 'credential', 'Bd6Ai9UWjEuR240kIuncQgeRg2ErcRea', NULL, NULL, NULL, NULL, NULL, NULL, '1bde9445ba99f52d7d6a2f5ef6ec8a14:1c512c858fcd1028742fe2f6142ca784ad4f850a4a38ee22a2db4993d8f1bf5cb1f8e358cd5ed83c79b44a8a8915118740a09675c61ee8d52a7a901584d0042c', 1782239933, 1782239933);

INSERT OR IGNORE INTO "board" ("id", "owner_id", "title", "description", "color", "created_at", "updated_at") VALUES ('4f02dae0-c169-4ac0-895a-a256b7525ef5', 'LxAmh2eluag28qi4dy2UA9nbwXRuHOWl', 'Product Roadmap', 'Q3 planning for the web platform.', '#6366f1', 1782239932, 1782239932);
INSERT OR IGNORE INTO "board" ("id", "owner_id", "title", "description", "color", "created_at", "updated_at") VALUES ('055c0470-8572-4672-bed2-91c014b61b04', 'LxAmh2eluag28qi4dy2UA9nbwXRuHOWl', 'Personal Tasks', 'Day-to-day todos.', '#10b981', 1782239933, 1782239933);

INSERT OR IGNORE INTO "board_member" ("board_id", "user_id", "role", "created_at") VALUES ('4f02dae0-c169-4ac0-895a-a256b7525ef5', 'LxAmh2eluag28qi4dy2UA9nbwXRuHOWl', 'owner', 1782239932);
INSERT OR IGNORE INTO "board_member" ("board_id", "user_id", "role", "created_at") VALUES ('055c0470-8572-4672-bed2-91c014b61b04', 'LxAmh2eluag28qi4dy2UA9nbwXRuHOWl', 'owner', 1782239933);
INSERT OR IGNORE INTO "board_member" ("board_id", "user_id", "role", "created_at") VALUES ('4f02dae0-c169-4ac0-895a-a256b7525ef5', 'Bd6Ai9UWjEuR240kIuncQgeRg2ErcRea', 'editor', 1782239959);

INSERT OR IGNORE INTO "column" ("id", "board_id", "title", "position", "created_at") VALUES ('a7127ce9-d9c8-4533-b7cb-5146dbc182c8', '4f02dae0-c169-4ac0-895a-a256b7525ef5', 'To Do', 1000, 1782239932);
INSERT OR IGNORE INTO "column" ("id", "board_id", "title", "position", "created_at") VALUES ('1dd205fc-a5d6-42a1-921c-59db723a5963', '4f02dae0-c169-4ac0-895a-a256b7525ef5', 'In Progress', 2000, 1782239932);
INSERT OR IGNORE INTO "column" ("id", "board_id", "title", "position", "created_at") VALUES ('c012509d-75a5-421c-9f74-5f0862f5ac4c', '4f02dae0-c169-4ac0-895a-a256b7525ef5', 'Done', 3000, 1782239932);
INSERT OR IGNORE INTO "column" ("id", "board_id", "title", "position", "created_at") VALUES ('a1754026-6445-42a2-9915-1f5cde5ee145', '055c0470-8572-4672-bed2-91c014b61b04', 'To Do', 1000, 1782239933);
INSERT OR IGNORE INTO "column" ("id", "board_id", "title", "position", "created_at") VALUES ('cc0854ed-d311-43f6-8d7b-40c084278505', '055c0470-8572-4672-bed2-91c014b61b04', 'In Progress', 2000, 1782239933);
INSERT OR IGNORE INTO "column" ("id", "board_id", "title", "position", "created_at") VALUES ('73c8057a-bb8f-4965-8606-4571ebbf1429', '055c0470-8572-4672-bed2-91c014b61b04', 'Done', 3000, 1782239933);

INSERT OR IGNORE INTO "card" ("id", "column_id", "board_id", "title", "description", "position", "due_date", "completed", "created_at", "updated_at", "assignee_id") VALUES ('ee8431e0-2905-4ba4-90b4-aa0a9f65f46d', 'a7127ce9-d9c8-4533-b7cb-5146dbc182c8', '4f02dae0-c169-4ac0-895a-a256b7525ef5', 'Design the new onboarding flow', 'Reduce drop-off on the first run experience.', 1000, 1782671932, 1, 1782239932, 1782239976, 'Bd6Ai9UWjEuR240kIuncQgeRg2ErcRea');
INSERT OR IGNORE INTO "card" ("id", "column_id", "board_id", "title", "description", "position", "due_date", "completed", "created_at", "updated_at", "assignee_id") VALUES ('6cefb32e-c727-4922-bab2-026e354f78b3', 'a7127ce9-d9c8-4533-b7cb-5146dbc182c8', '4f02dae0-c169-4ac0-895a-a256b7525ef5', 'Investigate slow dashboard query', NULL, 2000, 1782326332, 0, 1782239932, 1782239932, NULL);
INSERT OR IGNORE INTO "card" ("id", "column_id", "board_id", "title", "description", "position", "due_date", "completed", "created_at", "updated_at", "assignee_id") VALUES ('faf1f77b-9e5a-4ec5-9412-a1b0eb317aa0', '1dd205fc-a5d6-42a1-921c-59db723a5963', '4f02dae0-c169-4ac0-895a-a256b7525ef5', 'Build the Kanban drag-and-drop', 'Cards should move between columns optimistically.', 1000, NULL, 0, 1782239932, 1782239932, NULL);
INSERT OR IGNORE INTO "card" ("id", "column_id", "board_id", "title", "description", "position", "due_date", "completed", "created_at", "updated_at", "assignee_id") VALUES ('627eca34-1fc1-4976-bdc8-e0688ab5efbf', '1dd205fc-a5d6-42a1-921c-59db723a5963', '4f02dae0-c169-4ac0-895a-a256b7525ef5', 'Wire up Better Auth sessions', NULL, 2000, NULL, 0, 1782239932, 1782239932, NULL);
INSERT OR IGNORE INTO "card" ("id", "column_id", "board_id", "title", "description", "position", "due_date", "completed", "created_at", "updated_at", "assignee_id") VALUES ('d04e77c9-c9d5-4853-8f0d-bb89b9c3eb29', 'c012509d-75a5-421c-9f74-5f0862f5ac4c', '4f02dae0-c169-4ac0-895a-a256b7525ef5', 'Set up Cloudflare Workers + D1', NULL, 1000, NULL, 1, 1782239932, 1782239932, NULL);
INSERT OR IGNORE INTO "card" ("id", "column_id", "board_id", "title", "description", "position", "due_date", "completed", "created_at", "updated_at", "assignee_id") VALUES ('0fe8fcba-1d37-4da1-b32a-02604d36f273', 'c012509d-75a5-421c-9f74-5f0862f5ac4c', '4f02dae0-c169-4ac0-895a-a256b7525ef5', 'Scaffold the project', NULL, 2000, NULL, 1, 1782239933, 1782239933, NULL);
INSERT OR IGNORE INTO "card" ("id", "column_id", "board_id", "title", "description", "position", "due_date", "completed", "created_at", "updated_at", "assignee_id") VALUES ('e19192a8-0ec0-4a3d-a799-74431b23afd2', 'a1754026-6445-42a2-9915-1f5cde5ee145', '055c0470-8572-4672-bed2-91c014b61b04', 'Buy groceries', NULL, 1000, 1782239933, 0, 1782239933, 1782239933, NULL);
INSERT OR IGNORE INTO "card" ("id", "column_id", "board_id", "title", "description", "position", "due_date", "completed", "created_at", "updated_at", "assignee_id") VALUES ('4fc2969c-da4e-4045-8c8f-1e2838dc0a6d', 'a1754026-6445-42a2-9915-1f5cde5ee145', '055c0470-8572-4672-bed2-91c014b61b04', 'Read ''Designing Data-Intensive Applications''', NULL, 2000, NULL, 0, 1782239933, 1782239933, NULL);
INSERT OR IGNORE INTO "card" ("id", "column_id", "board_id", "title", "description", "position", "due_date", "completed", "created_at", "updated_at", "assignee_id") VALUES ('560bda35-de2a-4544-ae11-d0be5d89a5b6', 'cc0854ed-d311-43f6-8d7b-40c084278505', '055c0470-8572-4672-bed2-91c014b61b04', 'Plan weekend trip', NULL, 1000, 1782499133, 0, 1782239933, 1782239933, NULL);
INSERT OR IGNORE INTO "card" ("id", "column_id", "board_id", "title", "description", "position", "due_date", "completed", "created_at", "updated_at", "assignee_id") VALUES ('811c7e51-3b25-497e-af4f-5cbe1106dd87', '73c8057a-bb8f-4965-8606-4571ebbf1429', '055c0470-8572-4672-bed2-91c014b61b04', 'Renew gym membership', NULL, 1000, NULL, 1, 1782239933, 1782239933, NULL);

INSERT OR IGNORE INTO "label" ("id", "board_id", "name", "color") VALUES ('7b60e5c5-5c04-4f1d-bb53-d5fecbef20d8', '4f02dae0-c169-4ac0-895a-a256b7525ef5', 'Bug', '#ef4444');
INSERT OR IGNORE INTO "label" ("id", "board_id", "name", "color") VALUES ('56ccce68-7b5f-40b4-8e58-69db0c4f5b9e', '4f02dae0-c169-4ac0-895a-a256b7525ef5', 'Feature', '#22c55e');
INSERT OR IGNORE INTO "label" ("id", "board_id", "name", "color") VALUES ('b4e02e0c-b9b7-45cf-a432-c1fd5213aea6', '4f02dae0-c169-4ac0-895a-a256b7525ef5', 'Urgent', '#f97316');
INSERT OR IGNORE INTO "label" ("id", "board_id", "name", "color") VALUES ('11d65b78-1a3f-437e-9084-bb2dfa0b3bde', '4f02dae0-c169-4ac0-895a-a256b7525ef5', 'Design', '#a855f7');
INSERT OR IGNORE INTO "label" ("id", "board_id", "name", "color") VALUES ('1f51793a-3f50-49d6-99a5-2698a968aed1', '055c0470-8572-4672-bed2-91c014b61b04', 'Bug', '#ef4444');
INSERT OR IGNORE INTO "label" ("id", "board_id", "name", "color") VALUES ('831f212b-b26a-4eee-92dd-6e43dd360644', '055c0470-8572-4672-bed2-91c014b61b04', 'Feature', '#22c55e');
INSERT OR IGNORE INTO "label" ("id", "board_id", "name", "color") VALUES ('01bd7769-a25a-4405-a20c-02b33f6860b4', '055c0470-8572-4672-bed2-91c014b61b04', 'Urgent', '#f97316');
INSERT OR IGNORE INTO "label" ("id", "board_id", "name", "color") VALUES ('9486d0c2-7708-4e4f-af23-6e8f5f05d6af', '055c0470-8572-4672-bed2-91c014b61b04', 'Design', '#a855f7');

INSERT OR IGNORE INTO "card_label" ("card_id", "label_id") VALUES ('ee8431e0-2905-4ba4-90b4-aa0a9f65f46d', '56ccce68-7b5f-40b4-8e58-69db0c4f5b9e');
INSERT OR IGNORE INTO "card_label" ("card_id", "label_id") VALUES ('ee8431e0-2905-4ba4-90b4-aa0a9f65f46d', '11d65b78-1a3f-437e-9084-bb2dfa0b3bde');
INSERT OR IGNORE INTO "card_label" ("card_id", "label_id") VALUES ('6cefb32e-c727-4922-bab2-026e354f78b3', '7b60e5c5-5c04-4f1d-bb53-d5fecbef20d8');
INSERT OR IGNORE INTO "card_label" ("card_id", "label_id") VALUES ('6cefb32e-c727-4922-bab2-026e354f78b3', 'b4e02e0c-b9b7-45cf-a432-c1fd5213aea6');
INSERT OR IGNORE INTO "card_label" ("card_id", "label_id") VALUES ('faf1f77b-9e5a-4ec5-9412-a1b0eb317aa0', '56ccce68-7b5f-40b4-8e58-69db0c4f5b9e');
INSERT OR IGNORE INTO "card_label" ("card_id", "label_id") VALUES ('627eca34-1fc1-4976-bdc8-e0688ab5efbf', '56ccce68-7b5f-40b4-8e58-69db0c4f5b9e');
INSERT OR IGNORE INTO "card_label" ("card_id", "label_id") VALUES ('d04e77c9-c9d5-4853-8f0d-bb89b9c3eb29', '56ccce68-7b5f-40b4-8e58-69db0c4f5b9e');
INSERT OR IGNORE INTO "card_label" ("card_id", "label_id") VALUES ('4fc2969c-da4e-4045-8c8f-1e2838dc0a6d', '831f212b-b26a-4eee-92dd-6e43dd360644');

INSERT OR IGNORE INTO "comment" ("id", "card_id", "user_id", "body", "created_at") VALUES ('4e98c3f1-d789-41ed-b8e6-28821c85168d', 'ee8431e0-2905-4ba4-90b4-aa0a9f65f46d', 'LxAmh2eluag28qi4dy2UA9nbwXRuHOWl', 'Let''s keep it to three steps max.', 1782239932);
INSERT OR IGNORE INTO "comment" ("id", "card_id", "user_id", "body", "created_at") VALUES ('63c7a1a8-106e-48cf-ad91-4033b38e0a32', 'ee8431e0-2905-4ba4-90b4-aa0a9f65f46d', 'LxAmh2eluag28qi4dy2UA9nbwXRuHOWl', 'Agreed — mockups by Friday.', 1782239932);
INSERT OR IGNORE INTO "comment" ("id", "card_id", "user_id", "body", "created_at") VALUES ('77d0cbfe-ef5d-4fe5-b145-fe1ee8a889d7', 'faf1f77b-9e5a-4ec5-9412-a1b0eb317aa0', 'LxAmh2eluag28qi4dy2UA9nbwXRuHOWl', 'dnd-kit is working great so far.', 1782239932);
INSERT OR IGNORE INTO "comment" ("id", "card_id", "user_id", "body", "created_at") VALUES ('fc7d2ea0-4402-4c57-8d56-1fe749ef9745', 'd04e77c9-c9d5-4853-8f0d-bb89b9c3eb29', 'LxAmh2eluag28qi4dy2UA9nbwXRuHOWl', 'Deployed on the first try 🎉', 1782239933);

INSERT OR IGNORE INTO "checklist_item" ("id", "card_id", "text", "completed", "position", "created_at") VALUES ('736a5643-926d-424c-9ce2-39320996730d', 'ee8431e0-2905-4ba4-90b4-aa0a9f65f46d', 'Wireframes', 1, 1000, 1782239958);
INSERT OR IGNORE INTO "checklist_item" ("id", "card_id", "text", "completed", "position", "created_at") VALUES ('86b403b0-9d2a-450b-8e9a-1ab3becc4e48', 'ee8431e0-2905-4ba4-90b4-aa0a9f65f46d', 'Copy review', 0, 2000, 1782239958);
INSERT OR IGNORE INTO "checklist_item" ("id", "card_id", "text", "completed", "position", "created_at") VALUES ('f4c96448-633c-4785-a7a8-87c634a70839', 'ee8431e0-2905-4ba4-90b4-aa0a9f65f46d', 'Ship it', 0, 3000, 1782239958);

