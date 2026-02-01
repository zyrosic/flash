"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else router.push("/dashboard");
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-4">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,_rgba(99,102,241,0.25),transparent_55%),radial-gradient(ellipse_at_center,_rgba(236,72,153,0.18),transparent_60%),linear-gradient(to_bottom,_rgba(0,0,0,0.85),_rgba(0,0,0,0.55))]" />

      <Card className="w-full max-w-md p-6 sm:p-8 backdrop-blur bg-background/60 border-white/10 rounded-3xl">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to generate flashcards from your notes.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Email</label>
            <input
              className="w-full rounded-2xl border bg-background/50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Password</label>
            <input
              className="w-full rounded-2xl border bg-background/50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
              {error}
            </div>
          )}

          <Button className="w-full rounded-2xl" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          Don’t have an account?{" "}
          <Link className="text-foreground underline underline-offset-4" href="/signup">
            Create one
          </Link>
        </p>
      </Card>
    </main>
  );
}

