import { motion } from "framer-motion";
import { useSubmitContact } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Phone, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormData = z.infer<typeof schema>;

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const mutation = useSubmitContact();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", company: "", subject: "", message: "" },
  });

  const onSubmit = (values: FormData) => {
    mutation.mutate({ data: values }, { onSuccess: () => setSubmitted(true) });
  };

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl mb-16">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Get in touch.</h1>
          <p className="text-xl text-muted-foreground">Whether you have a question about the API, need help with integration, or want to discuss enterprise pricing — our team responds within 24 hours.</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-primary/20 bg-primary/5">
                <CheckCircle2 className="w-16 h-16 text-primary mb-6" />
                <h2 className="text-2xl font-bold mb-3">Message received</h2>
                <p className="text-muted-foreground max-w-md">Our team will get back to you within 24 hours at the email you provided. For urgent issues, you can also reach us at support@drimpay.io.</p>
              </motion.div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl><Input placeholder="Aminata Diallo" data-testid="input-name" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl><Input placeholder="aminata@company.com" type="email" data-testid="input-email" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="company" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company (Optional)</FormLabel>
                        <FormControl><Input placeholder="Your company name" data-testid="input-company" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="subject" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl><Input placeholder="API Integration Help" data-testid="input-subject" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="message" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl><Textarea placeholder="Tell us how we can help..." rows={6} data-testid="input-message" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" size="lg" className="text-primary-foreground font-semibold" disabled={mutation.isPending} data-testid="button-submit">
                      {mutation.isPending ? "Sending..." : "Send Message"} <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </form>
                </Form>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {[
              { icon: Mail, title: "Email", details: ["support@drimpay.io", "enterprise@drimpay.io"] },
              { icon: Phone, title: "Phone", details: ["+228 22 00 11 22", "+237 699 001 122"] },
              { icon: MapPin, title: "Headquarters", details: ["DrimPay Tower, Rue du Commerce", "Lomé, Togo 01 BP 3578"] },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><item.icon className="w-4 h-4 text-primary" /></div>
                  <h3 className="font-semibold">{item.title}</h3>
                </div>
                {item.details.map((d, j) => <p key={j} className="text-sm text-muted-foreground">{d}</p>)}
              </div>
            ))}

            <div className="p-6 rounded-xl border border-primary/20 bg-primary/5">
              <h3 className="font-semibold mb-2">Support Hours</h3>
              <p className="text-sm text-muted-foreground">Monday — Friday: 8:00 AM — 8:00 PM WAT</p>
              <p className="text-sm text-muted-foreground">Saturday: 9:00 AM — 5:00 PM WAT</p>
              <p className="text-sm text-muted-foreground mt-2">Emergency API issues: 24/7 on-call</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
