import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { createAuth } from "./auth";
import { withDb, withSession, requireAuth } from "./lib/middleware";
import type { AppEnv } from "./lib/context";
import { boardsRouter } from "./routes/boards";
import { columnsRouter } from "./routes/columns";
import { cardsRouter } from "./routes/cards";
import { labelsRouter } from "./routes/labels";
import { commentsRouter } from "./routes/comments";

const app = new Hono<AppEnv>();

app.use("*", logger());
app.use("*", withDb);

// Better Auth owns every /api/auth/** route (sign-up, sign-in, sign-out, ...).
app.on(["GET", "POST"], "/api/auth/*", (c) => createAuth(c.env).handler(c.req.raw));

// Resolve the session for the rest of the API.
app.use("/api/*", withSession);

const routes = app
  .get("/api/me", requireAuth, (c) => {
    const u = c.get("user");
    return c.json({ id: u.id, name: u.name, email: u.email, image: u.image ?? null });
  })
  .route("/api/boards", boardsRouter)
  .route("/api/columns", columnsRouter)
  .route("/api/cards", cardsRouter)
  .route("/api/labels", labelsRouter)
  .route("/api/comments", commentsRouter);

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

// Exported for optional end-to-end typing on the client.
export type AppType = typeof routes;
export default app;
