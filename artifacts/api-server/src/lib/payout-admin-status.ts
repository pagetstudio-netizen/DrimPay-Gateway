import type { AggregatorCode } from "./aggregator-router";

export type PayoutSyncAction = "complete" | "refund" | "wait" | "unchanged";

export function payoutAggregatorFromSnapshot(snapshot: string | null | undefined): AggregatorCode | null {
  if (!snapshot) return null;

  try {
    const parsed = JSON.parse(snapshot);
    if (typeof parsed?.gateway !== "string") return null;

    const gateway = parsed.gateway.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (gateway === "clapay" || gateway === "paydunya" || gateway === "babimo" || gateway === "gomboplus") {
      return gateway as AggregatorCode;
    }
    return null;
  } catch {
    return null;
  }
}

export function decidePayoutSyncAction(
  transactionStatus: string,
  providerStatus: string,
): PayoutSyncAction {
  if (transactionStatus !== "pending" && transactionStatus !== "processing") return "unchanged";

  const status = providerStatus.toLowerCase();
  if (status === "success" || status === "completed" || status === "paid") return "complete";
  if (["failed", "error", "rejected", "declined", "cancelled", "canceled", "expired"].includes(status)) {
    return "refund";
  }
  return "wait";
}