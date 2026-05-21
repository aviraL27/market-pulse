import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Completing sign in…");

  useEffect(() => {
    const finish = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "email" | "magiclink" | "signup" | "recovery",
          });
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session) {
          navigate("/app", { replace: true });
        } else {
          setMessage("Sign-in link expired or invalid. Request a new one.");
          setTimeout(() => navigate("/login", { replace: true }), 2500);
        }
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Sign in failed");
        setTimeout(() => navigate("/login", { replace: true }), 2500);
      }
    };

    void finish();
  }, [navigate]);

  return (
    <div className="mesh-gradient flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <p className="text-sm text-ink-muted">{message}</p>
    </div>
  );
}
