import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

type Tab = "password" | "email-link";

export function LoginPage() {
  const [tab, setTab] = useState<Tab>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/app";

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await auth.signInWithEmail(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const sendEmailLink = async () => {
    setError("");
    setLoading(true);
    try {
      await auth.signInWithOtp(email);
      setLinkSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLinkSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendEmailLink();
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await auth.verifyOtp(email, otp);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to Market Pulse">
      <div className="mb-6 flex rounded-xl bg-cream-dark/80 p-1">
        {(
          [
            { id: "password" as const, label: "Email & password" },
            { id: "email-link" as const, label: "Email link" },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setLinkSent(false);
              setShowCodeInput(false);
              setError("");
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              tab === id ? "bg-white shadow-sm text-ink" : "text-ink-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {tab === "password" ? (
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Link to="/forgot-password" className="text-sm text-accent hover:underline">
            Forgot password?
          </Link>
          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>
        </form>
      ) : linkSent ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-emerald-50/80 px-4 py-4 text-sm text-emerald-900">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <Mail className="h-4 w-4" />
              Check your email
            </div>
            <p>
              We sent a <strong>sign-in link</strong> to <strong>{email}</strong>. Click the link in that email to
              open Market Pulse — you’ll be signed in automatically.
            </p>
            <p className="mt-2 text-emerald-800/80">Check spam/promotions if you don’t see it within a minute.</p>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            loading={loading}
            onClick={() => void sendEmailLink()}
          >
            Resend link
          </Button>

          <button
            type="button"
            className="w-full text-sm text-ink-muted hover:text-accent"
            onClick={() => setShowCodeInput((v) => !v)}
          >
            {showCodeInput ? "Hide" : "Got a 6-digit code instead?"}
          </button>

          {showCodeInput && (
            <form onSubmit={handleOtpVerify} className="space-y-4 border-t border-cream-dark pt-4">
              <p className="text-xs text-ink-muted">
                Only if your Supabase project sends numeric OTP codes (not the default magic link).
              </p>
              <div>
                <Label htmlFor="otp">6-digit code</Label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </div>
              <Button type="submit" className="w-full" loading={loading}>
                Verify code
              </Button>
            </form>
          )}
        </div>
      ) : (
        <form onSubmit={handleEmailLinkSend} className="space-y-4">
          <p className="text-sm text-ink-muted">
            Supabase sends a one-time <strong>sign-in link</strong> (not a numeric code unless you enable Email OTP in
            your Supabase dashboard).
          </p>
          <div>
            <Label htmlFor="link-email">Email</Label>
            <Input
              id="link-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Send sign-in link
          </Button>
        </form>
      )}

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-cream-dark" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white/80 px-2 text-ink-muted">or</span>
        </div>
      </div>

      <Button variant="secondary" className="w-full" onClick={() => auth.signInWithGoogle()}>
        Continue with Google
      </Button>

      <p className="mt-6 text-center text-sm text-ink-muted">
        No account?{" "}
        <Link to="/signup" className="font-medium text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}

function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mesh-gradient flex min-h-screen items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-md rounded-3xl p-8"
      >
        <Link to="/" className="text-sm font-medium text-accent">
          ← Market Pulse
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </motion.div>
    </div>
  );
}

export { AuthLayout };
