import {
  babimoPaymentMethod,
  buildBabimoClientReference,
  normalizeBabimoPhone,
} from "./babimo";

export type GatewayOperation = "payin" | "payout";

export interface GatewayPayloadSnapshotParams {
  gateway: string;
  operation: GatewayOperation;
  amount: number;
  currency: string;
  country_code: string;
  operator: string;
  phone: string;
  reference: string;
  callback_url: string;
  return_url?: string;
  order_id?: string;
  description?: string;
  operator_otp?: string;
}

/**
 * Builds the non-secret request snapshot shown to administrators.
 *
 * This is intentionally separate from authentication payloads: no email,
 * password, access token, private key, or authorization header is persisted.
 */
export function buildGatewayPayloadSnapshot(
  params: GatewayPayloadSnapshotParams,
): Record<string, unknown> {
  if (params.gateway === "babimo") {
    const paymentMethod = babimoPaymentMethod(
      params.operator,
      params.country_code,
      params.operation,
    );

    if (params.operation === "payout") {
      return {
        gateway: params.gateway,
        method: "POST",
        endpoint: "/collect/cashin",
        payment_method: paymentMethod,
        merchant_transaction_id: params.reference,
        amount: params.amount,
        telephone: normalizeBabimoPhone(params.phone, params.country_code),
        notify_url: params.callback_url,
        refercence_cl: buildBabimoClientReference(params.reference, params.country_code),
      };
    }

    return {
      gateway: params.gateway,
      method: "POST",
      endpoint: "/paiement",
      currency: params.currency || "XOF",
      payment_method: paymentMethod,
      merchant_transaction_id: params.reference,
      amount: params.amount,
      telephone: normalizeBabimoPhone(params.phone, params.country_code),
      success_url: params.return_url ?? params.callback_url,
      failed_url: params.return_url ?? params.callback_url,
      notify_url: params.callback_url,
      refercence_cl: buildBabimoClientReference(params.reference, params.country_code),
      ...(paymentMethod === "OM_CI" && params.operator_otp
        ? { otp_code: params.operator_otp }
        : {}),
    };
  }

  return {
    gateway: params.gateway,
    method: "POST",
    operation: params.operation,
    amount: params.amount,
    currency: params.currency,
    country_code: params.country_code,
    operator: params.operator,
    phone: params.phone,
    merchant_transaction_id: params.reference,
    ...(params.order_id ? { order_id: params.order_id } : {}),
    callback_url: params.callback_url,
    ...(params.return_url ? { return_url: params.return_url } : {}),
    ...(params.description ? { description: params.description } : {}),
  };
}