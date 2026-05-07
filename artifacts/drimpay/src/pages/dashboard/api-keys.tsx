import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Key, Plus, Trash2, Copy, Eye, EyeOff, CheckCircle2, AlertTriangle, Shield } from "lucide-react";
import { DashboardLayout } from "./layout";
import { ProductionGate } from "@/components/ui/production-gate";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const schema = z.object({
  name: z.string().min(1, "Nom requis").max(60),
  env: z.enum(["sandbox", "live"]),
});

type FormData = z.infer<typeof schema>;

export default function ApiKeys() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [newKeyDialog, setNewKeyDialog] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", env: "sandbox" },
  });

  const fetchKeys = () => {
    setLoading(true);
    fetch("/api/dashboard/api-keys", { credentials: "include" })
      .then((r) => r.json())
      .then(setKeys)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchKeys(); }, []);

  const onSubmit = async (values: FormData) => {
    setCreating(true);
    const res = await fetch("/api/dashboard/api-keys", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) return;
    setNewKey(data.rawKey);
    setNewKeyDialog(true);
    form.reset();
    fetchKeys();
  };

  const revokeKey = async (id: number) => {
    await fetch(`/api/dashboard/api-keys/${id}`, { method: "DELETE", credentials: "include" });
    setDeleteId(null);
    fetchKeys();
  };

  const copy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <DashboardLayout>
      <ProductionGate>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Clés API</h1>
          <p className="text-muted-foreground text-sm mt-1">Gérez vos clés d'accès à l'API DrimPay</p>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 mb-6">
          <Shield className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Sécurité des clés API</p>
            <p className="text-xs text-muted-foreground mt-1">
              Les clés ne sont affichées qu'une seule fois lors de leur création. Stockez-les dans un gestionnaire de secrets sécurisé.
              Ne partagez jamais vos clés live dans votre code source.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold mb-4">Nouvelle clé API</h2>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la clé</FormLabel>
                      <FormControl><Input placeholder="Production Backend" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="env" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Environnement</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sandbox">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-yellow-400" />
                              Sandbox (test)
                            </div>
                          </SelectItem>
                          <SelectItem value="live">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-400" />
                              Live (production)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full text-primary-foreground" disabled={creating}>
                    {creating ? "Création..." : <><Plus className="w-4 h-4 mr-2" />Créer la clé</>}
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-sm">Mes clés API</h2>
              </div>
              {loading ? (
                <div className="p-5 space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}</div>
              ) : !keys.length ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Key className="w-8 h-8 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Aucune clé API</p>
                  <p className="text-xs text-muted-foreground">Créez votre première clé pour accéder à l'API</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {keys.map((key: any) => (
                    <motion.div
                      key={key.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-4 px-5 py-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">{key.name}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${key.env === "live" ? "bg-green-500/15 text-green-600" : "bg-yellow-500/15 text-yellow-600"}`}>
                            {key.env === "live" ? "LIVE" : "SANDBOX"}
                          </span>
                          {key.status === "revoked" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-red-500/15 text-red-600">RÉVOQUÉ</span>
                          )}
                        </div>
                        <p className="font-mono text-xs text-muted-foreground">{key.prefix}••••••••••••••••</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Créée le {new Date(key.createdAt).toLocaleDateString("fr-FR")}
                          {key.lastUsedAt && ` · Dernière utilisation ${new Date(key.lastUsedAt).toLocaleDateString("fr-FR")}`}
                        </p>
                      </div>
                      {key.status === "active" && (
                        <button
                          onClick={() => setDeleteId(key.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={newKeyDialog} onOpenChange={setNewKeyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Clé créée avec succès
            </DialogTitle>
            <DialogDescription>
              Copiez cette clé maintenant. Elle ne sera plus affichée.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted rounded-lg p-4 font-mono text-sm break-all select-all">
            {newKey}
          </div>
          <div className="flex gap-3">
            <Button
              className="flex-1 text-primary-foreground"
              onClick={() => { if (newKey) copy(newKey, -1); }}
            >
              {copiedId === -1 ? <><CheckCircle2 className="w-4 h-4 mr-2" />Copié</> : <><Copy className="w-4 h-4 mr-2" />Copier la clé</>}
            </Button>
            <Button variant="outline" onClick={() => { setNewKeyDialog(false); setNewKey(null); }}>
              Fermer
            </Button>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">Cette clé ne sera plus affichée après fermeture de cette fenêtre.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Révoquer cette clé ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La clé sera immédiatement désactivée.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button variant="destructive" className="flex-1" onClick={() => deleteId && revokeKey(deleteId)}>
              Révoquer
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </ProductionGate>
    </DashboardLayout>
  );
}
