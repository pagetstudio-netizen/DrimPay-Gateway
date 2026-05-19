/**
 * ─── PayDunya SoftPay Operator Map ────────────────────────────────────────────
 *
 * Each operator has:
 *  - slug        : exact URL segment for POST /softpay/{slug}
 *  - country     : ISO-3166 country code
 *  - buildPayload: function that builds the operator-specific request body
 *
 * The `payment_token` field (from /checkout-invoice/create response.token)
 * is injected by the caller — every operator requires it.
 *
 * Reference: https://developers.paydunya.com/doc/FR/softpay
 */

export interface SoftPayParams {
  paymentToken: string;
  phone: string;
  fullName: string;
  email: string;
  address?: string;
}

export interface SoftPayOperatorConfig {
  slug: string;
  country: string;
  label: string;
  buildPayload: (p: SoftPayParams) => Record<string, string>;
}

// ─── Operator registry ────────────────────────────────────────────────────────
// Key format: "{operator_normalized}|{COUNTRY_CODE}"
export const SOFTPAY_OPERATOR_MAP: Record<string, SoftPayOperatorConfig> = {

  // ── Togo ──────────────────────────────────────────────────────────────────
  "tmoney|TG": {
    slug:    "t-money-togo",
    country: "TG",
    label:   "T-Money (Togo)",
    buildPayload: (p) => ({
      name_t_money:    p.fullName,
      email_t_money:   p.email,
      phone_t_money:   p.phone,
      payment_token:   p.paymentToken,
    }),
  },
  "t-money|TG": {
    slug:    "t-money-togo",
    country: "TG",
    label:   "T-Money (Togo)",
    buildPayload: (p) => ({
      name_t_money:    p.fullName,
      email_t_money:   p.email,
      phone_t_money:   p.phone,
      payment_token:   p.paymentToken,
    }),
  },
  "moov money|TG": {
    slug:    "moov-togo",
    country: "TG",
    label:   "Moov Money (Togo)",
    buildPayload: (p) => ({
      moov_togo_customer_fullname: p.fullName,
      moov_togo_email:             p.email,
      moov_togo_customer_address:  p.address ?? "Lomé",
      moov_togo_phone_number:      p.phone,
      payment_token:               p.paymentToken,
    }),
  },
  "moov|TG": {
    slug:    "moov-togo",
    country: "TG",
    label:   "Moov Money (Togo)",
    buildPayload: (p) => ({
      moov_togo_customer_fullname: p.fullName,
      moov_togo_email:             p.email,
      moov_togo_customer_address:  p.address ?? "Lomé",
      moov_togo_phone_number:      p.phone,
      payment_token:               p.paymentToken,
    }),
  },
  "flooz|TG": {
    slug:    "moov-togo",
    country: "TG",
    label:   "Moov Money / Flooz (Togo)",
    buildPayload: (p) => ({
      moov_togo_customer_fullname: p.fullName,
      moov_togo_email:             p.email,
      moov_togo_customer_address:  p.address ?? "Lomé",
      moov_togo_phone_number:      p.phone,
      payment_token:               p.paymentToken,
    }),
  },

  // ── Bénin ─────────────────────────────────────────────────────────────────
  "mtn mobile money|BJ": {
    slug:    "mtn-benin",
    country: "BJ",
    label:   "MTN Mobile Money (Bénin)",
    buildPayload: (p) => ({
      mtn_benin_customer_fullname: p.fullName,
      mtn_benin_email:             p.email,
      mtn_benin_phone_number:      p.phone,
      mtn_benin_wallet_provider:   "MTNBENIN",
      payment_token:               p.paymentToken,
    }),
  },
  "mtn|BJ": {
    slug:    "mtn-benin",
    country: "BJ",
    label:   "MTN Mobile Money (Bénin)",
    buildPayload: (p) => ({
      mtn_benin_customer_fullname: p.fullName,
      mtn_benin_email:             p.email,
      mtn_benin_phone_number:      p.phone,
      mtn_benin_wallet_provider:   "MTNBENIN",
      payment_token:               p.paymentToken,
    }),
  },
  "moov money|BJ": {
    slug:    "moov-benin",
    country: "BJ",
    label:   "Moov Money (Bénin)",
    buildPayload: (p) => ({
      moov_benin_customer_fullname: p.fullName,
      moov_benin_email:             p.email,
      moov_benin_phone_number:      p.phone,
      payment_token:                p.paymentToken,
    }),
  },
  "moov|BJ": {
    slug:    "moov-benin",
    country: "BJ",
    label:   "Moov Money (Bénin)",
    buildPayload: (p) => ({
      moov_benin_customer_fullname: p.fullName,
      moov_benin_email:             p.email,
      moov_benin_phone_number:      p.phone,
      payment_token:                p.paymentToken,
    }),
  },

  // ── Côte d'Ivoire ─────────────────────────────────────────────────────────
  "mtn|CI": {
    slug:    "mtn-ci",
    country: "CI",
    label:   "MTN Mobile Money (CI)",
    buildPayload: (p) => ({
      mtn_ci_customer_fullname: p.fullName,
      mtn_ci_email:             p.email,
      mtn_ci_phone_number:      p.phone,
      payment_token:            p.paymentToken,
    }),
  },
  "mtn mobile money|CI": {
    slug:    "mtn-ci",
    country: "CI",
    label:   "MTN Mobile Money (CI)",
    buildPayload: (p) => ({
      mtn_ci_customer_fullname: p.fullName,
      mtn_ci_email:             p.email,
      mtn_ci_phone_number:      p.phone,
      payment_token:            p.paymentToken,
    }),
  },
  "orange money|CI": {
    slug:    "orange-money-ci",
    country: "CI",
    label:   "Orange Money (CI)",
    buildPayload: (p) => ({
      orange_money_ci_customer_fullname: p.fullName,
      orange_money_ci_email:             p.email,
      orange_money_ci_phone_number:      p.phone,
      payment_token:                     p.paymentToken,
    }),
  },
  "orange|CI": {
    slug:    "orange-money-ci",
    country: "CI",
    label:   "Orange Money (CI)",
    buildPayload: (p) => ({
      orange_money_ci_customer_fullname: p.fullName,
      orange_money_ci_email:             p.email,
      orange_money_ci_phone_number:      p.phone,
      payment_token:                     p.paymentToken,
    }),
  },
  "wave|CI": {
    slug:    "wave-ci",
    country: "CI",
    label:   "Wave (CI)",
    buildPayload: (p) => ({
      wave_ci_customer_fullname: p.fullName,
      wave_ci_email:             p.email,
      wave_ci_phone_number:      p.phone,
      payment_token:             p.paymentToken,
    }),
  },
  "moov money|CI": {
    slug:    "moov-ci",
    country: "CI",
    label:   "Moov Money (CI)",
    buildPayload: (p) => ({
      moov_ci_customer_fullname: p.fullName,
      moov_ci_email:             p.email,
      moov_ci_phone_number:      p.phone,
      payment_token:             p.paymentToken,
    }),
  },
  "moov|CI": {
    slug:    "moov-ci",
    country: "CI",
    label:   "Moov Money (CI)",
    buildPayload: (p) => ({
      moov_ci_customer_fullname: p.fullName,
      moov_ci_email:             p.email,
      moov_ci_phone_number:      p.phone,
      payment_token:             p.paymentToken,
    }),
  },

  // ── Sénégal ───────────────────────────────────────────────────────────────
  "orange money|SN": {
    slug:    "orange-money-senegal",
    country: "SN",
    label:   "Orange Money (Sénégal)",
    buildPayload: (p) => ({
      orange_money_sn_customer_fullname: p.fullName,
      orange_money_sn_email:             p.email,
      orange_money_sn_phone_number:      p.phone,
      payment_token:                     p.paymentToken,
    }),
  },
  "orange|SN": {
    slug:    "orange-money-senegal",
    country: "SN",
    label:   "Orange Money (Sénégal)",
    buildPayload: (p) => ({
      orange_money_sn_customer_fullname: p.fullName,
      orange_money_sn_email:             p.email,
      orange_money_sn_phone_number:      p.phone,
      payment_token:                     p.paymentToken,
    }),
  },
  "wave|SN": {
    slug:    "wave-senegal",
    country: "SN",
    label:   "Wave (Sénégal)",
    buildPayload: (p) => ({
      wave_sn_customer_fullname: p.fullName,
      wave_sn_email:             p.email,
      wave_sn_phone_number:      p.phone,
      payment_token:             p.paymentToken,
    }),
  },

  // ── Mali ──────────────────────────────────────────────────────────────────
  "orange money|ML": {
    slug:    "orange-money-mali",
    country: "ML",
    label:   "Orange Money (Mali)",
    buildPayload: (p) => ({
      orange_money_mali_customer_fullname: p.fullName,
      orange_money_mali_email:             p.email,
      orange_money_mali_phone_number:      p.phone,
      payment_token:                       p.paymentToken,
    }),
  },
  "orange|ML": {
    slug:    "orange-money-mali",
    country: "ML",
    label:   "Orange Money (Mali)",
    buildPayload: (p) => ({
      orange_money_mali_customer_fullname: p.fullName,
      orange_money_mali_email:             p.email,
      orange_money_mali_phone_number:      p.phone,
      payment_token:                       p.paymentToken,
    }),
  },
  "moov money|ML": {
    slug:    "moov-mali",
    country: "ML",
    label:   "Moov Money (Mali)",
    buildPayload: (p) => ({
      moov_mali_customer_fullname: p.fullName,
      moov_mali_email:             p.email,
      moov_mali_phone_number:      p.phone,
      payment_token:               p.paymentToken,
    }),
  },
  "moov|ML": {
    slug:    "moov-mali",
    country: "ML",
    label:   "Moov Money (Mali)",
    buildPayload: (p) => ({
      moov_mali_customer_fullname: p.fullName,
      moov_mali_email:             p.email,
      moov_mali_phone_number:      p.phone,
      payment_token:               p.paymentToken,
    }),
  },

  // ── Burkina Faso ──────────────────────────────────────────────────────────
  "orange money|BF": {
    slug:    "orange-money-burkina",
    country: "BF",
    label:   "Orange Money (Burkina Faso)",
    buildPayload: (p) => ({
      orange_money_bf_customer_fullname: p.fullName,
      orange_money_bf_email:             p.email,
      orange_money_bf_phone_number:      p.phone,
      payment_token:                     p.paymentToken,
    }),
  },
  "orange|BF": {
    slug:    "orange-money-burkina",
    country: "BF",
    label:   "Orange Money (Burkina Faso)",
    buildPayload: (p) => ({
      orange_money_bf_customer_fullname: p.fullName,
      orange_money_bf_email:             p.email,
      orange_money_bf_phone_number:      p.phone,
      payment_token:                     p.paymentToken,
    }),
  },
  "moov money|BF": {
    slug:    "moov-burkina",
    country: "BF",
    label:   "Moov Money (Burkina Faso)",
    buildPayload: (p) => ({
      moov_bf_customer_fullname: p.fullName,
      moov_bf_email:             p.email,
      moov_bf_phone_number:      p.phone,
      payment_token:             p.paymentToken,
    }),
  },
  "moov|BF": {
    slug:    "moov-burkina",
    country: "BF",
    label:   "Moov Money (Burkina Faso)",
    buildPayload: (p) => ({
      moov_bf_customer_fullname: p.fullName,
      moov_bf_email:             p.email,
      moov_bf_phone_number:      p.phone,
      payment_token:             p.paymentToken,
    }),
  },

  // ── Cameroun ──────────────────────────────────────────────────────────────
  "mtn momo|CM": {
    slug:    "mtn-cm",
    country: "CM",
    label:   "MTN MoMo (Cameroun)",
    buildPayload: (p) => ({
      mtn_cm_customer_fullname: p.fullName,
      mtn_cm_email:             p.email,
      mtn_cm_phone_number:      p.phone,
      payment_token:            p.paymentToken,
    }),
  },
  "mtn|CM": {
    slug:    "mtn-cm",
    country: "CM",
    label:   "MTN MoMo (Cameroun)",
    buildPayload: (p) => ({
      mtn_cm_customer_fullname: p.fullName,
      mtn_cm_email:             p.email,
      mtn_cm_phone_number:      p.phone,
      payment_token:            p.paymentToken,
    }),
  },
  "orange money|CM": {
    slug:    "orange-money-cm",
    country: "CM",
    label:   "Orange Money (Cameroun)",
    buildPayload: (p) => ({
      orange_money_cm_customer_fullname: p.fullName,
      orange_money_cm_email:             p.email,
      orange_money_cm_phone_number:      p.phone,
      payment_token:                     p.paymentToken,
    }),
  },
  "orange|CM": {
    slug:    "orange-money-cm",
    country: "CM",
    label:   "Orange Money (Cameroun)",
    buildPayload: (p) => ({
      orange_money_cm_customer_fullname: p.fullName,
      orange_money_cm_email:             p.email,
      orange_money_cm_phone_number:      p.phone,
      payment_token:                     p.paymentToken,
    }),
  },
};

/**
 * Look up the SoftPay config for a given operator + country combination.
 * The lookup is case-insensitive on the operator name.
 */
export function getSoftPayConfig(
  operator: string,
  countryCode: string,
): SoftPayOperatorConfig | null {
  const key = `${operator.toLowerCase().trim()}|${countryCode.toUpperCase().trim()}`;
  return SOFTPAY_OPERATOR_MAP[key] ?? null;
}
