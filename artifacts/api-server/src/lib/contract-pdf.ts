import PDFDocument from "pdfkit";

export interface ContractData {
  companyLegalName?: string;
  tradeName?: string;
  businessType?: string;
  incorporationCountry?: string;
  city?: string;
  businessAddress?: string;
  registrationNumber?: string;
  taxNumber?: string;
  foundingDate?: string;
  legalRepName?: string;
  legalRepPosition?: string;
  legalRepNationality?: string;
  contractEmail?: string;
  contractSignedAt?: Date;
  signatureDataUrl?: string;
}

const ACCENT = "#1a7a3c";
const LIGHT_GRAY = "#f5f5f5";
const DARK = "#111111";
const MID = "#555555";

function field(doc: PDFKit.PDFDocument, label: string, value: string | undefined, x: number, y: number, w = 230) {
  doc.fontSize(8).fillColor(MID).text(label, x, y);
  doc.moveTo(x, y + 14).lineTo(x + w, y + 14).strokeColor("#cccccc").lineWidth(0.5).stroke();
  doc.fontSize(9).fillColor(value ? DARK : "#bbbbbb").text(value || "________________________", x, y + 3, { width: w });
}

export async function generateContractPdf(data: ContractData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 45, info: { Title: "Contrat DrimPay", Author: "DrimPay" } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width - 90;

    // ── Header ──────────────────────────────────────────────────────────────────
    doc.rect(45, 40, W, 60).fill(ACCENT);
    doc.fontSize(18).fillColor("#ffffff").font("Helvetica-Bold")
      .text("DrimPay", 65, 55);
    doc.fontSize(9).fillColor("#c5ff4a").font("Helvetica")
      .text("CONTRAT D'ACCÈS AUX SERVICES DE PAIEMENT", 65, 78);
    doc.fontSize(7).fillColor("#ffffff")
      .text("& POLITIQUE D'UTILISATION", 65, 90);

    // contract meta top-right
    const now = data.contractSignedAt ?? new Date();
    doc.fontSize(7).fillColor("#ffffff")
      .text(`Version 2.1  |  Signé le ${now.toLocaleDateString("fr-FR")}`, 45, 82, { width: W, align: "right" });

    let y = 120;

    // ── Section helper ────────────────────────────────────────────────────────
    const section = (title: string) => {
      doc.rect(45, y, W, 18).fill(ACCENT);
      doc.fontSize(9).fillColor("#ffffff").font("Helvetica-Bold")
        .text(title, 55, y + 4, { width: W - 20 });
      y += 24;
    };

    const line = (label: string, value: string | undefined) => {
      const isEven = Math.floor((y - 144) / 14) % 2 === 0;
      if (isEven) doc.rect(45, y - 2, W, 14).fill(LIGHT_GRAY).fillOpacity(0.6);
      doc.fillOpacity(1);
      doc.fontSize(7.5).fillColor(MID).font("Helvetica").text(label, 55, y, { width: 180 });
      doc.fontSize(8).fillColor(DARK).font("Helvetica-Bold")
        .text(value ?? "________________________", 220, y, { width: W - 175 });
      y += 14;
    };

    // ── 1. AGRÉGATEUR ─────────────────────────────────────────────────────────
    section("1. IDENTIFICATION DE L'AGRÉGATEUR DE PAIEMENT");
    line("Nom commercial", "DrimPay");
    line("Représentant légal", "Mr. Mfoupon Alassa Assan — Gérant");
    y += 6;

    // ── 2. MARCHAND ──────────────────────────────────────────────────────────
    section("2. IDENTIFICATION DU MARCHAND");
    line("Nom commercial", data.tradeName || data.companyLegalName);
    line("Nom légal de l'entreprise", data.companyLegalName);
    line("Type d'entreprise", data.businessType);
    line("Pays d'enregistrement", data.incorporationCountry);
    line("Ville", data.city);
    line("Adresse complète", data.businessAddress);
    line("Numéro RCCM / Registre", data.registrationNumber);
    line("Numéro fiscal", data.taxNumber);
    line("Date de création", data.foundingDate);
    line("Représentant légal", data.legalRepName);
    line("Poste", data.legalRepPosition);
    line("Nationalité", data.legalRepNationality);
    line("Email contractuel", data.contractEmail);
    y += 6;

    // ── 3. OBJET ──────────────────────────────────────────────────────────────
    section("3. OBJET DU CONTRAT");
    doc.fontSize(8).fillColor(DARK).font("Helvetica")
      .text(
        "Le présent contrat définit les conditions d'accès, d'utilisation et de production des services de paiement fournis par DrimPay. " +
        "Il encadre l'utilisation des API de paiement, les obligations du marchand, les règles de conformité, les restrictions d'activités et les autorisations spéciales.",
        55, y, { width: W - 20 }
      );
    y += doc.heightOfString(
      "Le présent contrat définit les conditions d'accès, d'utilisation et de production des services de paiement fournis par DrimPay. " +
      "Il encadre l'utilisation des API de paiement, les obligations du marchand, les règles de conformité, les restrictions d'activités et les autorisations spéciales.",
      { width: W - 20 }
    ) + 10;

    // ── 4. SERVICES ──────────────────────────────────────────────────────────
    section("4. SERVICES FOURNIS PAR DRIMPAY");
    const services = [
      "API PayIn (réception de paiements) — Frais : 3%",
      "API Payout (retraits et transferts) — Frais : 3%",
      "PayIn Link (liens de paiement instantané)",
      "Dashboard de gestion marchand",
      "Bulk Payout, cartes virtuelles, Airtime (selon éligibilité)",
    ];
    for (const s of services) {
      doc.fontSize(8).fillColor(DARK).font("Helvetica").text(`• ${s}`, 60, y, { width: W - 25 });
      y += 13;
    }
    y += 4;

    // ── 5. CONDITIONS D'ACCÈS EN PRODUCTION ────────────────────────────────────
    section("5. CONDITIONS D'ACCÈS EN PRODUCTION");
    const conds = [
      "Validation complète du KYB marchand",
      "Vérification de conformité et acceptation du présent contrat",
      "Signature officielle du marchand et validation finale par DrimPay",
      "Délai de traitement KYB : 24h à 72h ouvrables",
    ];
    for (const c of conds) {
      doc.fontSize(8).fillColor(DARK).font("Helvetica").text(`• ${c}`, 60, y, { width: W - 25 });
      y += 13;
    }
    y += 4;

    // ── 6. POLITIQUE D'UTILISATION ─────────────────────────────────────────────
    section("6. POLITIQUE D'UTILISATION — OBLIGATIONS & INTERDICTIONS");
    const policies = [
      "Utilisation uniquement pour des activités légales conformément aux lois locales et internationales.",
      "Toutes les informations fournies doivent être exactes et vérifiables (fausse déclaration = suspension).",
      "Le marchand est responsable de la protection de ses clés API et de ses accès dashboard.",
      "Interdit : fraude, blanchiment, financement illégal, transactions fictives, usurpation d'identité.",
      "Le marchand doit respecter les limites techniques API et les limites de volume de transactions.",
      "Activités soumises à autorisation écrite préalable : jeux d'argent, crypto, services financiers réglementés.",
    ];
    for (const p of policies) {
      doc.fontSize(8).fillColor(DARK).font("Helvetica").text(`• ${p}`, 60, y, { width: W - 25 });
      y += 14;
    }
    y += 4;

    // ── 7. BASE JURIDIQUE ──────────────────────────────────────────────────────
    section("7. BASE JURIDIQUE");
    doc.fontSize(8).fillColor(DARK).font("Helvetica")
      .text(
        "Ce contrat est encadré par : les lois commerciales OHADA, les réglementations bancaires UEMOA/CEMAC, " +
        "les normes AML/CFT internationales, et les principes KYC/KYB. " +
        "En signant, le marchand confirme comprendre et accepter ces obligations légales.",
        55, y, { width: W - 20 }
      );
    y += 44;

    // ── 8. SIGNATURES ─────────────────────────────────────────────────────────
    if (y > 650) { doc.addPage(); y = 50; }

    section("8. SIGNATURES");

    // Left — DrimPay
    const sigBoxW = (W - 20) / 2;
    doc.rect(45, y, sigBoxW, 90).strokeColor("#cccccc").lineWidth(0.5).stroke();
    doc.fontSize(8).fillColor(MID).font("Helvetica").text("Agrégateur de paiement — DrimPay", 55, y + 6);
    doc.fontSize(8).fillColor(DARK).font("Helvetica-Bold").text("Mfoupon Alassa Assan", 55, y + 20);
    doc.fontSize(7.5).fillColor(MID).font("Helvetica").text("Gérant / Représentant légal", 55, y + 32);
    doc.moveTo(55, y + 74).lineTo(55 + sigBoxW - 20, y + 74).strokeColor("#aaaaaa").lineWidth(0.5).stroke();
    doc.fontSize(7).fillColor(MID).text("Signature DrimPay", 55, y + 78);

    // Right — Merchant
    const rx = 45 + sigBoxW + 20;
    doc.rect(rx, y, sigBoxW, 90).strokeColor("#cccccc").lineWidth(0.5).stroke();
    doc.fontSize(8).fillColor(MID).font("Helvetica").text("Marchand", rx + 10, y + 6);
    doc.fontSize(8).fillColor(DARK).font("Helvetica-Bold")
      .text(data.companyLegalName ?? "________________________", rx + 10, y + 20);
    doc.fontSize(7.5).fillColor(MID).font("Helvetica")
      .text(data.legalRepName ?? "________________________", rx + 10, y + 32);
    doc.fontSize(7.5).fillColor(MID).text(`Signé le ${now.toLocaleDateString("fr-FR")} via DrimPay`, rx + 10, y + 44);

    // Signature image if provided
    if (data.signatureDataUrl && data.signatureDataUrl.startsWith("data:image/")) {
      try {
        const base64 = data.signatureDataUrl.replace(/^data:image\/\w+;base64,/, "");
        const imgBuf = Buffer.from(base64, "base64");
        doc.image(imgBuf, rx + 10, y + 50, { width: sigBoxW - 30, height: 22 });
      } catch {}
    }

    doc.moveTo(rx + 10, y + 74).lineTo(rx + sigBoxW - 10, y + 74).strokeColor("#aaaaaa").lineWidth(0.5).stroke();
    doc.fontSize(7).fillColor(MID).text("Signature du représentant légal", rx + 10, y + 78);

    y += 100;

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.fontSize(7).fillColor("#888888")
      .text(
        `Document généré automatiquement par DrimPay — ${now.toLocaleString("fr-FR")} | ` +
        `Valide 7 jours à compter de la date de signature | Version contrat 2.1`,
        45, y, { width: W, align: "center" }
      );

    doc.end();
  });
}
