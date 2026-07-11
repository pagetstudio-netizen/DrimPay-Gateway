import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, CreditCard, QrCode, Send, Link2, CheckCircle2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useSEO, webPageSchema, SITE_URL } from "@/lib/seo";
import type { ReactNode } from "react";

type ProductConfig = {
  slug: string;
  icon: ReactNode;
  badgeFr: string; badgeEn: string;
  titleFr: string; titleEn: string;
  subFr: string; subEn: string;
  metaTitleFr: string; metaTitleEn: string;
  metaDescFr: string; metaDescEn: string;
  keywordsFr: string; keywordsEn: string;
  featuresFr: { title: string; desc: string }[];
  featuresEn: { title: string; desc: string }[];
  howFr: string[]; howEn: string[];
};

function ProductPage({ config }: { config: ProductConfig }) {
  const lang = useLang();
  const t = lang === "fr";
  useSEO({
    title: t ? config.metaTitleFr : config.metaTitleEn,
    description: t ? config.metaDescFr : config.metaDescEn,
    keywords: t ? config.keywordsFr : config.keywordsEn,
    jsonLd: [
      webPageSchema(
        `${SITE_URL}/${lang}/${config.slug}`,
        t ? config.titleFr : config.titleEn,
        t ? config.metaDescFr : config.metaDescEn,
        [{ name: t ? config.titleFr : config.titleEn, url: `${SITE_URL}/${lang}/${config.slug}` }],
      ),
    ],
  });

  const features = t ? config.featuresFr : config.featuresEn;
  const how = t ? config.howFr : config.howEn;

  return (
    <div className="bg-[#F8F6F1] pt-32 pb-24">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#B5F03C]/20 border border-[#B5F03C]/30 mb-6 text-xs font-semibold text-[#3a7a00]">
            {config.icon} {t ? config.badgeFr : config.badgeEn}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6 text-[#0f0f0f] leading-[1.02]">
            {t ? config.titleFr : config.titleEn}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            {t ? config.subFr : config.subEn}
          </p>
          <div className="flex flex-wrap gap-4 mb-16">
            <Link href={`/${lang}/signup`} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0f0f0f] text-white font-semibold hover:bg-black/80 transition-colors">
              {t ? "Créer un compte" : "Create an account"} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href={`/${lang}/docs`} className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-black/10 font-semibold hover:bg-black/5 transition-colors">
              {t ? "Voir la documentation API" : "View API documentation"}
            </Link>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="p-6 rounded-2xl bg-white border border-black/5"
            >
              <CheckCircle2 className="w-5 h-5 text-[#3a7a00] mb-3" />
              <h3 className="font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="rounded-2xl bg-white border border-black/5 p-8">
          <h2 className="text-xl font-bold mb-5">{t ? "Comment ça marche" : "How it works"}</h2>
          <ol className="flex flex-col gap-4">
            {how.map((step, i) => (
              <li key={i} className="flex gap-4 items-start">
                <span className="w-7 h-7 shrink-0 rounded-full bg-[#0f0f0f] text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span className="text-sm text-muted-foreground leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export function VirtualCardsPage() {
  return (
    <ProductPage
      config={{
        slug: "cartes-virtuelles",
        icon: <CreditCard className="w-3 h-3" />,
        badgeFr: "Cartes Virtuelles", badgeEn: "Virtual Cards",
        titleFr: "Cartes Virtuelles Instantanées Visa & Mastercard", titleEn: "Instant Virtual Visa & Mastercard Cards",
        subFr: "Émettez des cartes virtuelles Visa et Mastercard liées à vos wallets DrimPay en quelques secondes. Payez vos abonnements, achats en ligne et dépenses professionnelles sans compte bancaire traditionnel.",
        subEn: "Issue Visa and Mastercard virtual cards linked to your DrimPay wallets in seconds. Pay for subscriptions, online purchases and business expenses without a traditional bank account.",
        metaTitleFr: "Carte Virtuelle Visa/Mastercard en Afrique — DrimPay",
        metaTitleEn: "Virtual Visa/Mastercard Card in Africa — DrimPay",
        metaDescFr: "Créez une carte virtuelle Visa ou Mastercard instantanément avec DrimPay. Rechargez depuis Mobile Money et payez en ligne partout dans le monde, en toute sécurité.",
        metaDescEn: "Create a Visa or Mastercard virtual card instantly with DrimPay. Top up from Mobile Money and pay online anywhere in the world, securely.",
        keywordsFr: "carte virtuelle Afrique, carte Visa virtuelle, carte Mastercard virtuelle, carte prépayée en ligne Togo",
        keywordsEn: "virtual card Africa, virtual Visa card, virtual Mastercard, prepaid online card Togo",
        featuresFr: [
          { title: "Émission instantanée", desc: "Créez une carte virtuelle en moins d'une minute depuis votre tableau de bord DrimPay." },
          { title: "Rechargeable en Mobile Money", desc: "Alimentez votre carte directement depuis Orange Money, MTN, Moov ou Wave." },
          { title: "Acceptée mondialement", desc: "Payez sur n'importe quel site acceptant Visa ou Mastercard, sans restriction géographique." },
          { title: "Contrôle total", desc: "Gelez, limitez ou supprimez votre carte à tout moment depuis l'application." },
        ],
        featuresEn: [
          { title: "Instant issuance", desc: "Create a virtual card in under a minute from your DrimPay dashboard." },
          { title: "Top up with Mobile Money", desc: "Fund your card directly from Orange Money, MTN, Moov or Wave." },
          { title: "Accepted worldwide", desc: "Pay on any site accepting Visa or Mastercard, with no geographic restriction." },
          { title: "Full control", desc: "Freeze, limit or delete your card anytime from the app." },
        ],
        howFr: [
          "Créez un compte DrimPay et complétez la vérification KYB (comptes business) ou KYC (comptes personnels).",
          "Rechargez votre wallet DrimPay via Mobile Money.",
          "Émettez une carte virtuelle Visa ou Mastercard depuis votre tableau de bord.",
          "Utilisez le numéro de carte pour payer en ligne partout dans le monde.",
        ],
        howEn: [
          "Create a DrimPay account and complete KYB verification (business accounts) or KYC (personal accounts).",
          "Top up your DrimPay wallet via Mobile Money.",
          "Issue a Visa or Mastercard virtual card from your dashboard.",
          "Use the card number to pay online anywhere in the world.",
        ],
      }}
    />
  );
}

export function QrPaymentPage() {
  return (
    <ProductPage
      config={{
        slug: "paiement-qr-code",
        icon: <QrCode className="w-3 h-3" />,
        badgeFr: "Pay with QR", badgeEn: "Pay with QR",
        titleFr: "Paiement par QR Code Mobile Money", titleEn: "Mobile Money QR Code Payment",
        subFr: "Imprimez un QR code et collez-le en boutique, au restaurant ou sur votre stand. Vos clients scannent et paient instantanément par Mobile Money — sans application à installer, sans terminal de paiement.",
        subEn: "Print a QR code and place it in your shop, restaurant or stand. Your customers scan and pay instantly via Mobile Money — no app to install, no payment terminal needed.",
        metaTitleFr: "Paiement par QR Code Mobile Money en Afrique — DrimPay",
        metaTitleEn: "Mobile Money QR Code Payment in Africa — DrimPay",
        metaDescFr: "Acceptez des paiements Mobile Money par QR code avec DrimPay. Imprimez, collez, encaissez — sans terminal de paiement physique. Idéal pour commerçants et restaurants.",
        metaDescEn: "Accept Mobile Money payments by QR code with DrimPay. Print, stick, get paid — no physical payment terminal needed. Ideal for merchants and restaurants.",
        keywordsFr: "paiement QR code Afrique, QR code Mobile Money, encaisser sans terminal, paiement commerçant Togo",
        keywordsEn: "QR code payment Africa, Mobile Money QR code, cashless payment no terminal, merchant payment Togo",
        featuresFr: [
          { title: "Sans matériel", desc: "Aucun terminal de paiement physique requis — un simple QR code imprimé suffit." },
          { title: "Multi-opérateurs", desc: "Vos clients paient depuis Orange Money, MTN, Moov, Wave et plus, en scannant le même code." },
          { title: "Montant fixe ou libre", desc: "Générez des QR codes à montant fixe pour un produit, ou à montant libre pour les dons et pourboires." },
          { title: "Notification instantanée", desc: "Recevez une confirmation immédiate dès que le client valide le paiement sur son téléphone." },
        ],
        featuresEn: [
          { title: "No hardware needed", desc: "No physical payment terminal required — a simple printed QR code is enough." },
          { title: "Multi-operator", desc: "Your customers pay from Orange Money, MTN, Moov, Wave and more by scanning the same code." },
          { title: "Fixed or open amount", desc: "Generate fixed-amount QR codes for a product, or open-amount codes for donations and tips." },
          { title: "Instant notification", desc: "Get immediate confirmation as soon as the customer confirms payment on their phone." },
        ],
        howFr: [
          "Créez votre compte DrimPay et connectez un wallet actif.",
          "Générez un QR code de paiement depuis votre tableau de bord (montant fixe ou libre).",
          "Imprimez-le et affichez-le en caisse, au comptoir ou sur votre stand.",
          "Le client scanne avec son téléphone, choisit son opérateur Mobile Money et confirme le paiement.",
        ],
        howEn: [
          "Create your DrimPay account and connect an active wallet.",
          "Generate a payment QR code from your dashboard (fixed or open amount).",
          "Print it and display it at the till, counter or stand.",
          "The customer scans with their phone, chooses their Mobile Money operator and confirms payment.",
        ],
      }}
    />
  );
}

export function MassPayoutPage() {
  return (
    <ProductPage
      config={{
        slug: "mass-payout",
        icon: <Send className="w-3 h-3" />,
        badgeFr: "Mass Payout", badgeEn: "Mass Payout",
        titleFr: "Décaissements Massifs Mobile Money", titleEn: "Mass Mobile Money Payouts",
        subFr: "Envoyez des paiements en masse à des centaines de destinataires simultanément — paies, commissions agents, remboursements clients — en un seul lot via l'API ou le tableau de bord DrimPay.",
        subEn: "Send bulk payments to hundreds of recipients at once — payroll, agent commissions, customer refunds — in a single batch via the DrimPay API or dashboard.",
        metaTitleFr: "Décaissement Massif Mobile Money (Mass Payout) — DrimPay",
        metaTitleEn: "Mass Mobile Money Payout — DrimPay",
        metaDescFr: "Automatisez vos paies et remboursements en masse vers Orange Money, MTN, Moov et Wave avec l'API Mass Payout de DrimPay. Un seul fichier, des centaines de paiements.",
        metaDescEn: "Automate bulk payroll and refunds to Orange Money, MTN, Moov and Wave with DrimPay's Mass Payout API. One file, hundreds of payments.",
        keywordsFr: "mass payout Afrique, paiement de masse Mobile Money, paie en ligne Togo, décaissement en lot API",
        keywordsEn: "mass payout Africa, bulk Mobile Money payment, online payroll Togo, batch disbursement API",
        featuresFr: [
          { title: "Paiement en lot", desc: "Envoyez à des centaines de bénéficiaires en une seule requête API ou un seul import CSV." },
          { title: "Suivi en temps réel", desc: "Suivez le statut de chaque paiement individuel du lot : réussi, en attente ou échoué." },
          { title: "Webhooks automatiques", desc: "Recevez une notification pour chaque transaction traitée, sans avoir à interroger l'API." },
          { title: "Protection anti-double-débit", desc: "Le wallet ne peut jamais aller en négatif grâce au verrouillage transactionnel de DrimPay." },
        ],
        featuresEn: [
          { title: "Batch payments", desc: "Send to hundreds of recipients in a single API request or CSV import." },
          { title: "Real-time tracking", desc: "Track the status of each individual payment in the batch: success, pending, or failed." },
          { title: "Automatic webhooks", desc: "Get notified for every processed transaction, without polling the API." },
          { title: "Overdraft protection", desc: "The wallet can never go negative thanks to DrimPay's transactional row locking." },
        ],
        howFr: [
          "Créez un compte professionnel et complétez la vérification KYB.",
          "Approvisionnez votre wallet DrimPay au montant total du lot.",
          "Envoyez la liste des bénéficiaires via l'API /v2/payout/mass ou le tableau de bord.",
          "Suivez le traitement en temps réel et recevez les webhooks de confirmation.",
        ],
        howEn: [
          "Create a business account and complete KYB verification.",
          "Fund your DrimPay wallet with the total batch amount.",
          "Send the list of recipients via the /v2/payout/mass API or the dashboard.",
          "Track processing in real time and receive confirmation webhooks.",
        ],
      }}
    />
  );
}

export function PaymentLinksPage() {
  return (
    <ProductPage
      config={{
        slug: "liens-de-paiement",
        icon: <Link2 className="w-3 h-3" />,
        badgeFr: "Liens de Paiement", badgeEn: "Payment Links",
        titleFr: "Liens de Paiement Mobile Money", titleEn: "Mobile Money Payment Links",
        subFr: "Créez un lien de paiement en quelques secondes et partagez-le par WhatsApp, SMS ou email. Vos clients paient en un clic par Mobile Money — aucun site web requis.",
        subEn: "Create a payment link in seconds and share it via WhatsApp, SMS or email. Your customers pay in one click via Mobile Money — no website required.",
        metaTitleFr: "Lien de Paiement Mobile Money — DrimPay",
        metaTitleEn: "Mobile Money Payment Link — DrimPay",
        metaDescFr: "Créez et partagez des liens de paiement Mobile Money par WhatsApp, SMS ou email avec DrimPay. Aucun site requis, encaissement en quelques secondes.",
        metaDescEn: "Create and share Mobile Money payment links via WhatsApp, SMS or email with DrimPay. No website required, get paid in seconds.",
        keywordsFr: "lien de paiement Afrique, payment link Mobile Money, vendre sans site web Togo, encaissement WhatsApp",
        keywordsEn: "payment link Africa, Mobile Money payment link, sell without a website Togo, WhatsApp checkout",
        featuresFr: [
          { title: "Aucun site requis", desc: "Vendez sur les réseaux sociaux, WhatsApp ou par SMS sans avoir besoin d'une boutique en ligne." },
          { title: "Montant fixe ou libre", desc: "Créez des liens pour un produit précis ou pour des montants variables." },
          { title: "Personnalisable", desc: "Ajoutez votre logo, une description et une image produit à votre page de paiement." },
          { title: "Réutilisable ou unique", desc: "Générez un lien permanent pour un produit récurrent, ou un lien à usage unique par commande." },
        ],
        featuresEn: [
          { title: "No website required", desc: "Sell on social media, WhatsApp or by SMS without needing an online store." },
          { title: "Fixed or open amount", desc: "Create links for a specific product or for variable amounts." },
          { title: "Customizable", desc: "Add your logo, a description and a product image to your payment page." },
          { title: "Reusable or one-time", desc: "Generate a permanent link for a recurring product, or a single-use link per order." },
        ],
        howFr: [
          "Créez votre compte DrimPay et connectez un wallet actif.",
          "Créez un lien de paiement depuis le tableau de bord (montant, description, image).",
          "Partagez le lien par WhatsApp, SMS, email ou réseaux sociaux.",
          "Le client clique, choisit son opérateur Mobile Money et paie en quelques secondes.",
        ],
        howEn: [
          "Create your DrimPay account and connect an active wallet.",
          "Create a payment link from the dashboard (amount, description, image).",
          "Share the link via WhatsApp, SMS, email or social media.",
          "The customer clicks, chooses their Mobile Money operator and pays in seconds.",
        ],
      }}
    />
  );
}
