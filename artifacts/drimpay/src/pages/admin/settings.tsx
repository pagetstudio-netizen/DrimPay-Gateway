import { useEffect, useState } from "react";
import { Settings, Save, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AdminLayout } from "./layout";
import { cn } from "@/lib/utils";

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

export default function AdminSettings() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeGroup, setActiveGroup] = useState("fees");

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/admin/settings", { credentials: "include" });
    const d = await r.json();
    setValues(d ?? {});
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/admin/settings", {
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
            <button onClick={save} disabled={saving || loading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 shadow-sm">
              <Save className="w-4 h-4" /> {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
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
          </div>

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
