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
    const from = m["smtp_from"] || m["smtp_user"] || "noreply@drimpay.com";
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
  contractBuffer: Buffer;
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
      subject: "Votre contrat DrimPay — Action requise : signature et envoi",
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
            <h2 style="color:#111;margin:0 0 16px;">Votre contrat d'accès aux services de paiement</h2>
            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 12px;">
              Bonjour <strong>${opts.merchantName}</strong>,
            </p>
            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 20px;">
              Merci d'avoir soumis votre dossier KYB sur DrimPay. Votre contrat d'accès aux services de paiement est joint à cet email en pièce jointe (format Word .docx).
            </p>
            <div style="background:#fff8e1;border-left:4px solid #f59e0b;border-radius:4px;padding:20px 24px;margin:0 0 24px;">
              <p style="margin:0 0 10px;font-size:14px;font-weight:bold;color:#92400e;">Action requise pour activer votre compte en production</p>
              <p style="margin:0;font-size:13px;color:#78350f;line-height:2;">
                1. Téléchargez et imprimez le contrat en pièce jointe<br>
                2. Signez le document (représentant légal)<br>
                3. Scannez ou photographiez le contrat signé<br>
                4. Envoyez-le à notre service client : <a href="mailto:support@drimpay.com" style="color:#92400e;font-weight:bold;">support@drimpay.com</a><br>
                5. Votre compte production sera activé après validation par notre équipe
              </p>
            </div>
            <div style="background:#f0faf4;border-left:4px solid #1a7a3c;border-radius:4px;padding:16px 20px;margin:0 0 24px;">
              <p style="margin:0;font-size:13px;color:#1a5c2e;line-height:1.8;">
                <strong>Délai de traitement :</strong> 24 à 72 heures ouvrables après réception du contrat signé.<br>
                En attendant, votre environnement sandbox reste disponible pour tester votre intégration.
              </p>
            </div>
            <p style="color:#777;font-size:13px;line-height:1.6;margin:0 0 8px;">
              Des questions ? Contactez notre support : <a href="mailto:support@drimpay.com" style="color:#1a7a3c;">support@drimpay.com</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fa;padding:20px 40px;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:12px;color:#999;text-align:center;">
              DrimPay<br>
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
          filename: `DrimPay_Contrat_${opts.merchantName.replace(/\s+/g, "_")}.docx`,
          content: opts.contractBuffer,
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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

export async function sendKybApprovedEmail(opts: {
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
      subject: "✅ Votre dossier KYB a été approuvé — Bienvenue en production !",
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
            <div style="text-align:center;margin-bottom:28px;">
              <div style="display:inline-block;background:#dcfce7;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;text-align:center;">✅</div>
            </div>
            <h2 style="color:#111;margin:0 0 16px;text-align:center;">Dossier KYB approuvé !</h2>
            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 12px;">
              Bonjour <strong>${opts.companyName}</strong>,
            </p>
            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 20px;">
              Excellente nouvelle ! Notre équipe de conformité a examiné votre dossier KYB et l'a <strong style="color:#16a34a;">validé avec succès</strong>. Votre compte est maintenant pleinement activé.
            </p>
            <div style="background:#f0faf4;border:1px solid #86efac;border-radius:10px;padding:20px 24px;margin:0 0 24px;">
              <p style="margin:0 0 10px;font-size:14px;font-weight:bold;color:#15803d;">Ce que vous pouvez faire maintenant :</p>
              <p style="margin:0;font-size:13px;color:#166534;line-height:2;">
                🔑 Générer vos clés API de production<br>
                💳 Accepter des paiements Mobile Money en production<br>
                📊 Suivre vos transactions en temps réel sur le tableau de bord<br>
                🌍 Encaisser dans les 7 pays supportés par DrimPay
              </p>
            </div>
            <p style="color:#777;font-size:13px;line-height:1.6;margin:0 0 8px;">
              Des questions ? Contactez notre équipe : <a href="mailto:support@drimpay.com" style="color:#1a7a3c;">support@drimpay.com</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8f9fa;padding:20px 40px;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:12px;color:#999;text-align:center;">
              DrimPay
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
    });

    console.log(`[Mailer] Email approbation KYB envoyé à ${opts.to}`);
    return { ok: true };
  } catch (e: any) {
    console.error("[Mailer] Erreur email approbation KYB:", e?.message ?? e);
    return { ok: false, error: e?.message ?? String(e) };
  }
}

