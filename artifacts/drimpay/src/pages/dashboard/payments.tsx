import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock,
  XCircle, AlertCircle, X, RefreshCw, ChevronLeft, ChevronRight,
  Filter, Copy, Check, ExternalLink
} from "lucide-react";
import { DashboardLayout } from "./layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

function EmptyStateTd() {
  return (
    <EmptyState
      title="Aucune transaction trouvée"
      description="Vos transactions apparaîtront ici une fois que votre API traitera des paiements."
    />
  );
}

type Tx = {
  id: number;
  reference: string;
  orderId?: string;
  type: "payin" | "payout";
  status: "pending" | "success" | "failed" | "processing";
  amount: string;
  fee: string;
  netAmount: string;
  currency: string;
  countryCode: string;
  operator: string;
  phone: string;
  description?: string;
  externalRef?: string;
  gatewayReference?: string;
  mnoReference?: string;
  mode: "sandbox" | "live";
  failureReason?: string;
  webhookUrl?: string;
  webhookLastStatusCode?: number;
  webhookLastBody?: string;
  webhookLastSentAt?: string;
  createdAt: string;
};

const STATUS_MAP = {
  success:    { label: "Success",    icon: CheckCircle2,  cls: "bg-green-500/15 text-green-400 border-green-500/20" },
  pending:    { label: "Pending",    icon: Clock,          cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
  processing: { label: "Processing", icon: AlertCircle,    cls: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  failed:     { label: "Failed",     icon: XCircle,        cls: "bg-red-500/15 text-red-400 border-red-500/20" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status as keyof typeof STATUS_MAP] ?? STATUS_MAP.pending;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border", s.cls)}>
      <s.icon className="w-3 h-3" /> {s.label}
    </span>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="py-3 border-b border-border/50 last:border-0">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <p className={cn("text-sm text-foreground flex-1 break-all", mono && "font-mono text-xs")}>{value}</p>
        <button onClick={copy} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

function WebhookModal({ tx, onClose }: { tx: Tx; onClose: () => void }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const resend = async () => {
    setSending(true);
    try {
      await fetch(`/api/dashboard/transactions/${tx.id}/resend-webhook`, {
        method: "POST", credentials: "include",
      });
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold">Resend Webhook</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        {sent ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="font-semibold">Webhook sent successfully</p>
            <p className="text-sm text-muted-foreground mt-1">The notification has been dispatched.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">The webhook will be sent to:</p>
            <div className="bg-muted/30 border border-border rounded-lg px-4 py-3 mb-4">
              <code className="text-sm font-mono text-foreground break-all">
                {tx.webhookUrl ?? "https://your-server.com/webhook"}
              </code>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to resend the webhook notification for this transaction?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1 text-primary-foreground font-semibold" onClick={resend} disabled={sending}>
                <RefreshCw className={cn("w-4 h-4 mr-2", sending && "animate-spin")} />
                {sending ? "Sending..." : "Resend Webhook"}
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function DetailPanel({ tx, onClose }: { tx: Tx; onClose: () => void }) {
  const [showWebhook, setShowWebhook] = useState(false);

  const additionalInfo = JSON.stringify({
    country_code: tx.countryCode,
    phone_number: tx.phone,
    network: tx.operator.toLowerCase().replace(/\s/g, ""),
    fixed_fee: "0.00",
    percentage_fee: "3.00",
    ...(tx.webhookLastStatusCode ? {
      last_webhook_response: {
        status_code: tx.webhookLastStatusCode,
        body: tx.webhookLastBody,
        sent_at: tx.webhookLastSentAt,
      }
    } : {}),
    ...(tx.failureReason ? { failure_reason: tx.failureReason } : {}),
  }, null, 2);

  return (
    <>
      <AnimatePresence>
        {showWebhook && <WebhookModal tx={tx} onClose={() => setShowWebhook(false)} />}
      </AnimatePresence>

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border z-50 flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold">Payment Details</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-4 flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
              tx.type === "payin" ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"
            )}>
              {tx.type === "payin" ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
              {tx.type === "payin" ? "Pay-in" : "Pay-out"}
            </span>
            <StatusBadge status={tx.status} />
            <span className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground">{tx.mode}</span>
          </div>

          <DetailRow label="Reference" value={tx.reference} mono />
          <DetailRow label="Order ID" value={tx.orderId} mono />

          <div className="py-3 border-b border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Amount</p>
            <p className="text-2xl font-bold">{parseFloat(tx.amount).toLocaleString()} {tx.currency}</p>
          </div>

          <div className="py-3 border-b border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Fee</p>
            <p className="text-lg font-semibold text-yellow-400">{parseFloat(tx.fee).toLocaleString()} {tx.currency}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Fixed: 0.00 {tx.currency} + 3.00%</p>
          </div>

          <div className="py-3 border-b border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Net Amount</p>
            <p className="text-base font-semibold text-green-400">{parseFloat(tx.netAmount).toLocaleString()} {tx.currency}</p>
          </div>

          <DetailRow label="Payment Method" value="Mobile Money" />
          <DetailRow label="Phone Number" value={tx.phone} />
          <DetailRow label="Operator / Network" value={tx.operator} />
          <DetailRow label="Country" value={tx.countryCode} />
          <DetailRow label="Type" value={tx.type === "payin" ? "cashin" : "cashout"} />
          <DetailRow label="Gateway Reference" value={tx.gatewayReference} mono />
          <DetailRow label="MNO Reference" value={tx.mnoReference} mono />
          <DetailRow label="External Reference" value={tx.externalRef} mono />
          <DetailRow label="Description" value={tx.description} />

          <div className="py-3 border-b border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Mode</p>
            <p className="text-sm">{tx.mode}</p>
          </div>

          <div className="py-3 border-b border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Date</p>
            <p className="text-sm">{new Date(tx.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
          </div>

          {tx.failureReason && (
            <div className="py-3 border-b border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Failure Reason</p>
              <p className="text-sm text-red-400">{tx.failureReason}</p>
            </div>
          )}

          <div className="py-3 border-b border-border/50">
            <p className="text-xs text-muted-foreground mb-2">Additional Information</p>
            <pre className="bg-muted/30 border border-border rounded-lg p-3 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-all">
              {additionalInfo}
            </pre>
          </div>

          {(tx.webhookLastStatusCode || tx.webhookLastBody) && (
            <div className="py-3">
              <p className="text-xs text-muted-foreground mb-2">Last Webhook Response</p>
              <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-1.5 text-sm">
                {tx.webhookLastStatusCode && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status Code:</span>
                    <span className={cn("px-1.5 py-0.5 rounded text-xs font-bold", tx.webhookLastStatusCode === 200 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                      {tx.webhookLastStatusCode}
                    </span>
                  </div>
                )}
                {tx.webhookLastSentAt && (
                  <div><span className="text-muted-foreground">Sent At: </span>{new Date(tx.webhookLastSentAt).toLocaleString("en-US")}</div>
                )}
                {tx.webhookLastBody && (
                  <div><span className="text-muted-foreground">Body: </span><code className="font-mono text-xs">{tx.webhookLastBody}</code></div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0">
          <Button className="w-full text-primary-foreground font-semibold" onClick={() => setShowWebhook(true)}>
            <RefreshCw className="w-4 h-4 mr-2" /> Resend Webhook
          </Button>
        </div>
      </motion.div>
    </>
  );
}

export default function DashboardPayments() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Tx | null>(null);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search.trim()) params.set("search", search.trim());

    try {
      const r = await fetch(`/api/dashboard/payments?${params}`, { credentials: "include" });
      const d = await r.json();
      setTxs(Array.isArray(d.transactions) ? d.transactions : []);
      setTotal(d.total ?? 0);
    } catch {
      setTxs([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <DashboardLayout>
      <AnimatePresence>
        {selected && (
          <>
            <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelected(null)} />
            <DetailPanel tx={selected} onClose={() => setSelected(null)} />
          </>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payment History</h1>
            <p className="text-muted-foreground text-sm mt-1">All pay-in and pay-out transactions with full details.</p>
          </div>
          <span className="text-xs bg-muted/40 border border-border rounded-full px-3 py-1 text-muted-foreground">
            {total.toLocaleString()} total
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by reference, order ID, phone number..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="payin">Pay-in</SelectItem>
              <SelectItem value="payout">Pay-out</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reference</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fee</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <div className="h-4 bg-muted/40 rounded animate-pulse" style={{ width: `${60 + j * 10}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : txs.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyStateTd />
                    </td>
                  </tr>
                ) : (
                  txs.map((tx) => (
                    <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => setSelected(tx)}>
                      <td className="px-4 py-3.5">
                        <span className="inline-block bg-muted/30 border border-border/60 rounded-full px-2.5 py-0.5 font-mono text-xs text-foreground max-w-[180px] truncate">
                          {tx.reference}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold">
                        {parseFloat(tx.amount).toLocaleString()} <span className="text-muted-foreground font-normal text-xs">{tx.currency}</span>
                      </td>
                      <td className="px-4 py-3.5 text-yellow-400">
                        {parseFloat(tx.fee).toLocaleString()} <span className="text-muted-foreground font-normal text-xs">{tx.currency}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                          tx.type === "payin" ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"
                        )}>
                          {tx.type === "payin" ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {tx.type === "payin" ? "Pay-in" : "Pay-out"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={tx.status} /></td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button size="sm" variant="outline" className="h-7 text-xs font-semibold border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
                          onClick={(e) => { e.stopPropagation(); setSelected(tx); }}>
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && total > limit && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {total} results
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
