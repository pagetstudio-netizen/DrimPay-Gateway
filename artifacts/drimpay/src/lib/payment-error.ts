export type PaymentErrorLocale = "fr" | "en";

export type CustomerPaymentErrorCode =
  | "OPERATOR_UNAVAILABLE"
  | "INVALID_PHONE"
  | "INVALID_CONFIRMATION_CODE"
  | "INSUFFICIENT_FUNDS"
  | "PAYMENT_DECLINED"
  | "PAYMENT_FAILED"
  | "PAYMENT_TEMPORARY_FAILURE"
  | "PAYMENT_UNAVAILABLE"
  | "OTP_REQUIRED"
  | "INVALID_REQUEST"
  | "INVALID_LINK"
  | "PAYMENT_LINK_EXPIRED"
  | "PAYMENT_LINK_UNAVAILABLE"
  | "UNSUPPORTED_COUNTRY"
  | "PHONE_UNAVAILABLE"
  | "PAYMENT_TIMEOUT";

const KNOWN_CODES = new Set<CustomerPaymentErrorCode>([
  "OPERATOR_UNAVAILABLE",
  "INVALID_PHONE",
  "INVALID_CONFIRMATION_CODE",
  "INSUFFICIENT_FUNDS",
  "PAYMENT_DECLINED",
  "PAYMENT_FAILED",
  "PAYMENT_TEMPORARY_FAILURE",
  "PAYMENT_UNAVAILABLE",
  "OTP_REQUIRED",
  "INVALID_REQUEST",
  "INVALID_LINK",
  "PAYMENT_LINK_EXPIRED",
  "PAYMENT_LINK_UNAVAILABLE",
  "UNSUPPORTED_COUNTRY",
  "PHONE_UNAVAILABLE",
  "PAYMENT_TIMEOUT",
]);

