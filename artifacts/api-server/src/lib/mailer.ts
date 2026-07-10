import { Resend } from "resend";
import { pool } from "@workspace/db";

function extractEmail(raw: string | undefined, fallback: string): string {
  if (!raw?.trim()) return `DrimPay <${fallback}>`;
  const bracketed = raw.match(/<([^>]+)>/);
  if (bracketed) return `DrimPay <${bracketed[1].trim()}>`;
  const plain = raw.match(/^[^\s<>]+@[^\s<>]+$/);
  if (plain) return `DrimPay <${raw.trim()}>`;
  return `DrimPay <${fallback}>`;
}
const FROM_EMAIL    = extractEmail(process.env["RESEND_FROM_EMAIL"],    "support@drimpay.com");
const SUPPORT_EMAIL = extractEmail(process.env["RESEND_SUPPORT_EMAIL"], "support@drimpay.com");

function getResend(): Resend | null {
  const key = process.env["RESEND_API_KEY"];
  if (!key) {
    console.warn("[Mailer] RESEND_API_KEY non configuré — email ignoré.");
    return null;
  }
  return new Resend(key);
}

export function invalidateMailerCache() {}

async function buildEmailFooter(): Promise<string> {
  let links: { name: string; url: string }[] = [];
  let siteUrl = "https://drimpay.com";

  try {
    const { rows: socialRows } = await pool.query<{ name: string; url: string }>(
      `SELECT name, url FROM social_links WHERE active = true ORDER BY sort_order, id`
    );
    links = socialRows;

    const { rows: settingRows } = await pool.query<{ value: string }>(
      `SELECT value FROM admin_settings WHERE key = 'site_url' LIMIT 1`
    );
    if (settingRows[0]?.value) siteUrl = settingRows[0].value;
  } catch {}

  const logoUrl = `${siteUrl}/logo-drimpay.png`;

  function getSocialColor(name: string, url: string): string {
    const n = name.toLowerCase();
    const u = url.toLowerCase();
    if (u.includes("wa.me") || u.includes("whatsapp.com") || n.includes("whatsapp")) return "#25D366";
    if (u.includes("youtube.com") || n.includes("youtube")) return "#FF0000";
    if (u.includes("facebook.com") || n.includes("facebook")) return "#1877F2";
    if (u.includes("t.me") || n.includes("telegram")) return "#0088cc";
    if (u.includes("instagram.com") || n.includes("instagram")) return "#E1306C";
    return "#374151";
  }

  const buttons = links
    .map(({ name, url }) => {
      const bg = getSocialColor(name, url);
      return `<a href="${url}" style="display:inline-block;margin:4px 5px;background:${bg};color:#ffffff;font-size:11px;font-weight:bold;padding:7px 13px;border-radius:20px;text-decoration:none;">${name}</a>`;
    })
    .join("");

  return `<tr>
  <td style="background:#0f172a;padding:28px 32px;border-top:2px solid #C5FF4A;text-align:center;">
    <a href="${siteUrl}" style="display:inline-block;margin-bottom:14px;text-decoration:none;">
      <img src="${logoUrl}" alt="DrimPay" width="130" height="auto" style="display:block;margin:0 auto;max-height:44px;" />
    </a>
    ${buttons ? `<div style="margin:0 0 14px;line-height:2.2;">${buttons}</div>` : ""}
    <p style="margin:0;font-size:11px;color:#475569;line-height:1.8;">
      DrimPay &middot; Infrastructure de paiement Mobile Money pour l'Afrique<br>
      &copy; ${new Date().getFullYear()} DrimPay. Tous droits r&eacute;serv&eacute;s.
    </p>
  </td>
</tr>`;
}

