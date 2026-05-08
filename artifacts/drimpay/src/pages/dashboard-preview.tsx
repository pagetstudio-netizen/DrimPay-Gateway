import { motion } from "framer-motion";
import { Link } from "wouter";
import { TrendingUp, Users, ArrowDownLeft, ArrowUpRight, Wallet, MoreHorizontal, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockTransactions = [
  { id: "pay_001", type: "payin", amount: "+XOF 25,000", status: "success", phone: "+228 90 12 34 56", time: "2 min ago", operator: "TMoney" },
  { id: "pay_002", type: "payout", amount: "-XOF 10,000", status: "success", phone: "+229 97 98 76 54", time: "5 min ago", operator: "MTN" },
  { id: "pay_003", type: "payin", amount: "+XOF 50,000", status: "pending", phone: "+225 07 00 11 22", time: "8 min ago", operator: "Orange" },
  { id: "pay_004", type: "payout", amount: "-XOF 75,000", status: "success", phone: "+237 670 001 122", time: "12 min ago", operator: "MTN CM" },
  { id: "pay_005", type: "payin", amount: "+XOF 12,500", status: "failed", phone: "+228 90 55 44 33", time: "18 min ago", operator: "Moov" },
];

const statusColors: Record<string, string> = {
  success: "text-green-400 bg-green-400/10",
  pending: "text-yellow-400 bg-yellow-400/10",
  failed: "text-red-400 bg-red-400/10",
};

export default function DashboardPreview() {
  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border mb-6 text-xs font-medium">Dashboard Preview</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Your payment command center.</h1>
          <p className="text-xl text-muted-foreground">This is a preview of the DrimPay merchant dashboard. Create an account to access your real dashboard with live data.</p>
        </motion.div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xl mb-8">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/50">
            <div className="flex items-center gap-3">
              <img src="/logo-drimpay.png" alt="DrimPay" className="h-6 w-auto object-contain" />
              <span className="font-semibold text-sm">DrimPay Dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Received", value: "XOF 4,820,000", icon: ArrowDownLeft, color: "text-green-400", change: "+12.5% this month" },
                { label: "Total Sent", value: "XOF 2,190,500", icon: ArrowUpRight, color: "text-blue-400", change: "+8.3% this month" },
                { label: "Active Wallets", value: "7 countries", icon: Wallet, color: "text-primary", change: "All operational" },
                { label: "Total Users", value: "284", icon: Users, color: "text-purple-400", change: "+23 this week" },
              ].map((stat, i) => (
                <div key={i} className="rounded-xl border border-border bg-background p-5">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <p className="font-bold text-lg mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </div>
              ))}
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Recent Transactions</h3>
                <button className="text-xs text-primary hover:underline">View all</button>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ID</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Phone</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Operator</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockTransactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.id}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${tx.type === "payin" ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400"}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{tx.phone}</td>
                        <td className="px-4 py-3 text-xs hidden md:table-cell">{tx.operator}</td>
                        <td className={`px-4 py-3 text-right font-semibold text-sm ${tx.type === "payin" ? "text-green-400" : "text-foreground"}`}>{tx.amount}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[tx.status]}`}>{tx.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { country: "Togo", flag: "🇹🇬", balance: "XOF 1,240,000", change: "+8.2%" },
                { country: "Côte d'Ivoire", flag: "🇨🇮", balance: "XOF 890,500", change: "+14.1%" },
                { country: "Cameroun", flag: "🇨🇲", balance: "XAF 425,000", change: "+5.3%" },
              ].map((wallet, i) => (
                <div key={i} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>{wallet.flag}</span>
                      <span className="text-sm font-medium">{wallet.country}</span>
                    </div>
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="font-bold text-lg">{wallet.balance}</p>
                  <p className="text-xs text-green-400">{wallet.change} this week</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-6">Ready to see your own data?</p>
          <Link href="/signup"><Button size="lg" className="text-primary-foreground font-semibold">Create Free Account <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
        </div>
      </div>
    </div>
  );
}
