import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";

const app = new Hono<AppEnv>();
app.use("*", authMiddleware);

const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional(),
  avatarUrl: z.string().url("Invalid image URL").or(z.literal("")).optional(),
});

// PATCH /profile — update username and/or avatarUrl
app.patch("/", async (c) => {
  const userAddress = c.get("userAddress");
  const body = await c.req.json();
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: parsed.error.issues[0].message },
      400,
    );
  }

  const { username, avatarUrl } = parsed.data;
  const updates: Record<string, unknown> = {};

  if (username !== undefined) {
    // Check uniqueness
    const [existing] = await db
      .select({ address: users.address })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existing && existing.address !== userAddress) {
      return c.json(
        { success: false, error: "Username is already taken" },
        409,
      );
    }

    updates.username = username;
  }

  if (avatarUrl !== undefined) {
    updates.avatarUrl = avatarUrl === "" ? null : avatarUrl;
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ success: false, error: "No fields to update" }, 400);
  }

  await db
    .update(users)
    .set(updates)
    .where(eq(users.address, userAddress));

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.address, userAddress))
    .limit(1);

  return c.json({
    success: true,
    data: {
      address: user?.address ?? userAddress,
      username: user?.username ?? null,
      avatarUrl: user?.avatarUrl ?? null,
    },
  });
});

// GET /profile/check-username/:username — check availability
app.get("/check-username/:username", async (c) => {
  const username = c.req.param("username");

  if (username.length < 3 || username.length > 20) {
    return c.json({ success: true, data: { available: false } });
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return c.json({ success: true, data: { available: false } });
  }

  const [existing] = await db
    .select({ address: users.address })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return c.json({
    success: true,
    data: { available: !existing },
  });
});

// GET /profile/:address — get public profile for any user
app.get("/:address", async (c) => {
  const address = c.req.param("address").toLowerCase();

  const [user] = await db
    .select({
      address: users.address,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.address, address))
    .limit(1);

  if (!user) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  return c.json({ success: true, data: user });
});

// POST /profile/avatar — upload avatar via multipart form data
app.post("/avatar", async (c) => {
  const userAddress = c.get("userAddress");

  const body = await c.req.parseBody();
  const file = body["avatar"];

  if (!file || !(file instanceof File)) {
    return c.json(
      { success: false, error: "No image file provided" },
      400,
    );
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return c.json(
      {
        success: false,
        error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP",
      },
      400,
    );
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return c.json(
      { success: false, error: "File too large. Maximum size: 5MB" },
      400,
    );
  }

  try {
    // Upload to Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "piggy_pfp");
    formData.append("folder", "piggy/avatars");

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      return c.json(
        { success: false, error: "Image upload not configured" },
        500,
      );
    }

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData },
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error("[Cloudinary]", err);
      return c.json(
        { success: false, error: "Image upload failed" },
        500,
      );
    }

    const uploadData = (await uploadRes.json()) as { secure_url: string };
    const avatarUrl = uploadData.secure_url;

    await db
      .update(users)
      .set({ avatarUrl })
      .where(eq(users.address, userAddress));

    return c.json({
      success: true,
      data: { avatarUrl },
    });
  } catch (err) {
    console.error("[Avatar Upload]", err);
    return c.json(
      { success: false, error: "Image upload failed" },
      500,
    );
  }
});

export const profileRoutes = app;