export async function sendPasswordResetSupportEmail(opts: {
  userEmail: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  const adminEmail = process.env["RESEND_SUPPORT_EMAIL"] ?? "support@drimpay.com";

  if (!resend) {
    console.warn("[Mailer] RESEND_API_KEY non configuré — demande support ignorée.");
    return { ok: false, error: "RESEND_API_KEY non configuré" };
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `[Accès compte] Demande manuelle — ${opts.userEmail}`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.09);">
        <tr>
          <td style="background:#0f172a;padding:26px 36px;">
            <span style="font-size:22px;font-weight:bold;color:#C5FF4A;">Drim</span><span style="font-size:22px;font-weight:bold;color:#ffffff;">Pay</span>
            <span style="font-size:12px;color:#94a3b8;margin-left:10px;">Support · Demande accès compte</span>
          </td>
        </tr>
        <tr><td style="padding:32px 36px;">
          <h2 style="color:#0f172a;margin:0 0 16px;font-size:18px;">Demande de réinitialisation manuelle</h2>
          <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 8px;">Un utilisateur n'a pas reçu le code de réinitialisation par email et demande une assistance manuelle.</p>
          <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin:20px 0;">
            <p style="margin:0 0 8px;font-size:13px;color:#64748b;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">Email du compte</p>
            <p style="margin:0;font-size:16px;font-weight:bold;color:#0f172a;">${opts.userEmail}</p>
          </div>
          <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;padding:16px 20px;margin:0 0 20px;">
            <p style="margin:0 0 8px;font-size:13px;color:#92400e;font-weight:bold;">Message de l'utilisateur :</p>
            <p style="margin:0;font-size:14px;color:#78350f;line-height:1.7;white-space:pre-wrap;">${opts.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">Envoyé depuis la page de réinitialisation de mot de passe · ${new Date().toISOString()}</p>
        </td></tr>
        <tr>
          <td style="background:#f8f9fa;padding:16px 36px;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">DrimPay · Administration interne</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
    });
    console.log(`[Mailer] Demande support reset envoyée pour ${opts.userEmail}`);
    return { ok: true };
  } catch (e: any) {
    console.error("[Mailer] Erreur envoi demande support:", e?.message ?? e);
    return { ok: false, error: e?.message ?? String(e) };
  }
}

export async function sendEmailVerificationEmail(opts: {
  to: string;
  companyName: string;
  code: string;
  activationLink: string;
  type: "signup" | "new_device";
}): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "RESEND_API_KEY non configuré" };

  const isNewDevice = opts.type === "new_device";
  const subject = isNewDevice
    ? "DrimPay — Connexion depuis un nouvel appareil"
    : "DrimPay — Confirmez votre adresse email";

  const footer = await buildEmailFooter();

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#0f0f0f;padding:24px 40px;text-align:center;">
            <span style="font-size:26px;font-weight:bold;color:#ffffff;">Drim<span style="color:#C5FF4A;">Pay</span></span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <h2 style="color:#111111;margin:0 0 12px;font-size:20px;text-align:center;">
              ${isNewDevice ? "Connexion depuis un nouvel appareil" : "Confirmez votre email"}
            </h2>
            <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 8px;text-align:center;">
              Bonjour <strong>${opts.companyName}</strong>,
            </p>
            <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 32px;text-align:center;">
              ${isNewDevice
                ? "Une connexion a été initiée depuis un appareil que nous ne reconnaissons pas. Utilisez le code ci-dessous pour confirmer que c'est bien vous."
                : "Merci de vous être inscrit sur DrimPay. Entrez le code ci-dessous pour activer votre compte."}
            </p>
            <div style="text-align:center;margin:0 0 28px;">
              <div style="display:inline-block;background:#f8f8f8;border:2px solid #e5e5e5;border-radius:16px;padding:24px 40px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:bold;color:#999;text-transform:uppercase;letter-spacing:2px;">Votre code</p>
                <p style="margin:0;font-size:42px;font-weight:bold;color:#0f0f0f;letter-spacing:10px;font-family:monospace;">${opts.code}</p>
                <p style="margin:8px 0 0;font-size:12px;color:#aaa;">Valable 15 minutes</p>
              </div>
            </div>
            <div style="text-align:center;margin:0 0 28px;">
              <p style="margin:0 0 12px;font-size:13px;color:#777;">Ou cliquez directement sur le lien d'activation :</p>
              <a href="${opts.activationLink}" style="display:inline-block;background:#C5FF4A;color:#0f0f0f;font-weight:bold;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;">
                Activer mon compte
              </a>
            </div>
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 20px;margin:0 0 8px;">
              <p style="margin:0;font-size:12px;color:#92400e;line-height:1.6;">
                Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Votre compte reste sécurisé.
              </p>
            </div>
          </td>
        </tr>
        ${footer}
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
    });
    console.log(`[Mailer] Email vérification (${opts.type}) envoyé à ${opts.to}`);
    return { ok: true };
  } catch (e: any) {
    console.error("[Mailer] Erreur envoi vérification:", e?.message ?? e);
    return { ok: false, error: e?.message ?? String(e) };
  }
}

