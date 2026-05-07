import { Link } from "wouter";
import { useState } from "react";
import {
  ArrowRight, LayoutDashboard, Wallet, Clock, Link2,
  Send, ArrowDownToLine, ShieldCheck, Settings, LogOut,
  ChevronRight, BarChart3, Bell, Search,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════ */
/*  DASHED GRID HERO BACKGROUND                                               */
/* ══════════════════════════════════════════════════════════════════════════ */
const GRID_SVG = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='60' y1='0' x2='0' y2='0' stroke='%23000' stroke-width='0.6' stroke-dasharray='3 5' stroke-opacity='0.10'/%3E%3Cline x1='0' y1='0' x2='0' y2='60' stroke='%23000' stroke-width='0.6' stroke-dasharray='3 5' stroke-opacity='0.10'/%3E%3C/svg%3E")`;

/* ══════════════════════════════════════════════════════════════════════════ */
/*  DESKTOP APP MOCKUP  (Sidebar + KYB form)                                 */
/* ══════════════════════════════════════════════════════════════════════════ */
function DesktopMockup() {
  const navItems = [
    { icon: LayoutDashboard, label: "Vue d'ensemble", active: true, color: "text-[#B5F03C]" },
    { icon: Wallet,          label: "Wallets",         color: "text-blue-500" },
    { icon: Clock,           label: "Historique",      color: "text-slate-400" },
    { icon: Link2,           label: "Liens de Paiement", color: "text-slate-400" },
    { icon: Send,            label: "Paiement de Masse", color: "text-slate-400" },
    { icon: ArrowDownToLine, label: "Reversement",     color: "text-slate-400" },
    { icon: ShieldCheck,     label: "Vérification KYB", color: "text-[#B5F03C]" },
    { icon: Settings,        label: "Paramètres",      color: "text-slate-400" },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl overflow-hidden border border-[#E0DDD6] shadow-2xl bg-white">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#F2F0EA] border-b border-[#E0DDD6]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
        </div>
        <div className="flex-1 mx-4 bg-white rounded-md px-3 py-1 text-xs text-gray-400 font-mono border border-[#E0DDD6] max-w-xs">
          app.drimpay.io/dashboard/kyb
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-400" />
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-[10px] font-bold text-white">
            DA
          </div>
        </div>
      </div>

      {/* App body */}
      <div className="flex h-[520px]">

        {/* ── Sidebar ───────────────────────────────────────────────── */}
        <aside className="w-56 shrink-0 bg-white border-r border-[#F0EDE6] flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-2 px-4 py-4 border-b border-[#F0EDE6]">
            <div className="w-7 h-7 rounded-lg bg-[#B5F03C] flex items-center justify-center font-bold text-[#0f0f0f] text-sm">
              D
            </div>
            <span className="font-bold text-[#0f0f0f] text-sm">DrimPay</span>
            <span className="ml-auto text-[9px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              MARCH
            </span>
          </div>

          {/* User */}
          <div className="flex items-center gap-2.5 px-4 py-3 mx-3 mt-3 bg-gray-50 rounded-xl border border-[#F0EDE6]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              DA
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#0f0f0f] truncate">DARWIN</p>
              <p className="text-[9px] text-gray-400 truncate">attiglosylvain@gmail.com</p>
            </div>
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2 mt-1">
              Principal
            </p>
            {navItems.map(({ icon: Icon, label, active, color }) => (
              <div
                key={label}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-[#B5F03C]/15 text-[#0f0f0f] border-l-2 border-[#B5F03C]"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-[#3a7a00]" : color}`} />
                <span className="truncate">{label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto text-gray-400" />}
              </div>
            ))}

            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2 mt-4">
              Documentation API
            </p>
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 cursor-pointer">
              <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
              <span>API Pay-in</span>
            </div>
          </div>

          {/* Logout */}
          <div className="border-t border-[#F0EDE6] px-3 py-3">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 cursor-pointer">
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </div>
          </div>
        </aside>

        {/* ── Main content: KYB form ─────────────────────────────────── */}
        <main className="flex-1 bg-[#FAFAF7] overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-6">

            {/* Page title */}
            <div className="mb-4">
              <h1 className="text-base font-bold text-[#0f0f0f]">Vérification KYB</h1>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Know Your Business — Complétez les 4 étapes pour activer votre compte production
              </p>
            </div>

            {/* Alert */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
              <div className="w-4 h-4 rounded-full bg-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800">Non soumis</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Soumettez vos documents d'entreprise pour activer les paiements live.
                </p>
              </div>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-0 mb-5">
              {[
                { label: "Entreprise", step: 1, active: true },
                { label: "Représentant", step: 2 },
                { label: "Documents", step: 3 },
                { label: "Contrat", step: 4 },
              ].map((s, i) => (
                <div key={s.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                      s.active
                        ? "border-[#B5F03C] bg-[#B5F03C] text-[#0f0f0f]"
                        : "border-gray-200 bg-white text-gray-400"
                    }`}>
                      {s.step}
                    </div>
                    <span className={`text-[9px] mt-1 font-semibold ${s.active ? "text-[#3a7a00]" : "text-gray-400"}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < 3 && (
                    <div className="flex-1 h-px bg-gray-200 mb-4 -mx-2" />
                  )}
                </div>
              ))}
            </div>

            <p className="text-[10px] text-gray-400 mb-4 font-medium">Étape 1 sur 4 — Entreprise</p>

            {/* Form card */}
            <div className="bg-white rounded-2xl border border-[#E5E3DC] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded bg-[#B5F03C]/20 flex items-center justify-center">
                  <ShieldCheck className="w-3 h-3 text-[#3a7a00]" />
                </div>
                <h2 className="text-xs font-bold text-[#0f0f0f]">Informations de l'entreprise</h2>
              </div>

              <div className="space-y-3">
                {/* Row 1 */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 mb-1 block">
                    Nom légal de l'entreprise <span className="text-red-400">*</span>
                  </label>
                  <div className="border border-[#E5E3DC] rounded-lg px-3 py-2 text-xs text-gray-600 bg-white">
                    ACME SARL
                  </div>
                </div>
                {/* Row 2 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Nom commercial</label>
                    <div className="border border-[#E5E3DC] rounded-lg px-3 py-2 text-xs text-gray-600 bg-white">ACME</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 mb-1 block">
                      Type d'entreprise <span className="text-red-400">*</span>
                    </label>
                    <div className="border border-[#E5E3DC] rounded-lg px-3 py-2 text-xs text-gray-400 bg-white flex items-center justify-between">
                      Sélectionner <ChevronRight className="w-3 h-3 rotate-90" />
                    </div>
                  </div>
                </div>
                {/* Row 3 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 mb-1 block">
                      Numéro RCCM / Registre <span className="text-red-400">*</span>
                    </label>
                    <div className="border border-[#E5E3DC] rounded-lg px-3 py-2 text-xs text-gray-400 bg-white flex items-center gap-1">
                      <span className="text-gray-300">#</span> TG-LOM-2024-B-12345
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 mb-1 block">
                      Numéro fiscal <span className="text-red-400">*</span>
                    </label>
                    <div className="border border-[#E5E3DC] rounded-lg px-3 py-2 text-xs text-gray-400 bg-white flex items-center gap-1">
                      <span className="text-gray-300">#</span> NIF / TIN
                    </div>
                  </div>
                </div>
                {/* Row 4 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 mb-1 block">
                      Pays d'enregistrement <span className="text-red-400">*</span>
                    </label>
                    <div className="border border-[#E5E3DC] rounded-lg px-3 py-2 text-xs text-gray-400 bg-white flex items-center justify-between">
                      Sélectionner un pays <ChevronRight className="w-3 h-3 rotate-90" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 mb-1 block">
                      Ville <span className="text-red-400">*</span>
                    </label>
                    <div className="border border-[#E5E3DC] rounded-lg px-3 py-2 text-xs text-gray-600 bg-white">Lomé</div>
                  </div>
                </div>
                {/* Row 5 */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 mb-1 block">
                    Adresse complète du siège social <span className="text-red-400">*</span>
                  </label>
                  <div className="border border-[#E5E3DC] rounded-lg px-3 py-2 text-xs text-gray-600 bg-white">
                    Avenue de la Victoire, Lomé, Togo
                  </div>
                </div>
                {/* Row 6 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 mb-1 block">
                      Date de création <span className="text-red-400">*</span>
                    </label>
                    <div className="border border-[#E5E3DC] rounded-lg px-3 py-2 text-xs text-gray-400 bg-white flex items-center justify-between">
                      jj/mm/aaaa <ChevronRight className="w-3 h-3 rotate-90" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Site web</label>
                    <div className="border border-[#E5E3DC] rounded-lg px-3 py-2 text-xs text-gray-400 bg-white flex items-center gap-1">
                      <span className="text-gray-300">🌐</span> https://votre-site.com
                    </div>
                  </div>
                </div>
                {/* Description */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 mb-1 block">
                    Description de l'activité <span className="text-red-400">*</span>
                  </label>
                  <div className="border border-[#E5E3DC] rounded-lg px-3 py-2 text-[10px] text-gray-400 bg-white h-12">
                    Décrivez votre activité principale, vos produits/services et le type de transactions...
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end mt-4">
                <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#B5F03C] text-[#0f0f0f] text-xs font-bold hover:bg-[#a8e032] transition-colors">
                  Suivant <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  TICKER                                                                    */
/* ══════════════════════════════════════════════════════════════════════════ */
const TICKER_ITEMS = [
  "Développez vos Revenus.", "Fidélisez vos Clients.", "Accélérez votre Croissance.",
  "Digitalisez vos Paiements.", "Connectez l'Afrique.",
  "Développez vos Revenus.", "Fidélisez vos Clients.", "Accélérez votre Croissance.",
  "Digitalisez vos Paiements.", "Connectez l'Afrique.",
];

function Ticker() {
  return (
    <div className="overflow-hidden py-5 border-t border-b border-[#E5E3DC] bg-[#F5F0E8]">
      <div className="flex gap-10 whitespace-nowrap" style={{ animation: "ticker 30s linear infinite", width: "max-content" }}>
        {TICKER_ITEMS.map((item, i) => (
          <span key={i} className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0f0f0f] shrink-0">
            {item}
            <span className="inline-block mx-5 w-2.5 h-2.5 rounded-full bg-[#B5F03C] align-middle" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  PRODUCTS TAB                                                              */
/* ══════════════════════════════════════════════════════════════════════════ */
const PRODUCTS = [
  { label: "Mobile Money →", title: "Collecte Mobile Money", desc: "Acceptez des paiements depuis Orange Money, Wave, MTN, Airtel Money et bien plus. Une seule intégration, tous les opérateurs.", bg: "bg-[#FF6B35]", dark: false },
  { label: "Cartes Virtuelles →", title: "Cartes Virtuelles Instantanées", desc: "Émettez des cartes virtuelles Visa/Mastercard liées à vos wallets DrimPay pour les achats en ligne et business.", bg: "bg-[#5B5EF5]", dark: false },
  { label: "Paiement par lien →", title: "Liens de Paiement", desc: "Créez des liens de paiement en quelques secondes. Partagez par WhatsApp, SMS ou email. Aucun site web requis.", bg: "bg-[#B5F03C]", dark: true },
  { label: "Mass Payout →", title: "Décaissements Massifs", desc: "Envoyez des paiements en masse à des centaines de destinataires simultanément. Parfait pour les paies et remboursements.", bg: "bg-[#0d0c18]", dark: false },
  { label: "Voir Tout →", title: "Toute la Plateforme", desc: "Découvrez l'ensemble des produits DrimPay : wallets, KYB automatisé, webhooks temps réel, et tableau de bord no-code.", bg: "bg-[#1a6b4a]", dark: false },
];

function ProductsSection() {
  const [active, setActive] = useState(0);
  const p = PRODUCTS[active];
  return (
    <section className="py-24 bg-[#F5F0E8]">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <h2 className="text-3xl md:text-5xl font-extrabold text-[#0f0f0f] mb-14 leading-tight tracking-tight">
          Produits Prêts à l'Emploi
        </h2>
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-1">
            {PRODUCTS.map((prod, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-full text-left px-5 py-4 rounded-2xl font-bold text-lg transition-all ${
                  active === i ? "bg-[#0f0f0f] text-white shadow-lg" : "text-[#0f0f0f] hover:bg-white/60"
                }`}
              >
                {prod.label}
              </button>
            ))}
          </div>
          <div className={`rounded-3xl ${p.bg} p-8 min-h-[280px] flex flex-col justify-between shadow-xl`}>
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-6">
                <div className="w-5 h-5 rounded bg-white/60" />
              </div>
              <h3 className={`text-2xl md:text-3xl font-extrabold mb-4 ${p.dark ? "text-[#0f0f0f]" : "text-white"}`}>{p.title}</h3>
              <p className={`text-base leading-relaxed ${p.dark ? "text-[#0f0f0f]/70" : "text-white/70"}`}>{p.desc}</p>
            </div>
            <div className="mt-8">
              <Link href="/signup">
                <button className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
                  p.dark ? "bg-[#0f0f0f] text-white hover:bg-[#0f0f0f]/80" : "bg-white text-[#0f0f0f] hover:bg-white/90"
                }`}>
                  Commencer <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  DARK STACK SECTION                                                        */
/* ══════════════════════════════════════════════════════════════════════════ */
function StackSection() {
  return (
    <section className="py-28 bg-[#0d0c18] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: "linear-gradient(rgba(181,240,60,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(181,240,60,0.6) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />
      <div className="max-w-6xl mx-auto px-6 md:px-10 relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Une stack moderne<br />pour les entreprises modernes
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
            DrimPay fournit des APIs et SDKs qui vous permettent de vous concentrer sur vos expériences clients sans soucis d'infrastructure.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: "⚡", badge: "GraphQL API", title: "GraphQL API", desc: "Nos APIs GraphQL, REST et SDKs vous permettent de construire des interfaces et d'automatiser des workflows pour accélérer votre time-to-market.", code: `query GetBalance {\n  wallet(id: "w_xyz") {\n    balance\n    currency\n  }\n}` },
            { icon: "🔔", badge: "Webhooks", title: "Notifications & Webhooks", desc: "Synchronisez votre plateforme avec les événements DrimPay en temps réel grâce à nos webhooks et notifications automatiques.", code: `{\n  "event": "payment.success",\n  "amount": 45000,\n  "currency": "XOF"\n}` },
            { icon: "📊", badge: "No-Code", title: "Dashboard No-Code", desc: "Le Dashboard DrimPay vous permet de gérer vos finances, transactions et clients sans écrire une seule ligne de code.", code: `Dashboard · Analytiques\nTransactions · Wallets\nPaiements · API Keys\nKYB · Équipe` },
          ].map((item, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#B5F03C]/40 transition-colors">
              <div className="text-3xl mb-4">{item.icon}</div>
              <div className="inline-block px-2 py-0.5 rounded-full bg-[#B5F03C]/15 text-[#B5F03C] text-[10px] font-bold tracking-wider mb-4">{item.badge}</div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-5">{item.desc}</p>
              <div className="bg-black/40 rounded-xl p-3 font-mono text-[11px] text-[#B5F03C]/80 leading-relaxed whitespace-pre">{item.code}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                                 */
/* ══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans">

      {/* Global CSS */}
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-[#F8F6F1]"
        style={{
          backgroundImage: GRID_SVG,
          backgroundSize: "60px 60px",
          paddingTop: "140px",
          paddingBottom: "80px",
        }}
      >
        {/* Radial glow center — light, not dark */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(181,240,60,0.18) 0%, transparent 70%)",
          }}
        />

        <div className="max-w-5xl mx-auto px-6 md:px-10 relative text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E5E3DC] shadow-sm mb-8">
            <span className="flex h-2 w-2 rounded-full bg-[#B5F03C] animate-pulse" />
            <span className="text-xs font-semibold text-[#3a7a00]">API v2.0 maintenant disponible</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-[#0f0f0f] leading-[1.02] tracking-tight mb-6 max-w-4xl mx-auto">
            La Plateforme de Paiement{" "}
            <span className="relative inline-block">
              Moderne
              <span
                className="absolute -bottom-1 left-0 w-full h-2 rounded-full opacity-60"
                style={{ background: "linear-gradient(90deg, #B5F03C, #5AEADC)" }}
              />
            </span>
            {" "}pour l'Afrique
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-[#0f0f0f]/55 max-w-2xl mx-auto mb-10 leading-relaxed">
            Lancez et faites évoluer vos produits financiers sur une seule plateforme : mobile money, cartes virtuelles, paiements instantanés et ledger en temps réel. Commencez là où vous voulez, grandissez sans limites.
          </p>

          {/* CTAs — centered */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link href="/signup">
              <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#0f0f0f] text-white font-semibold text-sm hover:bg-[#0f0f0f]/85 transition-all shadow-lg">
                Explorer la Plateforme
              </button>
            </Link>
            <Link href="/contact">
              <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white border border-[#E0DDD6] text-[#0f0f0f] font-semibold text-sm hover:shadow-md transition-all">
                Parler à un Expert
              </button>
            </Link>
          </div>

          {/* Learn more */}
          <Link href="/how-it-works">
            <button className="text-sm text-[#0f0f0f]/45 hover:text-[#0f0f0f]/70 transition-colors flex items-center gap-1 mx-auto mb-14">
              En savoir plus
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </Link>

          {/* Desktop app mockup */}
          <DesktopMockup />
        </div>
      </section>

      {/* ── OPERATOR LOGOS ───────────────────────────────────────────── */}
      <section className="py-10 bg-white border-b border-[#E5E3DC]">
        <div className="max-w-5xl mx-auto px-6 md:px-10 flex flex-col items-center gap-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Opérateurs connectés</p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {["🟠 Orange Money", "🌊 Wave", "📱 MTN", "✈️ Airtel Money", "💙 Moov"].map((op, i) => (
              <span key={i} className="text-sm font-bold text-[#0f0f0f]/60 bg-[#F5F0E8] px-4 py-2 rounded-full border border-[#E5E3DC]">
                {op}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── BETTER WAY ───────────────────────────────────────────────── */}
      <section className="py-24 bg-[#F5F0E8]">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#0f0f0f] leading-tight tracking-tight mb-6">
                Une meilleure façon<br />de lancer un<br />produit de paiement
              </h2>
              <Link href="/how-it-works">
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0f0f0f] text-white font-semibold text-sm hover:bg-[#0f0f0f]/85 transition-all shadow-md">
                  En savoir plus <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
            <div>
              <p className="text-base text-[#0f0f0f]/55 leading-relaxed mb-8">
                DrimPay regroupe les intégrations aux opérateurs mobiles, la conformité et votre expérience client en un seul endroit. De la mise en service à la croissance, DrimPay vous permet de vous concentrer sur la construction de produits remarquables.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "💳", title: "Cartes virtuelles",   desc: "Émettez des cartes Visa liées à vos wallets pour les paiements en ligne." },
                  { icon: "📡", title: "Webhooks temps réel", desc: "Soyez notifié à chaque événement de paiement instantanément." },
                  { icon: "🏦", title: "Multi-devises",       desc: "Gérez des soldes en XOF, XAF, NGN, GHS et plus encore." },
                  { icon: "🔐", title: "KYB automatisé",      desc: "Vérification d'identité d'entreprise sans friction." },
                  { icon: "📊", title: "Analytiques",         desc: "Tableaux de bord temps réel pour suivre vos performances." },
                  { icon: "🛡️", title: "Sécurité bancaire",  desc: "Chiffrement de bout en bout et conformité PCI-DSS." },
                ].map((f, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-[#e5e3dc] p-5 hover:shadow-md transition-shadow">
                    <div className="text-2xl mb-3">{f.icon}</div>
                    <h4 className="font-bold text-sm text-[#0f0f0f] mb-1">{f.title}</h4>
                    <p className="text-xs text-[#0f0f0f]/50 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAKE IT YOUR OWN ─────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 md:px-10 text-center">
          <h2 className="text-4xl md:text-6xl font-extrabold text-[#0f0f0f] leading-tight tracking-tight mb-4">
            Faites-en le Vôtre
          </h2>
          <p className="text-base md:text-lg text-[#0f0f0f]/55 max-w-xl mx-auto mb-14 leading-relaxed">
            Mettez votre marque entre les mains de vos clients. DrimPay vous permet de gérer chaque expérience de paiement — votre marque, vos couleurs, votre identité.
          </p>
          {/* Card stack */}
          <div className="relative flex items-center justify-center h-48 mb-8">
            {[
              { bg: "bg-[#5B5EF5]", label: "Business Premium", style: { transform: "rotate(-8deg) translateX(-80px) translateY(8px)", position: "absolute" as const } },
              { bg: "bg-[#1a6b4a]", label: "Carte Enterprise",  style: { transform: "rotate(7deg) translateX(80px) translateY(8px)", position: "absolute" as const } },
              { bg: "bg-[#B5F03C]", label: "Carte Standard",    style: { transform: "translateY(-8px)", position: "relative" as const, zIndex: 10 } },
            ].map((c, i) => (
              <div
                key={i}
                className={`w-48 h-28 rounded-2xl ${c.bg} p-4 flex flex-col justify-between shadow-xl`}
                style={c.style}
              >
                <div className="flex justify-between items-start">
                  <div className="w-6 h-4 rounded bg-white/30" />
                  <span className="text-white/70 text-[9px] font-bold tracking-widest">DRIMPAY</span>
                </div>
                <div>
                  <p className="text-white text-[10px] font-mono tracking-widest opacity-60">•••• 4242</p>
                  <p className="text-white text-[9px] mt-0.5 opacity-50">{c.label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="inline-flex items-center gap-2 bg-[#F5F0E8] border border-[#e5e3dc] rounded-full px-4 py-2 mb-8">
            <span className="text-lg">✋</span>
            <span className="text-xs font-semibold text-[#0f0f0f]/60">Marque blanche disponible</span>
          </div>
          <div>
            <Link href="/signup">
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0f0f0f] text-white font-semibold text-sm hover:bg-[#0f0f0f]/85 transition-all shadow-md">
                Personnaliser votre expérience <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ─────────────────────────────────────────────────── */}
      <ProductsSection />

      {/* ── STACK ────────────────────────────────────────────────────── */}
      <StackSection />

      {/* ── TWO CTA CARDS ────────────────────────────────────────────── */}
      <section className="py-24 bg-[#F5F0E8]">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-[#e5e3dc] p-8 hover:shadow-lg transition-shadow group">
              <div className="w-14 h-14 rounded-2xl bg-[#B5F03C] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">🚀</div>
              <h3 className="text-2xl font-extrabold text-[#0f0f0f] mb-3">Planifiez votre Lancement</h3>
              <p className="text-sm text-[#0f0f0f]/55 leading-relaxed mb-6">
                Notre équipe d'experts vous accompagne à chaque étape — de l'intégration à la mise en production.
              </p>
              <Link href="/contact">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0f0f0f] text-white font-semibold text-sm hover:bg-[#0f0f0f]/85 transition-all">
                  Planifier un appel <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
            <div className="bg-[#0d0c18] rounded-3xl border border-white/10 p-8 hover:shadow-lg transition-shadow group">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">🔄</div>
              <h3 className="text-2xl font-extrabold text-white mb-3">Migrer vers DrimPay</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                Vous utilisez déjà un autre prestataire ? Notre équipe migration prend en charge l'intégralité du transfert.
              </p>
              <Link href="/contact">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B5F03C] text-[#0f0f0f] font-semibold text-sm hover:bg-[#B5F03C]/90 transition-all">
                  Démarrer la migration <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOG ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="flex items-end justify-between mb-10">
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#0f0f0f] leading-tight tracking-tight">
              Lire les Dernières Nouvelles
            </h2>
            <Link href="/blog">
              <button className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#e0ddd5] bg-[#F5F0E8] text-[#0f0f0f] font-semibold text-sm hover:shadow-md transition-all">
                Voir tout <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { tag: "Produit",     title: "DrimPay lance les cartes virtuelles pour les entreprises en Afrique de l'Ouest", date: "7 mai 2026",    bg: "bg-[#5B5EF5]" },
              { tag: "Intégration", title: "Comment intégrer Orange Money en moins de 30 minutes avec DrimPay",               date: "2 mai 2026",    bg: "bg-[#FF6B35]" },
              { tag: "Croissance",  title: "DrimPay traite désormais 10 milliards XOF par mois en transactions",              date: "28 avril 2026", bg: "bg-[#B5F03C]" },
              { tag: "Guide",       title: "Comprendre le KYB automatisé et la conformité fintech en Afrique",                date: "21 avril 2026", bg: "bg-[#0d0c18]" },
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#e5e3dc] overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
                <div className={`h-32 ${card.bg} flex items-center justify-center`}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/30" />
                    <span className="text-white font-bold text-sm">DrimPay</span>
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-[10px] font-semibold text-[#3a7a00] uppercase tracking-wider bg-[#B5F03C]/20 px-2 py-0.5 rounded-full">{card.tag}</span>
                  <h4 className="font-bold text-sm text-[#0f0f0f] mt-2 mb-2 leading-snug group-hover:opacity-70 transition-opacity">{card.title}</h4>
                  <p className="text-[10px] text-gray-400">{card.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TICKER ───────────────────────────────────────────────────── */}
      <Ticker />
    </div>
  );
}
