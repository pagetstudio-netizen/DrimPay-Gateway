import { useEffect, useState } from "react";
import { SupportAuthProvider, SupportLayout } from "./layout";
import { Phone, Mail, Clock, Facebook, Linkedin, Instagram, MessageCircle, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
type Status = "idle" | "loading" | "ok" | "err";

const inputCls = "w-full h-11 rounded-xl bg-gray-800 border border-gray-700 px-4 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#C5FF4A]/50 focus:ring-2 focus:ring-[#C5FF4A]/10 transition-all";

const SOCIAL_ICONS: Record<string, any> = {
  facebook: Facebook, linkedin: Linkedin, instagram: Instagram, telegram: MessageCircle,
  whatsapp: MessageCircle, x: ExternalLink, twitter: ExternalLink,
};

function SettingsContent() {
  const [activeTab, setActiveTab] = useState<"contact" | "socials">("contact");

  const [settings, setSettings] = useState({ support_whatsapp: "", support_email_1: "", support_email_2: "", support_hours: "", support_telegram: "" });
  const [settingsStatus, setSettingsStatus] = useState<Status>("idle");

  const [socials, setSocials] = useState<any[]>([]);
  const [socialsStatus, setSocialsStatus] = useState<Status>("idle");
  const [socialEdits, setSocialEdits] = useState<Record<number, string>>({});

  useEffect(() => {
    fetch(`${BASE}/api/support-admin/settings`, { credentials: "include" })
      .then(r => r.json()).then(d => setSettings(s => ({ ...s, ...d }))).catch(() => {});
    fetch(`${BASE}/api/support-admin/socials`, { credentials: "include" })
      .then(r => r.json()).then(links => { setSocials(links); const edits: Record<number, string> = {}; links.forEach((l: any) => { edits[l.id] = l.url; }); setSocialEdits(edits); }).catch(() => {});
  }, []);

  const saveSettings = async () => {
    setSettingsStatus("loading");
    try {
      const r = await fetch(`${BASE}/api/support-admin/settings`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      if (r.ok) { setSettingsStatus("ok"); setTimeout(() => setSettingsStatus("idle"), 3000); }
      else setSettingsStatus("err");
    } catch { setSettingsStatus("err"); }
  };

  const saveSocial = async (id: number) => {
    setSocialsStatus("loading");
    try {
      await fetch(`${BASE}/api/support-admin/socials/${id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: socialEdits[id] }) });
      setSocialsStatus("ok"); setTimeout(() => setSocialsStatus("idle"), 2000);
    } catch { setSocialsStatus("err"); }
  };

  return (
    <SupportLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold text-white">Paramètres</h1>
          <p className="text-gray-400 text-sm mt-0.5">Gérez les informations de contact et les réseaux sociaux DrimPay.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[{ key: "contact", label: "Contact & Horaires" }, { key: "socials", label: "Réseaux sociaux" }].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-colors border", activeTab === tab.key ? "bg-[#C5FF4A]/10 text-[#C5FF4A] border-[#C5FF4A]/20" : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white")}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "contact" && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-5">
            <p className="text-xs text-gray-500">Ces informations sont affichées sur la page support, contact et le footer du site.</p>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                <Phone className="w-3.5 h-3.5" /> WhatsApp Support
              </label>
              <input className={inputCls} value={settings.support_whatsapp} onChange={e => setSettings(s => ({ ...s, support_whatsapp: e.target.value }))} placeholder="+228 XX XX XX XX" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                <MessageCircle className="w-3.5 h-3.5" /> Telegram Support
              </label>
              <input className={inputCls} value={settings.support_telegram} onChange={e => setSettings(s => ({ ...s, support_telegram: e.target.value }))} placeholder="@drimpaysupport" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                <Mail className="w-3.5 h-3.5" /> Email principal
              </label>
              <input className={inputCls} value={settings.support_email_1} onChange={e => setSettings(s => ({ ...s, support_email_1: e.target.value }))} placeholder="support@drimpay.com" type="email" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                <Mail className="w-3.5 h-3.5" /> Email secondaire
              </label>
              <input className={inputCls} value={settings.support_email_2} onChange={e => setSettings(s => ({ ...s, support_email_2: e.target.value }))} placeholder="help@drimpay.com" type="email" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                <Clock className="w-3.5 h-3.5" /> Horaires
              </label>
              <input className={inputCls} value={settings.support_hours} onChange={e => setSettings(s => ({ ...s, support_hours: e.target.value }))} placeholder="Lun - Ven : 8h - 18h" />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={saveSettings} disabled={settingsStatus === "loading"} className="flex items-center gap-2 px-5 py-2.5 bg-[#C5FF4A] text-gray-950 font-bold text-sm rounded-xl hover:bg-[#C5FF4A]/90 transition-colors disabled:opacity-60">
                {settingsStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Enregistrer
              </button>
              {settingsStatus === "ok" && <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Sauvegardé</p>}
              {settingsStatus === "err" && <p className="text-xs text-red-400">Erreur lors de la sauvegarde</p>}
            </div>
          </div>
        )}

        {activeTab === "socials" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
              Les liens se mettent à jour automatiquement sur la landing page, le footer, la page support et le dashboard.
            </p>
            {socials.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center py-16 text-gray-600">Aucun réseau social configuré</div>
            ) : socials.map(link => {
              const Icon = SOCIAL_ICONS[link.platform?.toLowerCase()] ?? ExternalLink;
              return (
                <div key={link.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-300 mb-1.5 capitalize">{link.name || link.platform}</p>
                    <input
                      className={cn(inputCls, "h-9 text-xs")}
                      value={socialEdits[link.id] ?? ""}
                      onChange={e => setSocialEdits(s => ({ ...s, [link.id]: e.target.value }))}
                      placeholder="https://…"
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => saveSocial(link.id)} disabled={socialsStatus === "loading"} className="px-3 py-2 bg-[#C5FF4A] text-gray-950 font-bold text-xs rounded-lg hover:bg-[#C5FF4A]/90 transition-colors disabled:opacity-60">
                      {socialsStatus === "loading" ? <Loader2 className="w-3 h-3 animate-spin" /> : "OK"}
                    </button>
                  </div>
                </div>
              );
            })}
            {socialsStatus === "ok" && <p className="text-xs text-green-400 flex items-center gap-1 px-1"><CheckCircle2 className="w-3.5 h-3.5" /> Sauvegardé</p>}
          </div>
        )}
      </div>
    </SupportLayout>
  );
}

export default function SupportAdminSettings() {
  return <SupportAuthProvider><SettingsContent /></SupportAuthProvider>;
}
