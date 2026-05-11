import { useEffect, useState } from "react";
import {
  MessageCircle, Youtube, Facebook, ExternalLink,
  Radio, Send, Twitter, Clock, ChevronRight, Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { DashboardLayout } from "./layout";
import supportImg from "@assets/contact-us.1e0b8969a82ca2f9bd2d0b6df0fc7b96_1778539656598.webp";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type SocialLink = {
  id: number;
  name: string;
  platform: string;
  url: string;
  description: string | null;
  active: boolean;
  sortOrder: number;
};

/* ── Platform config ─────────────────────────────────────────────────────── */
const PLATFORM_META: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  accentBg: string;
  label: string;
  badge?: string;
}> = {
  whatsapp_support: {
    icon: MessageCircle,
    accent: "text-emerald-400",
    accentBg: "bg-emerald-500/10 border-emerald-500/20",
    label: "Contacter le support",
    badge: "Support",
  },
  whatsapp_channel: {
    icon: Radio,
    accent: "text-emerald-300",
    accentBg: "bg-emerald-500/10 border-emerald-500/20",
    label: "Rejoindre la chaîne",
    badge: "Chaîne",
  },
  youtube: {
    icon: Youtube,
    accent: "text-red-400",
    accentBg: "bg-red-500/10 border-red-500/20",
    label: "S'abonner",
    badge: "YouTube",
  },
  facebook: {
    icon: Facebook,
    accent: "text-blue-400",
    accentBg: "bg-blue-500/10 border-blue-500/20",
    label: "Suivre la page",
    badge: "Facebook",
  },
  telegram: {
    icon: Send,
    accent: "text-sky-400",
    accentBg: "bg-sky-500/10 border-sky-500/20",
    label: "Rejoindre",
    badge: "Telegram",
  },
  twitter: {
    icon: Twitter,
    accent: "text-slate-300",
    accentBg: "bg-slate-500/10 border-slate-500/20",
    label: "Suivre",
    badge: "Twitter / X",
  },
  other: {
    icon: ExternalLink,
    accent: "text-primary",
    accentBg: "bg-primary/10 border-primary/20",
    label: "Ouvrir",
  },
};

function getMeta(platform: string) {
  return PLATFORM_META[platform] ?? PLATFORM_META.other;
}

/* ── Skeleton loader ─────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-muted/20 animate-pulse" />
      ))}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function DashboardSupport() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`${BASE}/api/dashboard/support/links`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setLinks(Array.isArray(d) ? d : []))
      .catch(() => setLinks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const whatsappSupport = links.find(l => l.platform === "whatsapp_support");
  const communityLinks  = links.filter(l => l.platform !== "whatsapp_support");

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <img src={supportImg} alt="Support" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Support & Communauté
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Contactez notre équipe ou rejoignez la communauté DrimPay
            </p>
          </div>
        </motion.div>

        {/* ── WhatsApp support — featured card ─────────────────────────── */}
        {!loading && whatsappSupport && (
          <motion.a
            href={whatsappSupport.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
            className="group flex items-start gap-5 p-6 rounded-2xl bg-emerald-500/8 border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/12 transition-all duration-200 cursor-pointer block"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <MessageCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-bold tracking-tight text-foreground">
                  {whatsappSupport.name}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  En ligne
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {whatsappSupport.description ?? "Notre équipe répond en moins de 2h. Idéal pour les problèmes d'intégration, les incidents de paiement ou toute question urgente."}
              </p>
              <div className="mt-4 flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <Zap className="w-3.5 h-3.5" />
                  Réponse rapide
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  Disponible 24h/7j
                </span>
              </div>
            </div>
            <div className="shrink-0 flex items-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold group-hover:bg-emerald-400 transition-colors">
                Contacter
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </motion.a>
        )}

        {/* Placeholder si WhatsApp support pas encore configuré */}
        {!loading && !whatsappSupport && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
            className="flex items-start gap-5 p-6 rounded-2xl bg-card border border-border"
          >
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0">
              <MessageCircle className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-foreground mb-1">Support WhatsApp</p>
              <p className="text-sm text-muted-foreground">
                Le lien de support n'est pas encore configuré. Contactez-nous par email à{" "}
                <a href="mailto:support@drimpay.africa" className="text-primary underline underline-offset-2">
                  support@drimpay.africa
                </a>
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Communauté section ────────────────────────────────────────── */}
        {(loading || communityLinks.length > 0) && (
          <div>
            <div className="mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Rejoindre la communauté
              </h2>
            </div>

            {loading ? (
              <Skeleton />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {communityLinks.map((link, i) => {
                  const meta = getMeta(link.platform);
                  const Icon = meta.icon;
                  return (
                    <motion.a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + i * 0.05, duration: 0.35, ease: "easeOut" }}
                      className={`group flex items-center gap-4 p-5 rounded-xl bg-card border hover:border-border/80 hover:bg-card/80 hover:shadow-md transition-all duration-200 cursor-pointer ${meta.accentBg}`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-background/60`}>
                        <Icon className={`w-5 h-5 ${meta.accent}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold tracking-tight text-foreground truncate">
                          {link.name}
                        </p>
                        {link.description ? (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {link.description}
                          </p>
                        ) : meta.badge ? (
                          <p className="text-xs text-muted-foreground mt-0.5">{meta.badge}</p>
                        ) : null}
                      </div>
                      <div className="shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-background/60 text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors`}>
                          {meta.label}
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Vide state ────────────────────────────────────────────────── */}
        {!loading && links.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
              <img src={supportImg} alt="Support" className="w-10 h-10 object-contain opacity-40" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">Aucun lien disponible</p>
            <p className="text-xs text-muted-foreground">
              Les liens de support et de communauté seront affichés ici.
            </p>
          </motion.div>
        )}

        {/* ── Informations utiles ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
          className="grid sm:grid-cols-3 gap-4"
        >
          {[
            {
              icon: Clock,
              title: "Délai de réponse",
              desc: "Moins de 2 heures en moyenne sur WhatsApp pour toute demande urgente.",
            },
            {
              icon: MessageCircle,
              title: "Email support",
              desc: "support@drimpay.africa — pour les demandes non urgentes et les rapports détaillés.",
            },
            {
              icon: Zap,
              title: "Statut de la plateforme",
              desc: "Consultez le statut en temps réel sur status.drimpay.africa.",
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="p-4 rounded-xl bg-card border border-border"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1 tracking-tight">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </motion.div>

      </div>
    </DashboardLayout>
  );
}
