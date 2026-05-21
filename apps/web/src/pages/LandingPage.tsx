import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Globe, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LandingPage() {
  return (
    <div className="mesh-gradient min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-xl font-semibold tracking-tight">Market Pulse</span>
        <div className="flex gap-3">
          <Link to="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link to="/signup">
            <Button>Get started</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-16 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 text-sm font-medium uppercase tracking-widest text-accent"
        >
          Smart market intelligence
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl"
        >
          Track live prices across crypto, FX, food & commodities
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-6 max-w-xl text-lg text-ink-muted"
        >
          A premium market dashboard powered by mixed live APIs, personalized watchlists, and real-time analytics.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <Link to="/signup">
            <Button className="gap-2 px-6 py-3">
              Start tracking <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" className="px-6 py-3">
              View demo
            </Button>
          </Link>
        </motion.div>

        <div className="mt-24 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Globe, title: "Mixed markets", desc: "Crypto, FX, food & commodities in one place" },
            { icon: BarChart3, title: "Live trends", desc: "Price changes, charts & trending searches" },
            { icon: Shield, title: "Secure", desc: "Supabase auth, RLS & server-side API keys" },
          ].map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="glass rounded-2xl p-6 text-left"
            >
              <Icon className="mb-3 h-8 w-8 text-accent" />
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
