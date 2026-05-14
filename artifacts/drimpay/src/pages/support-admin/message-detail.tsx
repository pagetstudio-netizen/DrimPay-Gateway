import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { SupportAuthProvider, SupportLayout } from "./layout";
import { ArrowLeft, Send, Loader2, CheckCircle2, Clock, AlertCircle, XCircle, ChevronDown } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const STATUS_OPTIONS = [
  { value: "unread", label: "Non lu", color: "text-red-400" },
  { value: "in_progress", label: "En cours", color: "text-amber-400" },
  { value: "replied", label: "Répondu", color: "text-green-400" },
  { value: "closed", label: "Fermé", color: "text-gray-400" },
];

const QUICK_REPLIES = [
  { label: "Accusé réception", body: "Bonjour,\n\nMerci de nous avoir contactés. Nous avons bien reçu votre message et notre équipe vous répondra dans les plus brefs délais.\n\nCordialement,\nL'équipe Support DrimPay" },
  { label: "Délai de traitement", body: "Bonjour,\n\nNous vous informons que votre demande est en cours de traitement. Le délai habituel est de 24 à 48 heures ouvrables.\n\nNous reviendrons vers vous dès que possible.\n\nCordialement,\nL'équipe Support DrimPay" },
  { label: "Résolu", body: "Bonjour,\n\nNous sommes heureux de vous informer que votre demande a été traitée et résolue. N'hésitez pas à nous contacter si vous avez d'autres questions.\n\nCordialement,\nL'équipe Support DrimPay" },
  { label: "Infos manquantes", body: "Bonjour,\n\nAfin de traiter votre demande, nous aurons besoin d'informations supplémentaires. Pourriez-vous nous fournir :\n\n- [précisez les informations nécessaires]\n\nMerci d'avance.\n\nCordialement,\nL'équipe Support DrimPay" },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "unread") return <AlertCircle className="w-4 h-4 text-red-400" />;
  if (status === "in_progress") return <Clock className="w-4 h-4 text-amber-400" />;
  if (status === "replied") return <CheckCircle2 className="w-4 h-4 text-green-400" />;
  return <XCircle className="w-4 h-4 text-gray-400" />;
}

function DetailContent({ id }: { id: number }) {
  const [msg, setMsg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "ok" | "err">("idle");
  const [sendError, setSendError] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(false);

  const fetchMsg = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/support-admin/messages/${id}`, { credentials: "include" });
      setMsg(await r.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchMsg(); }, [id]);

  const updateStatus = async (status: string) => {
    setStatusLoading(true);
    await fetch(`${BASE}/api/support-admin/messages/${id}/status`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchMsg();
    setStatusLoading(false);
  };

  const sendReply = async () => {
    if (!replyBody.trim()) return;
    setSending(true); setSendStatus("idle"); setSendError("");
    try {
      const r = await fetch(`${BASE}/api/support-admin/messages/${id}/reply`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody }),
      });
      const d = await r.json();
      if (!r.ok) { setSendError(d.error ?? "Erreur"); setSendStatus("err"); return; }
      setSendStatus("ok"); setReplyBody(""); await fetchMsg();
      setTimeout(() => setSendStatus("idle"), 3000);
    } catch { setSendError("Erreur réseau"); setSendStatus("err"); }
    finally { setSending(false); }
  };

  const currentStatus = STATUS_OPTIONS.find(s => s.value === msg?.ticketStatus);

  return (
    <SupportLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/support-admin/messages">
            <a className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </a>
          </Link>
          <h1 className="text-lg font-bold text-white flex-1 truncate">{msg?.subject ?? "…"}</h1>
          {msg && (
            <div className="relative">
              <button
                disabled={statusLoading}
                onClick={() => { const next = STATUS_OPTIONS.find(s => s.value !== msg.ticketStatus); if (next) updateStatus(next.value); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <StatusIcon status={msg.ticketStatus} />
                <span className={currentStatus?.color ?? "text-gray-400"}>{currentStatus?.label}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {/* Status dropdown */}
              <div className="absolute right-0 top-10 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-10 overflow-hidden hidden group-hover:block">
                {STATUS_OPTIONS.map(s => (
                  <button key={s.value} onClick={() => updateStatus(s.value)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-800 transition-colors text-gray-300">{s.label}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-gray-500">Chargement…</div>
        ) : !msg || msg.error ? (
          <div className="text-center py-20 text-gray-500">Message introuvable</div>
        ) : (
          <>
            {/* Status bar */}
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(s => (
                <button key={s.value} onClick={() => updateStatus(s.value)} disabled={statusLoading} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${msg.ticketStatus === s.value ? "bg-[#C5FF4A]/10 text-[#C5FF4A] border-[#C5FF4A]/20" : "bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300"}`}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Sender info */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {msg.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{msg.name}</p>
                  <p className="text-sm text-gray-400">{msg.email}</p>
                  {msg.company && <p className="text-xs text-gray-500">{msg.company}</p>}
                  <p className="text-xs text-gray-600 mt-1">{new Date(msg.submittedAt).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })} · source: {msg.source}</p>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
              </div>
            </div>

            {/* Conversation history */}
            {msg.replies?.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Historique de la conversation</h2>
                {msg.replies.map((r: any) => (
                  <div key={r.id} className="bg-gray-900 border border-[#C5FF4A]/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-[#C5FF4A]/10 flex items-center justify-center text-[#C5FF4A] font-bold text-[10px]">
                        {r.agentName?.[0]?.toUpperCase() ?? "S"}
                      </div>
                      <p className="text-xs font-semibold text-[#C5FF4A]">{r.agentName ?? "Support"}</p>
                      <span className="text-[10px] text-gray-600">{new Date(r.sentAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{r.body}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply form */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Répondre</h2>
                <div className="relative">
                  <button onClick={() => setShowQuick(v => !v)} className="text-xs text-gray-400 hover:text-[#C5FF4A] transition-colors flex items-center gap-1">
                    Réponses rapides <ChevronDown className="w-3 h-3" />
                  </button>
                  {showQuick && (
                    <div className="absolute right-0 top-7 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-10 min-w-[200px] overflow-hidden">
                      {QUICK_REPLIES.map(q => (
                        <button key={q.label} onClick={() => { setReplyBody(q.body); setShowQuick(false); }} className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-gray-700 transition-colors border-b border-gray-700/50 last:border-0">
                          {q.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <textarea
                value={replyBody} onChange={e => setReplyBody(e.target.value)}
                rows={5}
                className="w-full rounded-xl bg-gray-800 border border-gray-700 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#C5FF4A]/50 focus:ring-2 focus:ring-[#C5FF4A]/10 transition-all resize-none"
                placeholder="Écrivez votre réponse…"
              />
              {sendStatus === "ok" && <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Réponse envoyée</p>}
              {sendStatus === "err" && <p className="text-xs text-red-400">{sendError}</p>}
              <div className="flex items-center gap-3">
                <button
                  onClick={sendReply} disabled={sending || !replyBody.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#C5FF4A] text-gray-950 font-bold text-sm rounded-xl hover:bg-[#C5FF4A]/90 transition-colors disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Envoyer la réponse
                </button>
                <p className="text-xs text-gray-500">Un email sera envoyé à {msg.email}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </SupportLayout>
  );
}

export default function SupportAdminMessageDetail() {
  const [location] = useLocation();
  const id = parseInt(location.split("/").pop() ?? "0");
  return <SupportAuthProvider><DetailContent id={id} /></SupportAuthProvider>;
}
