import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";

const schema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  country: z.string().min(1, "Please select your country"),
});

type FormData = z.infer<typeof schema>;

const countries = [
  { code: "TG", name: "Togo" },
  { code: "BJ", name: "Benin" },
  { code: "CM", name: "Cameroon" },
  { code: "BF", name: "Burkina Faso" },
  { code: "ML", name: "Mali" },
  { code: "SN", name: "Senegal" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "OTHER", name: "Other" },
];

export default function Signup() {
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [serverError, setServerError] = useState("");
  const [, navigate] = useLocation();
  const { signup } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { companyName: "", email: "", password: "", country: "" },
  });

  const onSubmit = async (values: FormData) => {
    setStatus("loading");
    setServerError("");
    const { error } = await signup(values);
    if (error) {
      setServerError(error);
      setStatus("idle");
      return;
    }
    navigate("/dashboard-preview");
  };

  return (
    <div className="min-h-screen flex pt-20 pb-20">
      <div className="hidden lg:flex flex-1 bg-primary/5 border-r border-border items-center justify-center p-16">
        <div className="max-w-sm">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">D</span>
            </div>
            <span className="font-bold text-xl">DrimPay</span>
          </div>
          <h2 className="text-3xl font-bold mb-6">Start processing payments across Africa today.</h2>
          <ul className="space-y-4">
            {[
              "Sandbox access immediately upon signup",
              "Live payments after KYB verification",
              "No monthly fees — pay only per transaction",
              "7 countries, 15+ mobile money operators",
              "24/7 technical support",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-7 h-7 rounded-sm bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">D</span>
              </div>
              <span className="font-bold text-lg">DrimPay</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold mb-2">Create your account</h1>
          <p className="text-muted-foreground mb-8">Start accepting payments in minutes.</p>

          <div className="rounded-2xl border border-border bg-card p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
                <FormField control={form.control} name="companyName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp Ltd." autoComplete="organization" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Email</FormLabel>
                    <FormControl>
                      <Input placeholder="ceo@company.com" type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="Min. 8 characters" type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {serverError && (
                  <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{serverError}</p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-primary-foreground font-semibold mt-2"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? (
                    <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Creating account...</>
                  ) : (
                    <>Create Account <ArrowRight className="ml-2 w-4 h-4" /></>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="hover:underline">Terms</Link> and{" "}
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