const CODE_ALIASES: Record<string, CustomerPaymentErrorCode> = {
  OPERATOR_MAINTENANCE: "OPERATOR_UNAVAILABLE",
  OPERATOR_NOT_AVAILABLE: "OPERATOR_UNAVAILABLE",
  OPERATOR_DISABLED: "OPERATOR_UNAVAILABLE",
  SERVICE_UNAVAILABLE: "OPERATOR_UNAVAILABLE",
  INVALID_NUMBER: "INVALID_PHONE",
  INVALID_MSISDN: "INVALID_PHONE",
  WRONG_NUMBER: "INVALID_PHONE",
  INVALID_OTP: "INVALID_CONFIRMATION_CODE",
  WRONG_OTP: "INVALID_CONFIRMATION_CODE",
  OTP_INVALID: "INVALID_CONFIRMATION_CODE",
  PIN_INVALID: "INVALID_CONFIRMATION_CODE",
  INSUFFICIENT_BALANCE: "INSUFFICIENT_FUNDS",
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
  DECLINED: "PAYMENT_DECLINED",
  PAYMENT_REJECTED: "PAYMENT_DECLINED",
  FAILED: "PAYMENT_FAILED",
  PAYMENTS_UNAVAILABLE: "PAYMENT_UNAVAILABLE",
  PAYMENTS_DISABLED: "PAYMENT_UNAVAILABLE",
  LINK_EXPIRED: "PAYMENT_LINK_EXPIRED",
  LINK_INACTIVE: "PAYMENT_LINK_UNAVAILABLE",
  LINK_EXHAUSTED: "PAYMENT_LINK_UNAVAILABLE",
  LINK_NOT_FOUND: "INVALID_LINK",
  NOT_FOUND: "INVALID_LINK",
  PHONE_BLACKLISTED: "PHONE_UNAVAILABLE",
  INVALID_COUNTRY: "UNSUPPORTED_COUNTRY",
  REQUEST_INVALID: "INVALID_REQUEST",
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function classifyText(value: unknown): CustomerPaymentErrorCode | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;

  const text = normalize(value);
  const code = text.toUpperCase().replace(/\s+/g, "_");
  if (KNOWN_CODES.has(code as CustomerPaymentErrorCode)) {
    return code as CustomerPaymentErrorCode;
  }
  if (CODE_ALIASES[code]) return CODE_ALIASES[code];

  if (/\b(introuvable|not found|invalid link)\b/.test(text)) {
    return "INVALID_LINK";
  }

  const operatorMentioned = /\b(operator|operateur|service|payment method|methode de paiement)\b/.test(text);
  if (
    operatorMentioned &&
    /\b(unavailable|indisponible|maintenance|not available|blocked|bloque|suspended|suspendu|inactive|inactif)\b/.test(text)
  ) {
    return "OPERATOR_UNAVAILABLE";
  }

  const phoneMentioned = /\b(phone|telephone|numero|number|msisdn|recipient)\b/.test(text);
  const invalidInput = /\b(invalid|incorrect|wrong|malformed|not valid|invalide|inexact|non valide)\b/.test(text);
  if (phoneMentioned && invalidInput) return "INVALID_PHONE";

  const codeMentioned = /\b(otp|pin|passcode|confirmation code|code)\b/.test(text);
  if (
    codeMentioned &&
    /\b(invalid|incorrect|wrong|expired|invalide|expire)\b/.test(text)
  ) {
    return "INVALID_CONFIRMATION_CODE";
  }

  if (/\b(insufficient funds|insufficient balance|not enough funds|low balance|solde insuffisant|fonds insuffisants)\b/.test(text)) {
    return "INSUFFICIENT_FUNDS";
  }
  if (/\b(connection refused|econnrefused|connect(?:ion)? reset|socket hang up)\b/.test(text)) {
    return "PAYMENT_TEMPORARY_FAILURE";
  }
  if (/\b(declined|rejected|refused|denied|refuse|rejete|non accepte)\b/.test(text)) {
    return "PAYMENT_DECLINED";
  }
  if (/\b(failed|failure|echec|echoue|annule|cancelled|canceled|expired|expire)\b/.test(text)) {
    return "PAYMENT_FAILED";
  }

  return undefined;
}

/** Extracts a safe category; raw server/provider strings are never returned to the UI. */
export function getCustomerPaymentErrorCode(payload: unknown): CustomerPaymentErrorCode {
  if (typeof payload === "string") {
    return classifyText(payload) ?? "PAYMENT_TEMPORARY_FAILURE";
  }
  if (!payload || typeof payload !== "object") return "PAYMENT_TEMPORARY_FAILURE";

  const data = payload as Record<string, unknown>;
  const values = [
    data.code,
    data.errorCode,
    data.error,
    data.message,
    data.failureCode,
    data.failureReason,
  ];
  for (const value of values) {
    const code = classifyText(value);
    if (code) return code;
  }
  return "PAYMENT_TEMPORARY_FAILURE";
}

