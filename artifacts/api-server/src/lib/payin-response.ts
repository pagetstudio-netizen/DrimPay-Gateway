import type { AggregatorCode, StatusCheckResult } from "./aggregator-router";
import type { SettlePayinParams } from "./payin-settlement";

export interface PayinPollingDependencies {
  pollUntilSettled: (
    aggregator: AggregatorCode,
    client: unknown,
    gatewayReference: string,
    options: {
      intervalMs: number;
      maxDurationMs: number;
    },
  ) => Promise<StatusCheckResult | null>;
  settlePayinStatus: (params: SettlePayinParams) => Promise<unknown>;
}

export interface StartPayinPollingParams {
  aggregator: AggregatorCode;
  client: unknown;
  externalRef: string;
  transactionId: number;
  reference: string;
}

/**
 * Starts status verification without making the initiation request wait for
 * the customer approval. Webhooks and this poller share the same idempotent
 * settlement function, so either confirmation path can safely finish first.
 */
export function startPayinStatusPolling(
  params: StartPayinPollingParams,
  dependencies: PayinPollingDependencies,
): void {
  void (async () => {
    try {
      const statusCheck = await dependencies.pollUntilSettled(
        params.aggregator,
        params.client,
        params.externalRef,
        {
          intervalMs: 4_000,
          maxDurationMs: 20_000,
        },
      );

      await dependencies.settlePayinStatus({
        txId: params.transactionId,
        status: (statusCheck?.status ?? "processing") as SettlePayinParams["status"],
        gatewayReference: params.externalRef,
        failureReason: statusCheck?.failureReason,
        gateway: params.aggregator,
      });
    } catch (pollError: any) {
      // The webhook remains the source of truth if a status poll fails.
      // Keep the transaction pending instead of reporting a false failure.
      console.warn(
        `[API Payin] Background status poll failed for ${params.reference}: ` +
        `${pollError?.message ?? pollError}`,
      );
    }
  })();
}

export interface PayinResponse {
  status: (statusCode: number) => {
    json: (body: Record<string, unknown>) => void;
  };
}

/**
 * Sends the initiation response. This deliberately only reports the provider
 * acceptance state; final settlement is handled by the background poller or
 * webhook.
 */
export function sendPayinProcessingResponse(
  res: PayinResponse,
  body: Record<string, unknown>,
): void {
  res.status(201).json({
    ...body,
    status: "processing",
    verified_status: "processing",
  });
}