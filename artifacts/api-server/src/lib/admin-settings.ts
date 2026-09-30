import { db } from "@workspace/db";
import { adminSettingsTable } from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";

export const PAYMENT_UNAVAILABLE_MESSAGE =
  "Les paiements ne sont pas disponibles pour le moment sur Drimpay. Nous avons désactivé le pay-in pour le moment pour tous. Veuillez contacter le support.";

export type PaymentOperation = "payin" | "payout";

function merchantPaymentSettingKey(userId: number, operation: PaymentOperation): string {
  return `merchant:${userId}:${operation}_enabled`;
}

export function arePaymentControlsEnabled(
  userId: number,
  operation: PaymentOperation,
  settings: readonly { key: string; value: string | null }[],
): boolean {
  const keys = [merchantPaymentSettingKey(userId, operation)];
  if (operation === "payin") keys.push("payins_enabled");
  const values = new Map(settings.map((setting) => [setting.key, setting.value]));

  // Missing settings preserve enabled-by-default behavior. Explicit false or
  // any unrecognized stored value fails closed.
  return keys.every((key) => !values.has(key) || values.get(key) === "true");
}

export async function isPaymentOperationEnabled(
  userId: number,
  operation: PaymentOperation,
): Promise<boolean> {
  const keys = [merchantPaymentSettingKey(userId, operation)];
  if (operation === "payin") keys.push("payins_enabled");

  try {
    const settings = await db
      .select({ key: adminSettingsTable.key, value: adminSettingsTable.value })
      .from(adminSettingsTable)
      .where(inArray(adminSettingsTable.key, keys));

    return arePaymentControlsEnabled(userId, operation, settings);
  } catch {
    // Do not initiate payments if availability cannot be verified.
    return false;
  }
}

export async function getMerchantPaymentControls(userId: number): Promise<{
  payinEnabled: boolean;
  payoutEnabled: boolean;
}> {
  const keys = [
    merchantPaymentSettingKey(userId, "payin"),
    merchantPaymentSettingKey(userId, "payout"),
  ];
  const settings = await db
    .select({ key: adminSettingsTable.key, value: adminSettingsTable.value })
    .from(adminSettingsTable)
    .where(inArray(adminSettingsTable.key, keys));
  const values = new Map(settings.map((setting) => [setting.key, setting.value]));
  const isEnabled = (key: string) => {
    const value = values.get(key);
    return value === undefined || value === "true";
  };

  return {
    payinEnabled: isEnabled(keys[0]),
    payoutEnabled: isEnabled(keys[1]),
  };
}

export async function setMerchantPaymentControls(
  userId: number,
  controls: { payinEnabled: boolean; payoutEnabled: boolean },
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const [operation, enabled] of [
      ["payin", controls.payinEnabled],
      ["payout", controls.payoutEnabled],
    ] as const) {
      await tx
        .insert(adminSettingsTable)
        .values({
          key: merchantPaymentSettingKey(userId, operation),
          value: String(enabled),
        })
        .onConflictDoUpdate({
          target: adminSettingsTable.key,
          set: { value: String(enabled), updatedAt: new Date() },
        });
    }
  });
}

/**
 * Read a boolean-ish admin setting (stored as the string "true"/"false" in
 * `admin_settings`). Fails OPEN (returns `defaultValue`) on a missing row or
 * a DB error, so a transient DB hiccup never accidentally locks out real
 * users — the setting only takes effect once explicitly stored.
 */
export async function isAdminSettingEnabled(key: string, defaultValue: boolean): Promise<boolean> {
  try {
    const [row] = await db
      .select({ value: adminSettingsTable.value })
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, key))
      .limit(1);
    if (!row) return defaultValue;
    return row.value === "true";
  } catch {
    return defaultValue;
  }
}

/** True when the platform-wide maintenance mode toggle is ON (blocks all transactions). */
export async function isMaintenanceModeOn(): Promise<boolean> {
  return isAdminSettingEnabled("maintenance_mode", false);
}

/** True when new merchant signups are allowed (admin toggle "Inscriptions ouvertes"). */
export async function isSignupEnabled(): Promise<boolean> {
  return isAdminSettingEnabled("new_signup_enabled", true);
}
