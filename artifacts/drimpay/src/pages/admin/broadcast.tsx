import { useState, useEffect, useRef } from "react";
import { Send, Users, CheckCircle2, AlertTriangle, Eye, Megaphone, RefreshCw, Mail, UserSearch, X } from "lucide-react";
import { AdminLayout } from "./layout";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const FILTERS = [
  { value: "all", label: "Tous les marchands", desc: "Tous les comptes marchands inscrits" },
  { value: "kyb_approved", label: "KYB approuvé", desc: "Marchands dont le KYB a été validé" },
  { value: "kyb_pending", label: "KYB en attente", desc: "Marchands avec un dossier KYB soumis" },
  { value: "no_kyb", label: "Sans KYB", desc: "Marchands n'ayant pas encore soumis de KYB" },
];

type Recipient = { id: number; email: string; companyName: string; country: string; createdAt: string };
type BroadcastResult = { sent: number; failed: number; errors: string[] } | null;

// ─── Onglet individuel ─────────────────────────────────────────────────────────
function IndividualTab() {
  const [emailInput, setEmailInput] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [suggestions, setSuggestions] = useState<{ id: number; email: string; companyName: string; country: string }[]>([]);
  const [showSugg, setShowSugg] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<{ email: string; companyName: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (suggRef.current && !suggRef.current.contains(e.target as Node)) setShowSugg(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const onEmailChange = (v: string) => {
    setEmailInput(v);
    setSelectedMerchant(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.trim().length >= 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          const r = await fetch(`${BASE}/api/admin/merchants/search?q=${encodeURIComponent(v)}`, { credentials: "include" });
          const d = await r.json();
          setSuggestions(d.merchants ?? []);
          setShowSugg(true);
        } catch { setSuggestions([]); }
      }, 280);
    } else {
      setSuggestions([]); setShowSugg(false);
    }
  };

  const selectMerchant = (m: { email: string; companyName: string }) => {
    setEmailInput(m.email);
    setSelectedMerchant(m);
    setSuggestions([]); setShowSugg(false);
  };

  const send = async () => {
    if (!emailInput.trim() || !subject.trim() || !body.trim()) return;
    setSending(true); setResult(null);
    try {
      const r = await fetch(`${BASE}/api/admin/message/individual`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim(), subject, body }),
      });
      const d = await r.json();
      if (r.ok) setResult({ ok: true });
      else setResult({ ok: false, error: d.error ?? "Erreur serveur" });
    } catch { setResult({ ok: false, error: "Erreur réseau" }); }
    setSending(false);
  };

  const reset = () => { setEmailInput(""); setSubject(""); setBody(""); setResult(null); setSelectedMerchant(null); };
  const canSend = emailInput.trim().length > 3 && subject.trim().length > 0 && body.trim().length > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      {result && (
        <div className={cn("flex items-start gap-3 rounded-xl p-4 border", result.ok ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
          {result.ok
            ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            : <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
          <div className="flex-1">
            <p className={cn("text-sm font-semibold", result.ok ? "text-green-800" : "text-red-800")}>
              {result.ok ? `Email envoyé à ${emailInput}` : "Échec de l'envoi"}
            </p>
            {result.error && <p className="text-xs text-red-600 mt-0.5">{result.error}</p>}
            {result.ok && (
              <button onClick={reset} className="mt-2 text-xs text-emerald-700 font-semibold hover:underline">Nouveau message →</button>
            )}
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-1.5">
          Adresse email du marchand
        </label>
        <div className="relative" ref={suggRef}>
          <div className="relative">
            <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={emailInput}
              onChange={e => onEmailChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSugg(true)}
              placeholder="email@marchand.com ou nom d'entreprise..."
              className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {emailInput && (
              <button onClick={() => { setEmailInput(""); setSelectedMerchant(null); setSuggestions([]); setShowSugg(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {showSugg && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-20 overflow-hidden">
              {suggestions.map(m => (
                <button key={m.id} onClick={() => selectMerchant(m)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left">
                  <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-blue-600">{m.companyName[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{m.companyName}</p>
                    <p className="text-xs text-gray-400 truncate">{m.email}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{m.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedMerchant && (
          <div className="mt-2 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-blue-600">{selectedMerchant.companyName[0]}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-800">{selectedMerchant.companyName}</p>
              <p className="text-[10px] text-blue-500">{selectedMerchant.email}</p>
            </div>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 ml-auto shrink-0" />
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1.5">Tapez l'email ou le nom de l'entreprise pour sélectionner un marchand inscrit, ou entrez directement une adresse.</p>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-1.5">Sujet</label>
        <input value={subject} onChange={e => setSubject(e.target.value)}
          placeholder="Ex : Information importante concernant votre compte"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-1.5">Message</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={9}
          placeholder={"Bonjour,\n\nNous souhaitons vous informer de…\n\nCordialement,\nL'équipe DrimPay"}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
        <p className="text-xs text-gray-400 mt-1">Chaque retour à la ligne sera conservé dans l'email.</p>
      </div>

      <button onClick={send} disabled={!canSend || sending || !!result?.ok}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors">
        {sending ? <><RefreshCw className="w-4 h-4 animate-spin" /> Envoi en cours…</> : <><Send className="w-4 h-4" /> Envoyer le message</>}
      </button>
    </div>
  );
}

// ─── Onglet groupé ─────────────────────────────────────────────────────────────
function BroadcastTab() {
  const [filter, setFilter] = useState("all");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult>(null);
  const [preview, setPreview] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const loadRecipients = async (f: string) => {
    setLoadingRecipients(true);
    try {
      const r = await fetch(`${BASE}/api/admin/broadcast/recipients?filter=${f}`, { credentials: "include" });
      const d = await r.json();
      setRecipients(d.recipients ?? []);
    } catch { setRecipients([]); }
    setLoadingRecipients(false);
  };

  useEffect(() => { loadRecipients(filter); }, [filter]);

  const send = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true); setResult(null); setConfirm(false);
    try {
      const r = await fetch(`${BASE}/api/admin/broadcast`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, filter }),
      });
      const d = await r.json();
      if (r.ok) setResult({ sent: d.sent, failed: d.failed, errors: d.errors ?? [] });
      else setResult({ sent: 0, failed: recipients.length, errors: [d.error ?? "Erreur serveur"] });
    } catch { setResult({ sent: 0, failed: recipients.length, errors: ["Erreur réseau"] }); }
    setSending(false);
  };

  const canSend = subject.trim().length > 0 && body.trim().length > 0 && recipients.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      {result && (
        <div className={cn("rounded-2xl p-5 border", result.failed === 0 ? "bg-green-50 border-green-200" : result.sent === 0 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200")}>
          <div className="flex items-center gap-3 mb-2">
            {result.failed === 0
              ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              : <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
            <p className="font-semibold text-gray-900">
              {result.sent} email{result.sent > 1 ? "s" : ""} envoyé{result.sent > 1 ? "s" : ""}
              {result.failed > 0 && ` — ${result.failed} échec${result.failed > 1 ? "s" : ""}`}
            </p>
          </div>
          {result.errors.slice(0, 5).map((e, i) => <p key={i} className="text-xs text-red-600 font-mono">{e}</p>)}
          <button onClick={() => { setResult(null); setSubject(""); setBody(""); }} className="mt-2 text-xs text-emerald-700 font-semibold hover:underline">
            Nouveau message →
          </button>
        </div>
      )}

      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-2">Destinataires</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={cn("p-3 rounded-xl border text-left transition-all", filter === f.value ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50")}>
              <p className={cn("text-xs font-semibold", filter === f.value ? "text-emerald-700" : "text-gray-800")}>{f.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{f.desc}</p>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          {loadingRecipients
            ? <span className="text-xs text-gray-400 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Chargement…</span>
            : <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                {recipients.length} destinataire{recipients.length > 1 ? "s" : ""} sélectionné{recipients.length > 1 ? "s" : ""}
              </span>}
          {recipients.length > 0 && (
            <button onClick={() => setPreview(v => !v)} className="ml-auto flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
              <Eye className="w-3.5 h-3.5" /> {preview ? "Masquer" : "Voir la liste"}
            </button>
          )}
        </div>
        {preview && recipients.length > 0 && (
          <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
            {recipients.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-3 py-2">
                <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-emerald-600">{r.companyName[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{r.companyName}</p>
                  <p className="text-[10px] text-gray-400 truncate">{r.email}</p>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">{r.country}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-1.5">Sujet de l'email</label>
        <input value={subject} onChange={e => setSubject(e.target.value)}
          placeholder="Ex : Mise à jour importante — DrimPay"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-1.5">Message</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={9}
          placeholder={"Chers marchands,\n\nNous souhaitons vous informer de…\n\nCordialement,\nL'équipe DrimPay"}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
        <p className="text-xs text-gray-400 mt-1">Chaque retour à la ligne sera conservé dans l'email.</p>
      </div>

      {!confirm ? (
        <button onClick={() => setConfirm(true)} disabled={!canSend || sending}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors">
          <Send className="w-4 h-4" />
          Envoyer à {recipients.length} marchand{recipients.length > 1 ? "s" : ""}
        </button>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Confirmer l'envoi groupé</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Vous allez envoyer <strong>"{subject}"</strong> à <strong>{recipients.length} marchand{recipients.length > 1 ? "s" : ""}</strong>. Cette action est irréversible.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={send} disabled={sending}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors">
              {sending ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Envoi…</> : <><Send className="w-3.5 h-3.5" /> Confirmer l'envoi</>}
            </button>
            <button onClick={() => setConfirm(false)} disabled={sending} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────────
export default function AdminBroadcast() {
  const [tab, setTab] = useState<"individual" | "broadcast">("individual");

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages marchands</h1>
            <p className="text-sm text-gray-500">Envoyez un email à un marchand ou à un groupe</p>
          </div>
        </div>

        <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
          <button onClick={() => setTab("individual")}
            className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
              tab === "individual" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            <Mail className="w-4 h-4" /> Message individuel
          </button>
          <button onClick={() => setTab("broadcast")}
            className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
              tab === "broadcast" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            <Users className="w-4 h-4" /> Envoi groupé
          </button>
        </div>

        {tab === "individual" ? <IndividualTab /> : <BroadcastTab />}
      </div>
    </AdminLayout>
  );
}
