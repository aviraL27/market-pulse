import { Link, NavLink, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Bookmark, LayoutDashboard, LogOut, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/search", label: "Search", icon: Search },
  { to: "/app/watchlist", label: "Watchlist", icon: Bookmark },
];

export function AppShell() {
  const { user, signOut } = useAuth();

  return (
    <div className="mesh-gradient min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/40 bg-cream/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/app" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
              <Activity className="h-5 w-5 text-accent" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Market Pulse</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? "bg-white/70 text-accent" : "text-ink-muted hover:text-ink"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-muted sm:block">
              {user?.email}
            </span>
            <Button variant="ghost" onClick={() => signOut()} className="!p-2">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6"
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