export async function sendKybRejectedEmail(opts: {
  to: string;
  companyName: string;
  reason: string;
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
      subject: "❌ Dossier KYB — Des corrections sont nécessaires",
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
            <div style="text-align:center;margin-bottom:28px;">
              <div style="display:inline-block;background:#fee2e2;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;text-align:center;">❌</div>
            </div>
            <h2 style="color:#111;margin:0 0 16px;text-align:center;">Des corrections sont nécessaires</h2>
            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 12px;">
              Bonjour <strong>${opts.companyName}</strong>,
            </p>
            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 20px;">
              Après examen de votre dossier KYB, notre équipe de conformité a identifié des points nécessitant votre attention avant de pouvoir valider votre compte.
            </p>
            <div style="background:#fff1f2;border-left:4px solid #ef4444;border-radius:4px;padding:18px 22px;margin:0 0 24px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:#b91c1c;">Motif du refus :</p>
              <p style="margin:0;font-size:14px;color:#7f1d1d;line-height:1.7;white-space:pre-wrap;">${opts.reason}</p>
            </div>
            <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;margin:0 0 24px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:#92400e;">Comment procéder :</p>
              <p style="margin:0;font-size:13px;color:#78350f;line-height:1.8;">
                1. Connectez-vous à votre tableau de bord DrimPay<br>
                2. Rendez-vous dans la section <strong>KYB / Vérification</strong><br>
                3. Corrigez les informations ou remplacez les documents concernés<br>
                4. Soumettez à nouveau votre dossier pour révision
              </p>
            </div>
            <p style="color:#777;font-size:13px;line-height:1.6;margin:0 0 8px;">
              Besoin d'aide ? Contactez notre équipe KYB : <a href="mailto:support@drimpay.com" style="color:#1a7a3c;">support@drimpay.com</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8f9fa;padding:20px 40px;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:12px;color:#999;text-align:center;">
              DrimPay
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
    });

    console.log(`[Mailer] Email rejet KYB envoyé à ${opts.to}`);
    return { ok: true };
  } catch (e: any) {
    console.error("[Mailer] Erreur email rejet KYB:", e?.message ?? e);
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
              Des questions ? Contactez notre support : <a href="mailto:support@drimpay.com" style="color:#1a7a3c;">support@drimpay.com</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8f9fa;padding:20px 40px;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:12px;color:#999;text-align:center;">
              DrimPay<br>
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
              Des questions ? Contactez notre équipe KYB : <a href="mailto:support@drimpay.com" style="color:#1a7a3c;">support@drimpay.com</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8f9fa;padding:20px 40px;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:12px;color:#999;text-align:center;">
              DrimPay<br>
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
              DrimPay<br>
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

export async function sendSupportReplyEmail(opts: {
  to: string;
  recipientName: string;
  subject: string;
  replyBody: string;
  agentName: string;
}): Promise<{ ok: boolean; error?: string }> {
  const cfg = await getSmtpConfig();
  if (!cfg) {
    console.warn("[Mailer] SMTP non configuré — email support ignoré.");
    return { ok: false, error: "SMTP non configuré" };
  }
  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    const bodyHtml = opts.replyBody.replace(/\n/g, "<br>");
    await transporter.sendMail({
      from: `"Support DrimPay" <${cfg.from}>`,
      to: opts.to,
      subject: `Re: ${opts.subject}`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#111827;padding:24px 36px;">
          <span style="font-size:22px;font-weight:bold;color:#ffffff;">Drim<span style="color:#C5FF4A;">Pay</span></span>
          <span style="font-size:12px;color:#9ca3af;margin-left:10px;">Support</span>
        </td></tr>
        <tr><td style="padding:32px 36px;">
          <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px;">Bonjour <strong>${opts.recipientName}</strong>,</p>
          <p style="color:#374151;font-size:14px;margin:0 0 6px;">En réponse à votre message : <strong>${opts.subject}</strong></p>
          <div style="background:#f9fafb;border-left:3px solid #C5FF4A;border-radius:4px;padding:16px 20px;margin:20px 0;color:#374151;font-size:14px;line-height:1.8;">${bodyHtml}</div>
          <p style="color:#6b7280;font-size:13px;margin:24px 0 0;">— ${opts.agentName}<br><span style="color:#9ca3af;">Équipe Support DrimPay</span></p>
        </td></tr>
        <tr><td style="background:#f8f9fa;padding:18px 36px;border-top:1px solid #eeeeee;">
          <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">DrimPay · support@drimpay.com · Cet email est destiné uniquement au destinataire.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  companyName: string;
  code: string;
  resetLink: string;
}): Promise<{ ok: boolean; error?: string }> {
  const cfg = await getSmtpConfig();
  if (!cfg) {
    console.warn("[Mailer] SMTP non configuré — email réinitialisation ignoré.");
    return { ok: false, error: "SMTP non configuré" };
  }
  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host, port: cfg.port, secure: cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    await transporter.sendMail({
      from: `"DrimPay" <${cfg.from}>`,
      to: opts.to,
      subject: "🔐 Réinitialisation de votre mot de passe DrimPay",
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.09);">
        <tr>
          <td style="background:#0f172a;padding:26px 36px;">
            <span style="font-size:22px;font-weight:bold;color:#C5FF4A;letter-spacing:-0.5px;">Drim</span><span style="font-size:22px;font-weight:bold;color:#ffffff;">Pay</span>
          </td>
        </tr>
        <tr><td style="padding:36px 36px 24px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;background:#fef2f2;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:30px;text-align:center;">🔐</div>
          </div>
          <h2 style="color:#0f172a;margin:0 0 8px;text-align:center;font-size:20px;">Réinitialisation du mot de passe</h2>
          <p style="color:#64748b;font-size:13px;text-align:center;margin:0 0 28px;">Bonjour <strong>${opts.companyName}</strong>, voici votre code de vérification :</p>

          <div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
            <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">Code de vérification</p>
            <p style="margin:0;font-size:42px;font-weight:bold;letter-spacing:10px;color:#0f172a;font-family:monospace;">${opts.code}</p>
            <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">Ce code expire dans <strong>15 minutes</strong></p>
          </div>

          <p style="color:#64748b;font-size:13px;text-align:center;margin:0 0 16px;">Ou cliquez directement sur le bouton ci-dessous :</p>

          <div style="text-align:center;margin:0 0 28px;">
            <a href="${opts.resetLink}" style="display:inline-block;background:#0f172a;color:#C5FF4A;font-size:14px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:10px;letter-spacing:0.3px;">
              Réinitialiser mon mot de passe →
            </a>
          </div>

          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 18px;margin:0 0 8px;">
            <p style="margin:0;font-size:12px;color:#9a3412;line-height:1.6;">
              ⚠️ Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe reste inchangé.
            </p>
          </div>
        </td></tr>
        <tr>
          <td style="background:#f8f9fa;padding:18px 36px;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">DrimPay · Cet email expire dans 15 minutes · Ne partagez jamais ce code.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
    });
    console.log(`[Mailer] Email réinitialisation envoyé à ${opts.to}`);
    return { ok: true };
  } catch (e: any) {
    console.error("[Mailer] Erreur envoi réinitialisation:", e?.message ?? e);
    return { ok: false, error: e?.message ?? String(e) };
  }
}
