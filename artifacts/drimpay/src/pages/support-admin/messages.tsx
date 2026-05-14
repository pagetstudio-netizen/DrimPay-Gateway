import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { SupportAuthProvider, SupportLayout } from "./layout";
import { Search, Filter, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const STATUS_COLORS: Record<string, string> = {
  unread: "bg-red-500/10 text-red-400 border-red-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  replied: "bg-green-500/10 text-green-400 border-green-500/20",
  closed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};
const STATUS_LABELS: Record<string, string> = {
  all: "Tous", unread: "Non lu", in_progress: "En cours", replied: "Répondu", closed: "Fermé",
};
const SOURCE_LABELS: Record<string, string> = {
  all: "Toutes sources", contact: "Contact", support: "Support", landing: "Landing page",
};

function relTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function MessagesContent() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.includes("?") ? location.split("?")[1] : "");

  const [messages, setMessages] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(params.get("status") ?? "all");
  const [source, setSource] = useState("all");

  const fetchMessages = async (p = page) => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(p), ...(status !== "all" ? { status } : {}), ...(source !== "all" ? { source } : {}), ...(search ? { search } : {}) });
    try {
      const r = await fetch(`${BASE}/api/support-admin/messages?${q}`, { credentials: "include" });
      const d = await r.json();
      setMessages(d.messages ?? []); setTotal(d.total ?? 0); setPages(d.pages ?? 1);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchMessages(1); setPage(1); }, [status, source, search]);

  useEffect(() => {
    fetch(`${BASE}/api/support-admin/stats`, { credentials: "include" })
      .then(r => r.json()).then(d => setUnread(d.unread ?? 0)).catch(() => {});
  }, []);

  const exportCsv = () => {
    const rows = [["ID", "Nom", "Email", "Entreprise", "Sujet", "Message", "Source", "Statut", "Date"]];
    messages.forEach(m => rows.push([m.id, m.name, m.email, m.company ?? "", m.subject, m.message.replace(/\n/g, " "), m.source, m.ticketStatus, new Date(m.submittedAt).toLocaleString("fr-FR")]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "messages_support.csv"; a.click();
  };

  return (
    <SupportLayout unreadCount={unread}>
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-white">Messages</h1>
            <p className="text-gray-400 text-sm mt-0.5">{total} message{total !== 1 ? "s" : ""} au total</p>
          </div>
          <button onClick={exportCsv} className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors font-medium">
            <Download className="w-3.5 h-3.5" /> Exporter CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              className="w-full h-9 rounded-xl bg-gray-900 border border-gray-700 pl-8 pr-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#C5FF4A]/50 transition-all"
              placeholder="Rechercher…"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} className="h-9 rounded-xl bg-gray-900 border border-gray-700 px-3 text-sm text-gray-300 outline-none cursor-pointer">
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={source} onChange={e => setSource(e.target.value)} className="h-9 rounded-xl bg-gray-900 border border-gray-700 px-3 text-sm text-gray-300 outline-none cursor-pointer">
            {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <button key={v} onClick={() => setStatus(v)} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors", status === v ? "bg-[#C5FF4A]/10 text-[#C5FF4A] border border-[#C5FF4A]/20" : "text-gray-500 hover:text-gray-300 bg-gray-900 border border-gray-800")}>{l}</button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">Chargement…</div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600">
              <Filter className="w-8 h-8 mb-2 opacity-30" />
              <p>Aucun message</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {/* Header */}
              <div className="hidden md:grid grid-cols-[1fr_1fr_1.5fr_80px_80px_80px] gap-3 px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                <span>Nom / Email</span><span>Sujet</span><span>Message</span><span>Source</span><span>Date</span><span>Statut</span>
              </div>
              {messages.map(m => (
                <Link href={`/support-admin/messages/${m.id}`} key={m.id}>
                  <a className="grid md:grid-cols-[1fr_1fr_1.5fr_80px_80px_80px] gap-3 px-4 py-3.5 hover:bg-gray-800/50 transition-colors items-center">
                    <div className="min-w-0">
                      <p className={cn("text-sm font-semibold truncate", m.ticketStatus === "unread" ? "text-white" : "text-gray-300")}>{m.name}</p>
                      <p className="text-xs text-gray-500 truncate">{m.email}</p>
                      {m.company && <p className="text-[10px] text-gray-600 truncate">{m.company}</p>}
                    </div>
                    <p className={cn("text-sm truncate", m.ticketStatus === "unread" ? "text-white font-medium" : "text-gray-400")}>{m.subject}</p>
                    <p className="text-xs text-gray-500 line-clamp-2 hidden md:block">{m.message}</p>
                    <span className="text-[10px] text-gray-500 capitalize">{m.source}</span>
                    <span className="text-[10px] text-gray-500">{relTime(m.submittedAt)}</span>
                    <span className={cn("text-[10px] px-2 py-1 rounded-full border font-semibold text-center", STATUS_COLORS[m.ticketStatus])}>
                      {STATUS_LABELS[m.ticketStatus]}
                    </span>
                  </a>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); fetchMessages(p); }} className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-400">Page {page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => { const p = page + 1; setPage(p); fetchMessages(p); }} className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </SupportLayout>
  );
}

export default function SupportAdminMessages() {
  return <SupportAuthProvider><MessagesContent /></SupportAuthProvider>;
}