export async function sendWelcomeEmail(opts: {
  to: string;
  companyName: string;
}): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "RESEND_API_KEY non configuré" };

  const footer = await buildEmailFooter();

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
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
            <h2 style="color:#111;margin:0 0 16px;">Bienvenue sur DrimPay !</h2>
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
        ${footer}
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

export async function sendAdminNewUserEmail(opts: {
  userEmail: string;
  companyName: string;
  country: string;
  accountType: string;
}): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  const adminEmail = process.env["RESEND_SUPPORT_EMAIL"] ?? "support@drimpay.com";
  if (!resend) return { ok: false, error: "RESEND_API_KEY non configuré" };

  const now = new Date().toLocaleString("fr-FR", { timeZone: "Africa/Abidjan", dateStyle: "full", timeStyle: "short" });

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `[DrimPay] Nouvelle inscription — ${opts.companyName}`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.09);">
        <tr>
          <td style="background:#0f172a;padding:24px 36px;">
            <span style="font-size:22px;font-weight:bold;color:#C5FF4A;">Drim</span><span style="font-size:22px;font-weight:bold;color:#ffffff;">Pay</span>
            <span style="font-size:12px;color:#94a3b8;margin-left:10px;">Admin · Nouvelle inscription</span>
          </td>
        </tr>
        <tr><td style="padding:28px 36px;">
          <h2 style="color:#0f172a;margin:0 0 6px;font-size:17px;">Nouvel utilisateur inscrit</h2>
          <p style="color:#64748b;font-size:13px;margin:0 0 24px;">${now}</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
                <span style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Email</span><br>
                <span style="font-size:15px;font-weight:bold;color:#0f172a;">${opts.userEmail}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
                <span style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Entreprise</span><br>
                <span style="font-size:15px;font-weight:bold;color:#0f172a;">${opts.companyName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
                <span style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Pays</span><br>
                <span style="font-size:15px;color:#0f172a;">${opts.country}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;">
                <span style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Type de compte</span><br>
                <span style="font-size:15px;color:#0f172a;">${opts.accountType}</span>
              </td>
            </tr>
          </table>
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px 18px;margin:20px 0 0;">
            <p style="margin:0;font-size:13px;color:#166534;">L'utilisateur doit encore vérifier son email avant d'accéder au tableau de bord.</p>
          </div>
        </td></tr>
        <tr>
          <td style="background:#f8f9fa;padding:14px 36px;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">DrimPay · Administration interne · Ne pas répondre à cet email</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
    });
    console.log(`[Mailer] Notification admin nouvelle inscription envoyée pour ${opts.userEmail}`);
    return { ok: true };
  } catch (e: any) {
    console.error("[Mailer] Erreur notification admin inscription:", e?.message ?? e);
    return { ok: false, error: e?.message ?? String(e) };
  }
}

