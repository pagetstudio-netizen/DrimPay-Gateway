import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export default function Login() {
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [serverError, setServerError] = useState("");
  const [, navigate] = useLocation();
  const { login } = useAuth();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setStatus("loading");
    setServerError("");
    const { error } = await login(values.email, values.password);
    if (error) {
      setServerError(error);
      setStatus("idle");
      return;
    }
    navigate("/dashboard-preview");
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 pb-20 px-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl leading-none">D</span>
            </div>
            <span className="font-bold text-xl tracking-tight">DrimPay</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to your DrimPay account</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl><Input placeholder="you@company.com" type="email" autoComplete="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                  </div>
                  <FormControl><Input placeholder="••••••••" type="password" autoComplete="current-password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {serverError && (
                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{serverError}</p>
              )}

              <Button type="submit" size="lg" className="w-full text-primary-foreground font-semibold mt-2" disabled={status === "loading"}>
                {status === "loading" ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connexion en cours...</>
                ) : (
                  <><Lock className="w-4 h-4 mr-2" /> Sign In Securely</>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline font-medium">Create one free</Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Protected by DrimPay security · <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  );
}
