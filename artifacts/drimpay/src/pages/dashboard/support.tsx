import { useEffect, useState } from "react";
import {
  MessageCircle, Youtube, Facebook, HeadphonesIcon, ExternalLink,
  Wifi, RefreshCw, Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

const PLATFORM_META: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  btnBg: string;
  btnText: string;
  btnHover: string;
  label: string;
}> = {
  whatsapp_support: {
    icon: MessageCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    btnBg: "bg-emerald-500",
    btnText: "text-white",
    btnHover: "hover:bg-emerald-600",
    label: "Ouvrir WhatsApp",
  },
  whatsapp_channel: {
    icon: Radio,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    btnBg: "bg-emerald-600",
    btnText: "text-white",
    btnHover: "hover:bg-emerald-700",
    label: "Rejoindre la chaîne",
  },
  youtube: {
    icon: Youtube,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    btnBg: "bg-red-600",
    btnText: "text-white",
    btnHover: "hover:bg-red-700",
    label: "S'abonner",
  },
  facebook: {
    icon: Facebook,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    btnBg: "bg-blue-600",
    btnText: "text-white",
    btnHover: "hover:bg-blue-700",
    label: "Suivre la page",
  },
  telegram: {
    icon: Wifi,
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-200",
    btnBg: "bg-sky-500",
    btnText: "text-white",
    btnHover: "hover:bg-sky-600",
    label: "Rejoindre",
  },
  twitter: {
    icon: ExternalLink,
    color: "text-gray-700",
    bg: "bg-gray-50",
    border: "border-gray-200",
    btnBg: "bg-gray-900",
    btnText: "text-white",
    btnHover: "hover:bg-gray-800",
    label: "Suivre",
  },
  other: {
    icon: ExternalLink,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    btnBg: "bg-primary",
    btnText: "text-black",
    btnHover: "hover:bg-primary/90",
    label: "Ouvrir",
  },
};

function getMeta(platform: string) {
  return PLATFORM_META[platform] ?? PLATFORM_META.other;
}

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

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <HeadphonesIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Support & Communauté</h1>
            <p className="text-sm text-muted-foreground">Contactez-nous ou rejoignez notre communauté</p>
          </div>
        </div>
      </div>

      {/* Support principale */}
      <div className="mb-8 p-5 rounded-2xl border border-emerald-200 bg-emerald-50/50">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900">Support technique 24h/7j</p>
            <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
              Notre équipe répond en moins de 2h sur WhatsApp. Idéal pour les problèmes d'intégration, les incidents de paiement ou toute question urgente.
            </p>
          </div>
        </div>
      </div>

      {/* Social Links grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <HeadphonesIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucun lien de support disponible pour le moment.</p>
          <p className="text-sm mt-1">Revenez bientôt.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {links.map((link, i) => {
            const meta = getMeta(link.platform);
            const Icon = meta.icon;
            return (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
                className={cn(
                  "rounded-2xl border p-5 flex flex-col gap-4 transition-shadow hover:shadow-md",
                  meta.bg, meta.border
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-white/70")}>
                    <Icon className={cn("w-5 h-5", meta.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-gray-900 truncate">{link.name}</p>
                    {link.description && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{link.description}</p>
                    )}
                  </div>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition-colors",
                    meta.btnBg, meta.btnText, meta.btnHover
                  )}
                >
                  {meta.label}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Refresh */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={load}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualiser
        </button>
      </div>

    </div>
  );
}
