import crypto from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { apiKeysTable } from "@workspace/db/schema";

function createWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString("hex")}`;
}

export async function ensureWebhookSecretForApiKey(apiKeyId: number): Promise<string | null> {
  const [key] = await db
    .select({ id: apiKeysTable.id, webhookSecret: apiKeysTable.webhookSecret })
    .from(apiKeysTable)
    .where(eq(apiKeysTable.id, apiKeyId));

  if (!key) return null;
  if (key.webhookSecret) return key.webhookSecret;

  const webhookSecret = createWebhookSecret();
  await db
    .update(apiKeysTable)
    .set({ webhookSecret })
    .where(eq(apiKeysTable.id, apiKeyId));
  return webhookSecret;
}

export async function ensureLatestMerchantWebhookSecret(
  userId: number,
  env: "sandbox" | "live",
): Promise<string | null> {
  const [key] = await db
    .select({ id: apiKeysTable.id })
    .from(apiKeysTable)
    .where(and(
      eq(apiKeysTable.userId, userId),
      eq(apiKeysTable.env, env),
      eq(apiKeysTable.status, "active"),
    ))
    .orderBy(desc(apiKeysTable.createdAt))
    .limit(1);

  return key ? ensureWebhookSecretForApiKey(key.id) : null;
}