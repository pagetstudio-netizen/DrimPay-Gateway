import { db } from "@workspace/db";
import { adminSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

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
