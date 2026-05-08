import { useEffect, useState } from "react";
import {
  Settings, Save, RefreshCw, AlertTriangle, CheckCircle2,
  Send, Bot, Eye, EyeOff, Zap, Search,
} from "lucide-react";
import { AdminLayout } from "./layout";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const SETTINGS_GROUPS = [
  {
    title: "Frais & Commissions",
    key: "fees",
    fields: [
      { key: "payin_fee_percent", label: "Frais Pay-in (%)", type: "number", placeholder: "3", hint: "Commission prélevée sur chaque dépôt" },
      { key: "payout_fee_percent", label: "Frais Pay-out (%)", type: "number", placeholder: "3", hint: "Commission prélevée sur chaque retrait" },
      { key: "min_payin_amount", label: "Montant min Pay-in (XOF)", type: "number", placeholder: "500", hint: "Montant minimum accepté en dépôt" },
      { key: "max_payin_amount", label: "Montant max Pay-in (XOF)", type: "number", placeholder: "500000", hint: "Plafond par transaction de dépôt" },
      { key: "min_payout_amount", label: "Montant min Pay-out (XOF)", type: "number", placeholder: "1000", hint: "Montant minimum pour un retrait" },
      { key: "max_payout_amount", label: "Montant max Pay-out (XOF)", type: "number", placeholder: "1000000", hint: "Plafond par transaction de retrait" },
    ],
  },
  {
    title: "Mode & Environnement",
    key: "mode",
    fields: [
      { key: "maintenance_mode", label: "Mode maintenance global", type: "boolean", hint: "Désactive toutes les transactions sur la plateforme" },
      { key: "sandbox_enabled", label: "Mode sandbox activé", type: "boolean", hint: "Permet les transactions en mode test" },
      { key: "live_enabled", label: "Mode live activé", type: "boolean", hint: "Permet les transactions en production" },
      { key: "new_signup_enabled", label: "Inscriptions ouvertes", type: "boolean", hint: "Autoriser les nouvelles inscriptions marchands" },
    ],
  },
  {
    title: "Webhook & Sécurité",
    key: "webhook",
    fields: [
      { key: "webhook_max_retries", label: "Max tentatives webhook", type: "number", placeholder: "5", hint: "Nombre maximum de retries en cas d'échec" },
      { key: "webhook_retry_interval_min", label: "Intervalle retry (minutes)", type: "number", placeholder: "15", hint: "Délai entre chaque retry de webhook" },
      { key: "api_rate_limit_per_min", label: "Limite API (req/min)", type: "number", placeholder: "100", hint: "Nombre maximum de requêtes API par minute par clé" },
      { key: "session_duration_hours", label: "Durée session (heures)", type: "number", placeholder: "24", hint: "Durée de validité d'une session utilisateur" },
    ],
  },
  {
    title: "Contact & Support",
    key: "contact",
    fields: [
      { key: "support_email", label: "Email support", type: "text", placeholder: "support@drimpay.com", hint: "Email affiché aux marchands pour le support" },
      { key: "support_whatsapp", label: "WhatsApp support", type: "text", placeholder: "+228 XX XX XX XX", hint: "Numéro WhatsApp du support" },
      { key: "platform_name", label: "Nom de la plateforme", type: "text", placeholder: "DrimPay", hint: "Nom affiché dans les emails et l'interface" },
      { key: "platform_country", label: "Pays de la plateforme", type: "text", placeholder: "TG", hint: "Code pays de la plateforme (ISO 2 lettres)" },
    ],
  },
];

