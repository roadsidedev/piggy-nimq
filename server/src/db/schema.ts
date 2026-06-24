import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ─── Users ───────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    address: text("address").primaryKey(),
    nimiqAddress: text("nimiq_address"),
    displayName: text("display_name"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  },
  (t) => [index("users_nimiq_idx").on(t.nimiqAddress)],
);

// ─── Sessions ────────────────────────────────────────────────

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userAddress: text("user_address")
      .notNull()
      .references(() => users.address, { onDelete: "cascade" }),
    nonce: text("nonce").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("sessions_user_idx").on(t.userAddress),
    index("sessions_expires_idx").on(t.expiresAt),
  ],
);

// ─── Goals ───────────────────────────────────────────────────

export const goals = pgTable(
  "goals",
  {
    id: text("id").primaryKey(),
    userAddress: text("user_address")
      .notNull()
      .references(() => users.address, { onDelete: "cascade" }),
    title: text("title").notNull(),
    targetAmount: text("target_amount").notNull(),
    currentAmount: text("current_amount").notNull().default("0"),
    targetDate: timestamp("target_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("goals_user_idx").on(t.userAddress)],
);

// ─── Challenges ──────────────────────────────────────────────

export const challenges = pgTable(
  "challenges",
  {
    id: text("id").primaryKey(),
    ownerAddress: text("owner_address")
      .notNull()
      .references(() => users.address, { onDelete: "cascade" }),
    title: text("title").notNull(),
    target: text("target").notNull(),
    frequency: text("frequency").notNull(),
    duration: integer("duration").notNull(),
    streak: integer("streak").notNull().default(0),
    inviteCode: text("invite_code").unique().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("challenges_owner_idx").on(t.ownerAddress),
    index("challenges_invite_idx").on(t.inviteCode),
  ],
);

// ─── Challenge Members ───────────────────────────────────────

export const challengeMembers = pgTable(
  "challenge_members",
  {
    challengeId: text("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    userAddress: text("user_address")
      .notNull()
      .references(() => users.address, { onDelete: "cascade" }),
    savedAmount: text("saved_amount").notNull().default("0"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("challenge_members_pk").on(t.challengeId, t.userAddress),
  ],
);

// ─── Recurring Schedules ─────────────────────────────────────

export const recurringSchedules = pgTable(
  "recurring_schedules",
  {
    id: text("id").primaryKey(),
    userAddress: text("user_address")
      .notNull()
      .references(() => users.address, { onDelete: "cascade" }),
    amount: text("amount").notNull(),
    frequency: text("frequency").notNull(),
    dayOfWeek: integer("day_of_week"),
    dayOfMonth: integer("day_of_month"),
    goalId: text("goal_id").references(() => goals.id, {
      onDelete: "set null",
    }),
    paused: boolean("paused").notNull().default(false),
    lastRunAt: timestamp("last_run_at"),
    nextRunAt: timestamp("next_run_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("recurring_user_idx").on(t.userAddress),
    index("recurring_next_run_idx").on(t.nextRunAt),
  ],
);

// ─── Transactions ────────────────────────────────────────────

export const transactions = pgTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    userAddress: text("user_address")
      .notNull()
      .references(() => users.address, { onDelete: "cascade" }),
    type: text("type").notNull(),
    amount: text("amount").notNull(),
    txHash: text("tx_hash"),
    status: text("status").notNull().default("pending"),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("transactions_user_idx").on(t.userAddress),
    index("transactions_status_idx").on(t.status),
  ],
);

// ─── Analytics Events ────────────────────────────────────────

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    event: text("event").notNull(),
    data: jsonb("data"),
    userAddress: text("user_address"),
    url: text("url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("analytics_event_idx").on(t.event),
    index("analytics_created_idx").on(t.createdAt),
  ],
);

// ─── Error Logs ──────────────────────────────────────────────

export const errorLogs = pgTable(
  "error_logs",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    errorName: text("error_name"),
    errorMessage: text("error_message"),
    stack: text("stack"),
    context: jsonb("context"),
    userAddress: text("user_address"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("errors_created_idx").on(t.createdAt)],
);
