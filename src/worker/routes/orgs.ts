import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import type { AppEnv } from "../lib/context";
import { requireAuth } from "../lib/middleware";
import { board, card, organization, orgMember, user } from "../db/schema";
import { activeOrg, orgRole, requireOrgManager } from "../lib/resources";
import { toMemberDTO, toOrgDTO } from "../lib/serializers";

async function memberCount(db: AppEnv["Variables"]["db"], orgId: string) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(orgMember)
    .where(eq(orgMember.organizationId, orgId));
  return n;
}

export const orgsRouter = new Hono<AppEnv>()
  .use(requireAuth)

  // List the user's organizations, marking the active one.
  .get("/", async (c) => {
    const db = c.get("db");
    const userId = c.get("user").id;
    const active = await activeOrg(db, userId);

    const rows = await db
      .select({ org: organization, role: orgMember.role })
      .from(orgMember)
      .innerJoin(organization, eq(organization.id, orgMember.organizationId))
      .where(eq(orgMember.userId, userId))
      .orderBy(asc(organization.createdAt));

    const orgs = await Promise.all(
      rows.map(async ({ org, role }) =>
        toOrgDTO(org, {
          role,
          memberCount: await memberCount(db, org.id),
          isActive: org.id === active.organizationId,
        }),
      ),
    );
    return c.json(orgs);
  })

  // Create a new organization and switch to it.
  .post("/", zValidator("json", z.object({ name: z.string().trim().min(1).max(80) })), async (c) => {
    const db = c.get("db");
    const userId = c.get("user").id;
    const orgId = crypto.randomUUID();
    const [org] = await db
      .insert(organization)
      .values({ id: orgId, name: c.req.valid("json").name, ownerId: userId })
      .returning();
    await db.insert(orgMember).values({ organizationId: orgId, userId, role: "owner" });
    await db.update(user).set({ activeOrganizationId: orgId }).where(eq(user.id, userId));
    return c.json(toOrgDTO(org, { role: "owner", memberCount: 1, isActive: true }), 201);
  })

  // Switch the active organization.
  .post(
    "/active",
    zValidator("json", z.object({ organizationId: z.string() })),
    async (c) => {
      const db = c.get("db");
      const userId = c.get("user").id;
      const orgId = c.req.valid("json").organizationId;
      const role = await orgRole(db, orgId, userId);
      if (!role) return c.json({ error: "Not a member of that organization" }, 403);
      await db.update(user).set({ activeOrganizationId: orgId }).where(eq(user.id, userId));
      return c.body(null, 204);
    },
  )

  // List members of an organization (members only).
  .get("/:orgId/members", async (c) => {
    const db = c.get("db");
    const orgId = c.req.param("orgId");
    if (!(await orgRole(db, orgId, c.get("user").id))) {
      return c.json({ error: "Organization not found" }, 404);
    }
    const members = await db.query.orgMember.findMany({
      where: eq(orgMember.organizationId, orgId),
      with: { user: true },
      orderBy: (m, { asc: a }) => [a(m.createdAt)],
    });
    return c.json(members.map((m) => toMemberDTO({ role: m.role, user: m.user })));
  })

  // Invite an existing user by email (owner/admin).
  .post(
    "/:orgId/members",
    zValidator("json", z.object({ email: z.string().trim().toLowerCase().email() })),
    async (c) => {
      const db = c.get("db");
      const orgId = c.req.param("orgId");
      const role = await orgRole(db, orgId, c.get("user").id);
      if (!role) return c.json({ error: "Organization not found" }, 404);
      requireOrgManager(role);

      const invitee = await db.query.user.findFirst({
        where: eq(user.email, c.req.valid("json").email),
      });
      if (!invitee) {
        return c.json({ error: "No user with that email. They must sign up first." }, 404);
      }
      const existing = await db.query.orgMember.findFirst({
        where: and(eq(orgMember.organizationId, orgId), eq(orgMember.userId, invitee.id)),
      });
      if (existing) return c.json({ error: "Already a member" }, 409);

      await db
        .insert(orgMember)
        .values({ organizationId: orgId, userId: invitee.id, role: "member" });
      return c.json(toMemberDTO({ role: "member", user: invitee }), 201);
    },
  )

  // Remove a member (owner/admin; the org owner cannot be removed).
  .delete("/:orgId/members/:userId", async (c) => {
    const db = c.get("db");
    const orgId = c.req.param("orgId");
    const role = await orgRole(db, orgId, c.get("user").id);
    if (!role) return c.json({ error: "Organization not found" }, 404);
    requireOrgManager(role);

    const org = await db.query.organization.findFirst({ where: eq(organization.id, orgId) });
    if (!org) return c.json({ error: "Organization not found" }, 404);
    const target = c.req.param("userId");
    if (target === org.ownerId) return c.json({ error: "The owner cannot be removed" }, 400);

    // Unassign the removed user from this org's cards.
    const boards = await db
      .select({ id: board.id })
      .from(board)
      .where(eq(board.organizationId, orgId));
    if (boards.length > 0) {
      await db
        .update(card)
        .set({ assigneeId: null })
        .where(and(inArray(card.boardId, boards.map((b) => b.id)), eq(card.assigneeId, target)));
    }

    await db
      .delete(orgMember)
      .where(and(eq(orgMember.organizationId, orgId), eq(orgMember.userId, target)));
    // If the removed user was viewing this org, clear it (they fall back next request).
    await db
      .update(user)
      .set({ activeOrganizationId: null })
      .where(and(eq(user.id, target), eq(user.activeOrganizationId, orgId)));

    return c.body(null, 204);
  });