export async function sendKybProcessingEmail(opts: {
  to: string;
  companyName: string;
}): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "RESEND_API_KEY non configuré" };

  const footer = await buildEmailFooter();

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
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
            <h2 style="color:#111;margin:0 0 16px;">Votre dossier KYB est en cours de traitement</h2>
            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 12px;">
              Bonjour <strong>${opts.companyName}</strong>,
            </p>
            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 12px;">
              Nous avons bien reçu votre dossier de vérification KYB. Notre équipe de conformité l'examine attentivement et vous contactera dans les meilleurs délais.
            </p>
            <div style="background:#fff8e1;border-left:4px solid #f59e0b;border-radius:4px;padding:16px 20px;margin:0 0 24px;">
              <p style="margin:0 0 8px;font-size:13px;color:#78350f;font-weight:bold;">Délai de traitement estimé</p>
              <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                <strong>24 à 72 heures ouvrables</strong> à partir de la réception de votre dossier.<br>
                Vous recevrez une notification dès que votre dossier sera validé ou si des informations complémentaires sont nécessaires.
              </p>
            </div>
            <div style="background:#f0faf4;border-left:4px solid #1a7a3c;border-radius:4px;padding:16px 20px;margin:0 0 24px;">
              <p style="margin:0;font-size:13px;color:#1a5c2e;line-height:1.8;">
                <strong>Pendant l'examen de votre dossier :</strong><br>
                - Votre environnement sandbox reste disponible pour tester votre intégration<br>
                - Assurez-vous que vos documents soient lisibles et à jour<br>
                - Vérifiez votre boîte email pour toute demande complémentaire de notre part
              </p>
            </div>
            <p style="color:#777;font-size:13px;line-height:1.6;margin:0 0 8px;">
              Des questions ? Contactez notre équipe KYB : <a href="mailto:support@drimpay.com" style="color:#1a7a3c;">support@drimpay.com</a>
            </p>
          </td>
        </tr>
        ${footer}
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

export async function sendKybApprovedEmail(opts: {
  to: string;
  companyName: string;
}): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "RESEND_API_KEY non configuré" };

  const footer = await buildEmailFooter();

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject: "Votre dossier KYB a été approuvé — Bienvenue en production !",
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
                Générer vos clés API de production<br>
                Accepter des paiements Mobile Money en production<br>
                Suivre vos transactions en temps réel sur le tableau de bord<br>
                Encaisser dans les pays supportés par DrimPay
              </p>
            </div>
            <p style="color:#777;font-size:13px;line-height:1.6;margin:0 0 8px;">
              Des questions ? Contactez notre équipe : <a href="mailto:support@drimpay.com" style="color:#1a7a3c;">support@drimpay.com</a>
            </p>
          </td>
        </tr>
        ${footer}
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
  const resend = getResend();
  if (!resend) return { ok: false, error: "RESEND_API_KEY non configuré" };

  const footer = await buildEmailFooter();

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject: "Dossier KYB — Des corrections sont nécessaires",
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
              <div style="display:inline-block;background:#fee2e2;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;text-align:center;">&#10006;</div>
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
        ${footer}
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

export async function sendContractEmail(opts: {
  to: string;
  merchantName: string;
  contractBuffer: Buffer;
}): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "RESEND_API_KEY non configuré" };

  const footer = await buildEmailFooter();

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject: "Votre contrat DrimPay — Action requise : signature et envoi",
      attachments: [
        {
          filename: `DrimPay_Contrat_${opts.merchantName.replace(/\s+/g, "_")}.docx`,
          content: opts.contractBuffer,
        },
      ],
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
        ${footer}
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
    });

    console.log(`[Mailer] Contrat envoyé à ${opts.to}`);
    return { ok: true };
  } catch (e: any) {
    console.error("[Mailer] Erreur envoi email contrat:", e?.message ?? e);
    return { ok: false, error: e?.message ?? String(e) };
  }
}

// ─── Brevo sender (admin broadcast) ──────────────────────────────────────────

const BREVO_FROM_EMAIL = process.env["BREVO_FROM_EMAIL"] ?? "support@drimpay.com";
const BREVO_FROM_NAME  = "DrimPay";