function TelegramSection({ allValues }: { allValues: Record<string, string> }) {
  const [token, setToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    if (allValues["telegram_bot_token"]) setToken(allValues["telegram_bot_token"]);
    if (allValues["telegram_chat_id"]) setChatId(allValues["telegram_chat_id"]);
  }, [allValues]);

  const hasConfig = !!allValues["telegram_bot_token"] && !!allValues["telegram_chat_id"];

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const r = await fetch(`${BASE}/api/admin/telegram/save`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, chatId }),
      });
      const d = await r.json();
      if (d.ok) setStatus({ type: "ok", msg: "Configuration sauvegardée !" });
      else setStatus({ type: "err", msg: d.error ?? "Erreur" });
    } catch {
      setStatus({ type: "err", msg: "Erreur réseau" });
    }
    setSaving(false);
  };

  const test = async () => {
    if (!token || !chatId) { setStatus({ type: "err", msg: "Remplis le token et le Chat ID d'abord" }); return; }
    setTesting(true);
    setStatus(null);
    try {
      const r = await fetch(`${BASE}/api/admin/telegram/test`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, chatId }),
      });
      const d = await r.json();
      if (d.ok) setStatus({ type: "ok", msg: "Message test envoyé dans le groupe ✅" });
      else setStatus({ type: "err", msg: d.error ?? "Connexion échouée" });
    } catch {
      setStatus({ type: "err", msg: "Erreur réseau" });
    }
    setTesting(false);
  };

  const detect = async () => {
    if (!token) { setStatus({ type: "err", msg: "Entre le token du bot d'abord" }); return; }
    setDetecting(true);
    setStatus(null);
    try {
      const r = await fetch(`${BASE}/api/admin/telegram/detect?token=${encodeURIComponent(token)}`, {
        credentials: "include",
      });
      const d = await r.json();
      if (d.ok && d.chatId) {
        setChatId(d.chatId);
        setStatus({ type: "ok", msg: `Groupe détecté : ${d.title ?? ""} (${d.chatId})` });
      } else {
        setStatus({ type: "err", msg: d.error ?? "Aucun groupe trouvé" });
      }
    } catch {
      setStatus({ type: "err", msg: "Erreur réseau" });
    }
    setDetecting(false);
  };

  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
          <Bot className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">Bot Telegram</h2>
          <p className="text-xs text-gray-400">Notifications en temps réel dans votre groupe admin</p>
        </div>
        <div className={cn(
          "ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
          hasConfig ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", hasConfig ? "bg-green-500" : "bg-gray-400")} />
          {hasConfig ? "Configuré" : "Non configuré"}
        </div>
      </div>

      {/* Alert list */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-blue-800 mb-2">Alertes envoyées automatiquement :</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-blue-700">
          {["👤 Nouveaux marchands","💰 Paiements reçus (API & liens)","🚨 Gros montants (≥500 000 FCFA)","💸 Demandes de retrait","📋 KYB soumis / approuvés / rejetés","🔐 Connexions admin","🆘 Erreurs système critiques","📊 Rapport quotidien (minuit Lomé)"].map(a => (
            <span key={a}>{a}</span>
          ))}
        </div>
        <p className="text-xs text-blue-600 mt-2">Commandes bot: <code className="bg-blue-100 px-1 rounded">/stats</code> <code className="bg-blue-100 px-1 rounded">/ip</code> <code className="bg-blue-100 px-1 rounded">/help</code></p>
      </div>

      {/* Token */}
      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-1.5">Token du Bot</label>
        <div className="relative">
          <input
            type={showToken ? "text" : "password"}
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="7123456789:AAF..."
            className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={() => setShowToken(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Obtenu via @BotFather sur Telegram</p>
      </div>

      {/* Chat ID */}
      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-1.5">Chat ID du groupe admin</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={chatId}
            onChange={e => setChatId(e.target.value)}
            placeholder="-1001234567890"
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={detect}
            disabled={detecting || !token}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 whitespace-nowrap"
          >
            <Search className="w-4 h-4" />
            {detecting ? "Détection..." : "Détecter"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Pour détecter automatiquement : ajoutez le bot dans le groupe, envoyez un message, puis cliquez "Détecter".
        </p>
      </div>

      {/* Status */}
      {status && (
        <div className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium",
          status.type === "ok" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"
        )}>
          {status.type === "ok" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {status.msg}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={save}
          disabled={saving || (!token && !chatId)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-sm"
        >
          <Save className="w-4 h-4" />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
        <button
          onClick={test}
          disabled={testing || !token || !chatId}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {testing ? "Envoi..." : "Tester la connexion"}
        </button>
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeGroup, setActiveGroup] = useState("fees");

  const load = async () => {
    setLoading(true);
    const r = await fetch(`${BASE}/api/admin/settings`, { credentials: "include" });
    const d = await r.json();
    setValues(d ?? {});
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    await fetch(`${BASE}/api/admin/settings`, {
      method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  };

  const set = (key: string, val: string) => setValues(v => ({ ...v, [key]: val }));
  const get = (key: string, def = "") => values[key] ?? def;

  const currentGroup = SETTINGS_GROUPS.find(g => g.key === activeGroup)!;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
            <p className="text-sm text-gray-500">Configuration globale de la plateforme DrimPay</p>
          </div>
          <div className="flex gap-3">
            {saved && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Enregistré !
              </div>
            )}
            {activeGroup !== "telegram" && (
              <button onClick={save} disabled={saving || loading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 shadow-sm">
                <Save className="w-4 h-4" /> {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            )}
          </div>
        </div>

        {values["maintenance_mode"] === "true" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-800 font-medium">⚠️ Mode maintenance activé — Toutes les transactions sont désactivées</p>
          </div>
        )}

        <div className="flex gap-5">
          <div className="w-52 shrink-0 space-y-1">
            {SETTINGS_GROUPS.map(g => (
              <button key={g.key} onClick={() => setActiveGroup(g.key)}
                className={cn("w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors", activeGroup === g.key ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-gray-600 hover:bg-gray-50")}>
                {g.title}
              </button>
            ))}
            <button onClick={() => setActiveGroup("telegram")}
              className={cn("w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2", activeGroup === "telegram" ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50")}>
              <Bot className="w-4 h-4" /> Telegram Bot
            </button>
          </div>

          {activeGroup === "telegram" ? (
            <TelegramSection allValues={values} />
          ) : (
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-5">{currentGroup.title}</h2>
              {loading ? (
                <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}</div>
              ) : (
                <div className="space-y-5">
                  {currentGroup.fields.map(field => (
                    <div key={field.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-semibold text-gray-700">{field.label}</label>
                        {field.type === "boolean" && (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={get(field.key) === "true"}
                              onChange={e => set(field.key, e.target.checked ? "true" : "false")}
                              className="sr-only peer" />
                            <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                          </label>
                        )}
                      </div>
                      {field.type !== "boolean" && (
                        <input type={field.type} value={get(field.key, "")} onChange={e => set(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      )}
                      <p className="text-xs text-gray-400 mt-1">{field.hint}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <p className="text-sm font-semibold text-yellow-800">Zone dangereuse</p>
          </div>
          <p className="text-xs text-yellow-700 mb-3">Les actions suivantes affectent l'ensemble de la plateforme et sont irréversibles.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => { if (confirm("Activer le mode maintenance ? Toutes les transactions seront bloquées.")) set("maintenance_mode", "true"); }}
              className="px-4 py-2 rounded-xl border border-yellow-300 bg-white text-sm font-medium text-yellow-800 hover:bg-yellow-50 transition-colors">
              Activer maintenance globale
            </button>
            <button onClick={() => { if (confirm("Désactiver le mode maintenance ?")) set("maintenance_mode", "false"); }}
              className="px-4 py-2 rounded-xl border border-green-300 bg-white text-sm font-medium text-green-800 hover:bg-green-50 transition-colors">
              Désactiver maintenance
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
