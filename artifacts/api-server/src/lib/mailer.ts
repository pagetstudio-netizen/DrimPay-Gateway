import nodemailer from "nodemailer";
import { db } from "@workspace/db";
import { adminSettingsTable } from "@workspace/db/schema";

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

let _smtpCache: (SmtpConfig & { at: number }) | null = null;
const SMTP_TTL = 60_000;

async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const now = Date.now();
  if (_smtpCache && now - _smtpCache.at < SMTP_TTL) return _smtpCache;
  try {
    const rows = await db.select().from(adminSettingsTable);
    const m = Object.fromEntries(rows.map(r => [r.key, r.value ?? ""]));
    const host = m["smtp_host"] ?? "";
    const user = m["smtp_user"] ?? "";
    const pass = m["smtp_pass"] ?? "";
    const from = m["smtp_from"] || m["smtp_user"] || "noreply@drimpay.africa";
    if (!host || !user || !pass) return null;
    const cfg: SmtpConfig = { host, port: parseInt(m["smtp_port"] ?? "587"), user, pass, from };
    _smtpCache = { ...cfg, at: now };
    return cfg;
  } catch {
    return null;
  }
}

export function invalidateMailerCache() { _smtpCache = null; }

export async function sendContractEmail(opts: {
  to: string;
  merchantName: string;
  pdfBuffer: Buffer;
}): Promise<{ ok: boolean; error?: string }> {
  const cfg = await getSmtpConfig();
  if (!cfg) {
    console.warn("[Mailer] SMTP non configuré — email contrat ignoré.");
    return { ok: false, error: "SMTP non configuré" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
    });

    await transporter.sendMail({
      from: `"DrimPay" <${cfg.from}>`,
      to: opts.to,
      subject: "Votre contrat DrimPay — Accès aux services de paiement",
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#1a7a3c;padding:28px 40px;">
            <span style="font-size:24px;font-weight:bold;color:#ffffff;">DrimPay</span>
            <span style="font-size:13px;color:#c5ff4a;margin-left:10px;">Services de paiement</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="color:#111;margin:0 0 16px;">Votre contrat est prêt ✍️</h2>
            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 12px;">
              Bonjour <strong>${opts.merchantName}</strong>,
            </p>
            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 12px;">
              Merci d'avoir complété votre dossier KYB sur DrimPay. Votre contrat d'accès aux services de paiement est joint à cet email en pièce jointe PDF.
            </p>
            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Notre équipe va examiner votre dossier sous <strong>24 à 72h ouvrables</strong>. Vous recevrez une notification dès la validation ou si des documents supplémentaires sont requis.
            </p>
            <div style="background:#f8f9fa;border-left:4px solid #1a7a3c;border-radius:4px;padding:16px 20px;margin:0 0 24px;">
              <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">
                <strong>Prochaines étapes :</strong><br>
                1. Consultez votre contrat en pièce jointe<br>
                2. Conservez ce document dans vos archives<br>
                3. Attendez la validation de votre KYB (24–72h)<br>
                4. Votre accès production sera activé automatiquement
              </p>
            </div>
            <p style="color:#777;font-size:13px;line-height:1.6;margin:0 0 8px;">
              Des questions ? Contactez notre support : <a href="mailto:support@drimpay.africa" style="color:#1a7a3c;">support@drimpay.africa</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fa;padding:20px 40px;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:12px;color:#999;text-align:center;">
              DrimPay — Ashtech Sarl | Foumbot, Cameroun | RCCM RC/FBOT/2026/B/06<br>
              Cet email et ses pièces jointes sont confidentiels et destinés uniquement au destinataire.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
      `.trim(),
      attachments: [
        {
          filename: `DrimPay_Contrat_${opts.merchantName.replace(/\s+/g, "_")}.pdf`,
          content: opts.pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    console.log(`[Mailer] Contrat envoyé à ${opts.to}`);
    return { ok: true };
  } catch (e: any) {
    console.error("[Mailer] Erreur envoi email:", e?.message ?? e);
    return { ok: false, error: e?.message ?? String(e) };
  }
}

export async function sendWelcomeEmail(opts: {
  to: string;
  companyName: string;
}): Promise<{ ok: boolean; error?: string }> {
  const cfg = await getSmtpConfig();
  if (!cfg) return { ok: false, error: "SMTP non configuré" };

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host, port: cfg.port, secure: cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
    });

    await transporter.sendMail({
      from: `"DrimPay" <${cfg.from}>`,
      to: opts.to,
      subject: "Bienvenue sur DrimPay — Votre compte est créé !",
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1a7a3c;padding:28px 40px;">
            <span style="font-size:24px;font-weight:bold;color:#ffffff;">DrimPay</span>
            <span style="font-size:13px;color:#c5ff4a;margin-left:10px;">Services de paiement</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="color:#111;margin:0 0 16px;">Bienvenue sur DrimPay ! 🎉</h2>
            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 12px;">
              Bonjour <strong>${opts.companyName}</strong>,
            </p>
            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 12px;">
              Votre compte marchand DrimPay a été créé avec succès. Vous pouvez dès maintenant accéder à votre tableau de bord et commencer à configurer votre intégration.
            </p>
            <div style="background:#f0faf4;border-left:4px solid #1a7a3c;border-radius:4px;padding:16px 20px;margin:0 0 24px;">
              <p style="margin:0;font-size:13px;color:#1a5c2e;line-height:1.8;">
                <strong>Pour activer votre compte en production :</strong><br>
                1. Connectez-vous à votre tableau de bord<br>
                2. Complétez votre dossier KYB (vérification d'identité)<br>
                3. Attendez la validation par notre équipe (24–72h)<br>
                4. Votre accès production sera activé automatiquement
              </p>
            </div>
            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 24px;">
              En attendant, votre environnement <strong>sandbox</strong> est déjà disponible pour tester votre intégration.
            </p>
            <p style="color:#777;font-size:13px;line-height:1.6;margin:0 0 8px;">
              Des questions ? Contactez notre support : <a href="mailto:support@drimpay.africa" style="color:#1a7a3c;">support@drimpay.africa</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8f9fa;padding:20px 40px;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:12px;color:#999;text-align:center;">
              DrimPay — Ashtech Sarl | Foumbot, Cameroun | RCCM RC/FBOT/2026/B/06<br>
              Cet email vous est envoyé suite à votre inscription sur DrimPay.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
    });

    console.log(`[Mailer] Email bienvenue envoyé à ${opts.to}`);
    return { ok: true };
  } catch (e: any) {
    console.error("[Mailer] Erreur envoi bienvenue:", e?.message ?? e);
    return { ok: false, error: e?.message ?? String(e) };
  }
}

export async function sendKybProcessingEmail(opts: {
  to: string;
  companyName: string;
}): Promise<{ ok: boolean; error?: string }> {
  const cfg = await getSmtpConfig();
  if (!cfg) return { ok: false, error: "SMTP non configuré" };

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host, port: cfg.port, secure: cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
    });

    await transporter.sendMail({
      from: `"DrimPay" <${cfg.from}>`,
      to: opts.to,
      subject: "Dossier KYB reçu — En cours de traitement",
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1a7a3c;padding:28px 40px;">
            <span style="font-size:24px;font-weight:bold;color:#ffffff;">DrimPay</span>
            <span style="font-size:13px;color:#c5ff4a;margin-left:10px;">Services de paiement</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="color:#111;margin:0 0 16px;">Votre dossier KYB est en cours de traitement ⏳</h2>
            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 12px;">
              Bonjour <strong>${opts.companyName}</strong>,
            </p>
            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 12px;">
              Nous avons bien reçu votre dossier de vérification KYB. Notre équipe de conformité l'examine attentivement et vous contactera dans les meilleurs délais.
            </p>
            <div style="background:#fff8e1;border-left:4px solid #f59e0b;border-radius:4px;padding:16px 20px;margin:0 0 24px;">
              <p style="margin:0 0 8px;font-size:13px;color:#78350f;font-weight:bold;">Délai de traitement estimé</p>
              <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                ⏱ <strong>24 à 72 heures ouvrables</strong> à partir de la réception de votre dossier.<br>
                Vous recevrez une notification dès que votre dossier sera validé ou si des informations complémentaires sont nécessaires.
              </p>
            </div>
            <div style="background:#f0faf4;border-left:4px solid #1a7a3c;border-radius:4px;padding:16px 20px;margin:0 0 24px;">
              <p style="margin:0;font-size:13px;color:#1a5c2e;line-height:1.8;">
                <strong>Pendant l'examen de votre dossier :</strong><br>
                • Votre environnement sandbox reste disponible pour tester votre intégration<br>
                • Assurez-vous que vos documents soient lisibles et à jour<br>
                • Vérifiez votre boîte email pour toute demande complémentaire de notre part
              </p>
            </div>
            <p style="color:#777;font-size:13px;line-height:1.6;margin:0 0 8px;">
              Des questions ? Contactez notre équipe KYB : <a href="mailto:support@drimpay.africa" style="color:#1a7a3c;">support@drimpay.africa</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8f9fa;padding:20px 40px;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:12px;color:#999;text-align:center;">
              DrimPay — Ashtech Sarl | Foumbot, Cameroun | RCCM RC/FBOT/2026/B/06<br>
              Cet email fait suite à votre soumission de dossier KYB sur DrimPay.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
    });

    console.log(`[Mailer] Email KYB en traitement envoyé à ${opts.to}`);
    return { ok: true };
  } catch (e: any) {
    console.error("[Mailer] Erreur envoi KYB processing:", e?.message ?? e);
    return { ok: false, error: e?.message ?? String(e) };
  }
}

export async function sendBroadcastEmail(opts: {
  to: string;
  merchantName: string;
  subject: string;
  htmlBody: string;
}): Promise<{ ok: boolean; error?: string }> {
  const cfg = await getSmtpConfig();
  if (!cfg) return { ok: false, error: "SMTP non configuré" };

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
    });

    await transporter.sendMail({
      from: `"DrimPay" <${cfg.from}>`,
      to: opts.to,
      subject: opts.subject,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1a7a3c;padding:28px 40px;">
            <span style="font-size:24px;font-weight:bold;color:#ffffff;">DrimPay</span>
            <span style="font-size:13px;color:#c5ff4a;margin-left:10px;">Services de paiement</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 12px;">
              Bonjour <strong>${opts.merchantName}</strong>,
            </p>
            ${opts.htmlBody}
          </td>
        </tr>
        <tr>
          <td style="background:#f8f9fa;padding:20px 40px;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:12px;color:#999;text-align:center;">
              DrimPay — Ashtech Sarl | Foumbot, Cameroun | RCCM RC/FBOT/2026/B/06<br>
              Cet email est destiné uniquement au destinataire.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
    });

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}
