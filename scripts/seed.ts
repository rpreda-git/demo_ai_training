/**
 * Seeds a running instance (local dev or deployed) with a demo account and
 * realistic Kanban data by driving the real HTTP API. This guarantees correct
 * Better Auth password hashing and exercises every endpoint.
 *
 *   npm run db:seed:local         # targets http://127.0.0.1:5173 (vite dev)
 *   SEED_BASE_URL=https://my-app.workers.dev npm run db:seed:remote
 *
 * The dev server (or deployment) must be running first.
 */

const BASE_URL = process.env.SEED_BASE_URL ?? "http://127.0.0.1:5173";

const DEMO = {
  name: "Ada Lovelace",
  email: "demo@kanban.dev",
  password: "demo1234",
};

let cookie = "";

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      // Better Auth enforces a CSRF Origin check on state-changing requests.
      Origin: BASE_URL,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const setCookies = res.headers.getSetCookie?.() ?? [];
  if (setCookies.length > 0) {
    cookie = setCookies.map((c) => c.split(";")[0]).join("; ");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

interface Column {
  id: string;
  title: string;
}
interface Label {
  id: string;
  name: string;
}
interface Board {
  id: string;
  columns: Column[];
  labels: Label[];
}
interface Card {
  id: string;
}

async function ensureSession() {
  // Sign up; if the account already exists, sign in instead.
  try {
    await req("POST", "/api/auth/sign-up/email", DEMO);
    console.log(`✓ Created demo user ${DEMO.email}`);
  } catch {
    cookie = "";
    await req("POST", "/api/auth/sign-in/email", {
      email: DEMO.email,
      password: DEMO.password,
    });
    console.log(`✓ Signed in as existing demo user ${DEMO.email}`);
  }
}

const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

async function seedBoard(spec: {
  title: string;
  description: string;
  color: string;
  cards: {
    column: string; // matches a default column title
    title: string;
    description?: string;
    labels?: string[]; // matches default label names
    dueInDays?: number;
    completed?: boolean;
    comments?: string[];
  }[];
}) {
  const summary = await req<{ id: string }>("POST", "/api/boards", {
    title: spec.title,
    description: spec.description,
    color: spec.color,
  });
  const board = await req<Board>("GET", `/api/boards/${summary.id}`);
  const columnByTitle = new Map(board.columns.map((c) => [c.title, c.id]));
  const labelByName = new Map(board.labels.map((l) => [l.name, l.id]));

  for (const card of spec.cards) {
    const columnId = columnByTitle.get(card.column) ?? board.columns[0].id;
    const created = await req<Card>("POST", `/api/columns/${columnId}/cards`, {
      title: card.title,
    });

    if (card.description || card.dueInDays !== undefined || card.completed) {
      await req("PATCH", `/api/cards/${created.id}`, {
        description: card.description,
        dueDate: card.dueInDays !== undefined ? daysFromNow(card.dueInDays) : undefined,
        completed: card.completed,
      });
    }
    for (const labelName of card.labels ?? []) {
      const labelId = labelByName.get(labelName);
      if (labelId) await req("POST", `/api/cards/${created.id}/labels`, { labelId });
    }
    for (const body of card.comments ?? []) {
      await req("POST", `/api/cards/${created.id}/comments`, { body });
    }
  }
  console.log(`✓ Seeded board “${spec.title}” (${spec.cards.length} cards)`);
}

async function main() {
  console.log(`Seeding ${BASE_URL} …`);
  await ensureSession();

  const existing = await req<unknown[]>("GET", "/api/boards");
  if (existing.length > 0) {
    console.log(`• Demo account already has ${existing.length} board(s); skipping seed.`);
    return;
  }

  await seedBoard({
    title: "Product Roadmap",
    description: "Q3 planning for the web platform.",
    color: "#6366f1",
    cards: [
      {
        column: "To Do",
        title: "Design the new onboarding flow",
        description: "Reduce drop-off on the first run experience.",
        labels: ["Feature", "Design"],
        dueInDays: 5,
        comments: ["Let's keep it to three steps max.", "Agreed — mockups by Friday."],
      },
      {
        column: "To Do",
        title: "Investigate slow dashboard query",
        labels: ["Bug", "Urgent"],
        dueInDays: 1,
      },
      {
        column: "In Progress",
        title: "Build the Kanban drag-and-drop",
        description: "Cards should move between columns optimistically.",
        labels: ["Feature"],
        comments: ["dnd-kit is working great so far."],
      },
      {
        column: "In Progress",
        title: "Wire up Better Auth sessions",
        labels: ["Feature"],
      },
      {
        column: "Done",
        title: "Set up Cloudflare Workers + D1",
        labels: ["Feature"],
        completed: true,
        comments: ["Deployed on the first try 🎉"],
      },
      {
        column: "Done",
        title: "Scaffold the project",
        completed: true,
      },
    ],
  });

  await seedBoard({
    title: "Personal Tasks",
    description: "Day-to-day todos.",
    color: "#10b981",
    cards: [
      { column: "To Do", title: "Buy groceries", dueInDays: 0 },
      { column: "To Do", title: "Read 'Designing Data-Intensive Applications'", labels: ["Feature"] },
      { column: "In Progress", title: "Plan weekend trip", dueInDays: 3 },
      { column: "Done", title: "Renew gym membership", completed: true },
    ],
  });

  console.log("\nDone! Sign in with:");
  console.log(`  email:    ${DEMO.email}`);
  console.log(`  password: ${DEMO.password}`);
}

main().catch((err) => {
  console.error("\nSeed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
