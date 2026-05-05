import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="pt-32 pb-24 container mx-auto px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-bold tracking-tighter mb-8"
        >
          Powering the African <span className="text-primary">Digital Economy.</span>
        </motion.h1>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-invert lg:prose-xl max-w-none mb-16"
        >
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
            DrimPay was founded on a simple belief: moving money in Africa should be as reliable, fast, and programmable as sending a text message.
          </p>
          <p>
            We are building the foundational infrastructure that allows businesses to participate in the digital economy without worrying about the underlying fragmentation of banks, mobile money operators, and regulators.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 mb-24">
          <div className="p-8 rounded-2xl bg-card border border-border">
            <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
            <p className="text-muted-foreground leading-relaxed">
              To unify fragmented payment systems across West and Central Africa into a single, reliable API platform that developers love to use.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-card border border-border">
            <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
            <p className="text-muted-foreground leading-relaxed">
              An Africa where any business, anywhere, can instantly transact with any customer, unlocking continental trade and prosperity.
            </p>
          </div>
        </div>

        <div className="text-center bg-secondary/50 rounded-3xl p-12 border border-border">
          <h2 className="text-3xl font-bold mb-6">Join our growing team</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            We are always looking for exceptional engineers, product managers, and operators to help us build the future of finance.
          </p>
          <Link href="/careers">
            <Button size="lg" className="font-semibold">
              View Open Roles
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}