async function sendViaBrevo(opts: {
  to: string;
  toName: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; quotaExceeded?: boolean; error?: string }> {
  const apiKey = process.env["BREVO_API_KEY"];
  if (!apiKey) return { ok: false, error: "BREVO_API_KEY non configuré" };

  let res: Response;
  try {
    res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify({
        sender:      { name: BREVO_FROM_NAME, email: BREVO_FROM_EMAIL },
        to:          [{ email: opts.to, name: opts.toName }],
        subject:     opts.subject,
        htmlContent: opts.html,
      }),
    });
  } catch (e: any) {
    return { ok: false, error: `Brevo réseau: ${e?.message ?? e}` };
  }

  if (res.ok) return { ok: true };

  let body: any = {};
  try { body = await res.json(); } catch {}

  const msg = (body?.message ?? "").toLowerCase();
  const quotaExceeded =
    res.status === 429 ||
    res.status === 402 ||
    msg.includes("quota")  ||
    msg.includes("limit")  ||
    msg.includes("daily")  ||
    msg.includes("allowance");

  console.warn(`[Brevo] HTTP ${res.status} — ${body?.message ?? "?"}`);
  return { ok: false, quotaExceeded, error: body?.message ?? `HTTP ${res.status}` };
}

function buildBroadcastHtml(merchantName: string, htmlBody: string, footer: string): string {
  return `<!DOCTYPE html>
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
              Bonjour <strong>${merchantName}</strong>,
            </p>
            ${htmlBody}
          </td>
        </tr>
        ${footer}
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

// provider: "brevo" (default) | "resend" (forced fallback for resume)
export async function sendBroadcastEmail(opts: {
  to: string;
  merchantName: string;
  subject: string;
  htmlBody: string;
  provider?: "brevo" | "resend";
}): Promise<{ ok: boolean; quotaExceeded?: boolean; provider?: string; error?: string }> {
  const footer = await buildEmailFooter();
  const html   = buildBroadcastHtml(opts.merchantName, opts.htmlBody, footer);

  // ── Force Resend (resume flow after quota) ────────────────────────────────
  if (opts.provider === "resend") {
    const resend = getResend();
    if (!resend) return { ok: false, error: "RESEND_API_KEY non configuré" };
    try {
      await resend.emails.send({ from: FROM_EMAIL, to: opts.to, subject: opts.subject, html });
      return { ok: true, provider: "resend" };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? String(e) };
    }
  }

  // ── Try Brevo first ───────────────────────────────────────────────────────
  const brevo = await sendViaBrevo({ to: opts.to, toName: opts.merchantName, subject: opts.subject, html });
  if (brevo.ok) return { ok: true, provider: "brevo" };

  // Quota atteint → on remonte l'info au caller (pas de fallback auto)
  if (brevo.quotaExceeded) {
    console.warn(`[Mailer] Brevo quota dépassé pour ${opts.to} — arrêt broadcast.`);
    return { ok: false, quotaExceeded: true, error: brevo.error };
  }

  // Autre erreur Brevo → on tente Resend en fallback silencieux
  console.warn(`[Mailer] Brevo erreur non-quota (${brevo.error}) — fallback Resend pour ${opts.to}`);
  const resend = getResend();
  if (!resend) return { ok: false, error: `Brevo: ${brevo.error} | Resend: clé non configurée` };
  try {
    await resend.emails.send({ from: FROM_EMAIL, to: opts.to, subject: opts.subject, html });
    return { ok: true, provider: "resend-fallback" };
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
  const resend = getResend();
  if (!resend) {
    console.warn("[Mailer] RESEND_API_KEY non configuré — email support ignoré.");
    return { ok: false, error: "RESEND_API_KEY non configuré" };
  }

  const bodyHtml = opts.replyBody.replace(/\n/g, "<br>");
  const footer = await buildEmailFooter();

  try {
    await resend.emails.send({
      from: SUPPORT_EMAIL,
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
        ${footer}
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
  const resend = getResend();
  if (!resend) {
    console.warn("[Mailer] RESEND_API_KEY non configuré — email réinitialisation ignoré.");
    return { ok: false, error: "RESEND_API_KEY non configuré" };
  }

  const footer = await buildEmailFooter();

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject: "Réinitialisation de votre mot de passe DrimPay",
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
            <div style="display:inline-block;background:#fef2f2;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:30px;text-align:center;">&#128272;</div>
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
              Réinitialiser mon mot de passe
            </a>
          </div>
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 18px;margin:0 0 8px;">
            <p style="margin:0;font-size:12px;color:#9a3412;line-height:1.6;">
              Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe reste inchangé.
            </p>
          </div>
        </td></tr>
        ${footer}
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