export function getCustomerPaymentErrorMessage(
  value: unknown,
  operator: string,
  locale: PaymentErrorLocale,
): string {
  const code = getCustomerPaymentErrorCode(value);
  const operatorName = operator.trim() || (locale === "fr" ? "sélectionnée" : "selected");

  const messages: Record<CustomerPaymentErrorCode, Record<PaymentErrorLocale, string>> = {
    OPERATOR_UNAVAILABLE: {
      fr: `La méthode de paiement ${operatorName} est temporairement indisponible. Nous sommes vraiment désolés pour ce désagrément. Nous vous prions de patienter le temps de la résolution, ou de choisir un autre moyen de paiement.`,
      en: `The ${operatorName} payment method is temporarily unavailable. We sincerely apologize for the inconvenience. Please wait while we resolve the issue, or choose another payment method.`,
    },
    INVALID_PHONE: {
      fr: "Le numéro saisi semble incorrect pour cet opérateur. Vérifiez le numéro et réessayez.",
      en: "The number entered does not seem valid for this operator. Please check it and try again.",
    },
    INVALID_CONFIRMATION_CODE: {
      fr: "Le code de confirmation semble incorrect ou expiré. Vérifiez le code reçu et réessayez.",
      en: "The confirmation code seems incorrect or expired. Check the code you received and try again.",
    },
    INSUFFICIENT_FUNDS: {
      fr: "Votre solde mobile money semble insuffisant pour ce paiement. Vérifiez votre solde, puis réessayez.",
      en: "Your mobile money balance may be too low for this payment. Check your balance and try again.",
    },
    PAYMENT_DECLINED: {
      fr: "Le paiement n’a pas été accepté. Vérifiez les informations et confirmez la demande sur votre téléphone.",
      en: "The payment was not accepted. Check your details and confirm the request on your phone.",
    },
    PAYMENT_FAILED: {
      fr: "Le paiement n’a pas abouti. Vérifiez les informations puis réessayez, ou choisissez un autre moyen de paiement.",
      en: "The payment could not be completed. Check your details and try again, or choose another payment method.",
    },
    PAYMENT_TEMPORARY_FAILURE: {
      fr: "Nous ne pouvons pas traiter votre paiement pour le moment. Nous sommes désolés pour ce désagrément. Veuillez patienter quelques instants puis réessayer. Si le problème persiste, choisissez un autre moyen de paiement.",
      en: "We can’t process your payment right now. We’re sorry for the inconvenience. Please wait a moment and try again. If the problem continues, choose another payment method.",
    },
    PAYMENT_UNAVAILABLE: {
      fr: "Le paiement est temporairement indisponible. Nous sommes désolés pour ce désagrément. Veuillez patienter quelques instants ou réessayer plus tard.",
      en: "Payments are temporarily unavailable. We’re sorry for the inconvenience. Please wait a moment or try again later.",
    },
    OTP_REQUIRED: {
      fr: "Un code de confirmation Orange Money est requis. Récupérez le code sur votre téléphone et saisissez-le pour continuer.",
      en: "An Orange Money confirmation code is required. Get the code on your phone and enter it to continue.",
    },
    INVALID_REQUEST: {
      fr: "Certaines informations sont manquantes ou incorrectes. Vérifiez les champs et réessayez.",
      en: "Some information is missing or incorrect. Check the fields and try again.",
    },
    INVALID_LINK: {
      fr: "Ce lien de paiement est introuvable ou invalide. Vérifiez le lien auprès de la personne qui vous l’a envoyé.",
      en: "This payment link could not be found or is invalid. Please check with the person who sent it to you.",
    },
    PAYMENT_LINK_EXPIRED: {
      fr: "Ce lien de paiement a expiré. Demandez un nouveau lien au marchand.",
      en: "This payment link has expired. Please ask the merchant for a new link.",
    },
    PAYMENT_LINK_UNAVAILABLE: {
      fr: "Ce lien de paiement n’est plus disponible. Contactez le marchand pour obtenir de l’aide.",
      en: "This payment link is no longer available. Contact the merchant for help.",
    },
    UNSUPPORTED_COUNTRY: {
      fr: "Les paiements depuis ce pays ne sont pas disponibles avec ce lien.",
      en: "Payments from this country are not available through this link.",
    },
    PHONE_UNAVAILABLE: {
      fr: "Ce numéro ne peut pas être utilisé pour ce paiement. Vérifiez-le ou contactez le marchand.",
      en: "This number can’t be used for this payment. Check it or contact the merchant.",
    },
    PAYMENT_TIMEOUT: {
      fr: "La confirmation prend plus de temps que prévu. Si vous avez validé le paiement sur votre téléphone, vérifiez votre historique avant de réessayer.",
      en: "Confirmation is taking longer than expected. If you approved the payment on your phone, check your transaction history before trying again.",
    },
  };

  return messages[code][locale];
}