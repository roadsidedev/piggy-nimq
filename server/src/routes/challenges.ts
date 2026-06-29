import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { challenges, challengeMembers, users } from "../db/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";

const app = new Hono<AppEnv>();
app.use("*", authMiddleware);

const createChallengeSchema = z.object({
  title: z.string().min(1).max(100),
  target: z.string().regex(/^\d+(\.\d{1,6})?$/, "Invalid amount"),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  duration: z.number().int().min(1).max(365),
});

const updateProgressSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/, "Invalid amount"),
});

// GET /challenges
app.get("/", async (c) => {
  const userAddress = c.get("userAddress");
  const tab = c.req.query("tab") ?? "my";

  let results;

  if (tab === "browse") {
    results = await db
      .select({
        id: challenges.id,
        ownerAddress: challenges.ownerAddress,
        title: challenges.title,
        target: challenges.target,
        frequency: challenges.frequency,
        duration: challenges.duration,
        streak: challenges.streak,
        inviteCode: challenges.inviteCode,
        createdAt: challenges.createdAt,
      })
      .from(challenges)
      .orderBy(desc(challenges.createdAt));
  } else {
    results = await db
      .selectDistinctOn([challenges.id], {
        id: challenges.id,
        ownerAddress: challenges.ownerAddress,
        title: challenges.title,
        target: challenges.target,
        frequency: challenges.frequency,
        duration: challenges.duration,
        streak: challenges.streak,
        inviteCode: challenges.inviteCode,
        createdAt: challenges.createdAt,
      })
      .from(challenges)
      .leftJoin(
        challengeMembers,
        eq(challenges.id, challengeMembers.challengeId),
      )
      .where(
        and(
          eq(challenges.ownerAddress, userAddress),
          eq(challengeMembers.userAddress, userAddress),
        ),
      )
      .orderBy(desc(challenges.createdAt));
  }

  const challengeIds = [...new Set(results.map((r) => r.id))];
  const memberData = await Promise.all(
    challengeIds.map(async (id) => {
      const members = await db
        .select()
        .from(challengeMembers)
        .where(eq(challengeMembers.challengeId, id));
      return {
        id,
        memberCount: members.length,
        isMember: members.some((m) => m.userAddress === userAddress),
      };
    }),
  );

  const memberMap = new Map(memberData.map((m) => [m.id, m]));

  return c.json({
    success: true,
    data: results.map((r) => ({
      id: r.id,
      ownerAddress: r.ownerAddress,
      title: r.title,
      target: r.target,
      frequency: r.frequency,
      duration: r.duration,
      streak: r.streak,
      inviteCode: r.inviteCode,
      createdAt: r.createdAt.toISOString(),
      memberCount: memberMap.get(r.id)?.memberCount ?? 0,
      isMember: memberMap.get(r.id)?.isMember ?? false,
    })),
  });
});

// POST /challenges
app.post("/", async (c) => {
  const userAddress = c.get("userAddress");
  const body = await c.req.json();
  const parsed = createChallengeSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: parsed.error.issues[0].message },
      400,
    );
  }

  const { title, target, frequency, duration } = parsed.data;
  const id = nanoid(21);
  const inviteCode = nanoid(8);

  const [challenge] = await db
    .insert(challenges)
    .values({
      id,
      ownerAddress: userAddress,
      title,
      target,
      frequency,
      duration,
      streak: 0,
      inviteCode,
    })
    .returning();

  await db.insert(challengeMembers).values({
    challengeId: id,
    userAddress,
    savedAmount: "0",
  });

  return c.json(
    {
      success: true,
      data: {
        ...challenge,
        createdAt: challenge.createdAt.toISOString(),
        memberCount: 1,
        isMember: true,
      },
    },
    201,
  );
});

// GET /challenges/:id
app.get("/:id", async (c) => {
  const challengeId = c.req.param("id");
  const userAddress = c.get("userAddress");

  const [challenge] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .limit(1);

  if (!challenge) {
    return c.json({ success: false, error: "Challenge not found" }, 404);
  }

  const members = await db
    .select({
      userAddress: challengeMembers.userAddress,
      savedAmount: challengeMembers.savedAmount,
      joinedAt: challengeMembers.joinedAt,
      displayName: users.displayName,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(challengeMembers)
    .leftJoin(users, eq(challengeMembers.userAddress, users.address))
    .where(eq(challengeMembers.challengeId, challengeId));

  return c.json({
    success: true,
    data: {
      ...challenge,
      createdAt: challenge.createdAt.toISOString(),
      members: members.map((m) => ({
        ...m,
        joinedAt: m.joinedAt.toISOString(),
      })),
      isMember: members.some((m) => m.userAddress === userAddress),
    },
  });
});

// POST /challenges/:code/join
app.post("/:code/join", async (c) => {
  const inviteCode = c.req.param("code");
  const userAddress = c.get("userAddress");

  const [challenge] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.inviteCode, inviteCode))
    .limit(1);

  if (!challenge) {
    return c.json({ success: false, error: "Invalid invite code" }, 404);
  }

  const [existing] = await db
    .select()
    .from(challengeMembers)
    .where(
      and(
        eq(challengeMembers.challengeId, challenge.id),
        eq(challengeMembers.userAddress, userAddress),
      ),
    )
    .limit(1);

  if (existing) {
    return c.json(
      { success: false, error: "Already a member" },
      400,
    );
  }

  await db.insert(challengeMembers).values({
    challengeId: challenge.id,
    userAddress,
    savedAmount: "0",
  });

  return c.json({
    success: true,
    data: { challengeId: challenge.id, title: challenge.title },
  });
});

// POST /challenges/:id/progress
app.post("/:id/progress", async (c) => {
  const challengeId = c.req.param("id");
  const userAddress = c.get("userAddress");
  const body = await c.req.json();
  const parsed = updateProgressSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: parsed.error.issues[0].message },
      400,
    );
  }

  const [member] = await db
    .select()
    .from(challengeMembers)
    .where(
      and(
        eq(challengeMembers.challengeId, challengeId),
        eq(challengeMembers.userAddress, userAddress),
      ),
    )
    .limit(1);

  if (!member) {
    return c.json(
      { success: false, error: "Not a member" },
      403,
    );
  }

  const current = Math.round(Number(member.savedAmount) * 1e6);
  const add = Math.round(Number(parsed.data.amount) * 1e6);
  const newAmount = ((current + add) / 1e6).toFixed(6);

  await db
    .update(challengeMembers)
    .set({ savedAmount: newAmount })
    .where(
      and(
        eq(challengeMembers.challengeId, challengeId),
        eq(challengeMembers.userAddress, userAddress),
      ),
    );

  await db
    .update(challenges)
    .set({ streak: sql`${challenges.streak} + 1` })
    .where(eq(challenges.id, challengeId));

  return c.json({ success: true });
});

export const challengeRoutes = app;
