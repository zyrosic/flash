"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, Download, LogOut, RefreshCcw, Sparkles } from "lucide-react";

type Flashcard = {
  question: string;
  answer: string;
  tags?: string[];
};

type Msg = { role: "user" | "assistant"; content: string };

function toCsv(cards: Flashcard[]) {
  const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
  const rows = [["Question", "Answer"], ...cards.map((c) => [c.question, c.answer])];
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}

function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState(12);
  const [style, setStyle] = useState<"balanced" | "exam" | "simple">("balanced");
  const [mode, setMode] = useState<"auto" | "questions" | "short_notes">("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("Flashcards");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [frontBg, setFrontBg] = useState<string>("");
  const [backBg, setBackBg] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      // Load profile card theme
      const userId = data.session.user.id;
      const { data: prof } = await supabase
        .from("profiles")
        .select("front_bg_url,back_bg_url")
        .eq("id", userId)
        .maybeSingle();
      setFrontBg(String((prof as any)?.front_bg_url ?? ""));
      setBackBg(String((prof as any)?.back_bg_url ?? ""));
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace("/login");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, cards]);

  const hasConversation = messages.length > 0;

  const placeholderExamples = useMemo(
    () => [
      "Paste your class notes, textbook summary, or lecture transcript…",
      "Example: Semiconductor – p-n junction, diode equation, Zener diode…",
      "Example: Biology – photosynthesis steps, Calvin cycle, chloroplast…",
    ],
    []
  );

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function generate() {
    setError(null);
    const clean = notes.trim();
    if (!clean) {
      setError("Please paste your notes first.");
      return;
    }

    setLoading(true);
    setMessages((m) => [...m, { role: "user", content: clean }]);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Please log in again.");

      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: clean, count, style, mode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to generate");

      const nextTitle = String(json?.title ?? "Flashcards");
      const nextCards = Array.isArray(json?.flashcards) ? (json.flashcards as Flashcard[]) : [];

      setTitle(nextTitle);
      setCards(nextCards);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Done. I created ${nextCards.length} flashcards: "${nextTitle}". Tap a card to flip, copy, or export.`,
        },
      ]);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "I couldn't generate flashcards from that input. Try shorter notes or clearer headings.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setNotes("");
    setCards([]);
    setMessages([]);
    setError(null);
    setTitle("Flashcards");
  }

  if (checking) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh relative">
      {/* Background aura */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,_rgba(99,102,241,0.28),transparent_55%),radial-gradient(ellipse_at_center,_rgba(236,72,153,0.22),transparent_60%),radial-gradient(ellipse_at_bottom_left,_rgba(249,115,22,0.22),transparent_55%),linear-gradient(to_bottom,_rgba(10,10,12,0.92),_rgba(10,10,12,0.72),_rgba(255,255,255,0.02))]" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-white/10 border border-white/10 grid place-items-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Flashcard Notes Generator</div>
              <div className="text-lg font-semibold tracking-tight">FlashForge Studio</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="rounded-xl" onClick={() => router.push("/")}
            >
              Home
            </Button>
            <Button variant="ghost" className="rounded-xl" onClick={() => router.push("/dashboard/history")}
            >
              History
            </Button>
            <Button variant="ghost" className="rounded-xl" onClick={() => router.push("/dashboard/profile")}
            >
              Profile
            </Button>
            <Button variant="ghost" className="rounded-xl" onClick={reset}>
              <RefreshCcw className="h-4 w-4 mr-2" /> New
            </Button>
            <Button variant="ghost" className="rounded-xl" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>

        <div className="mt-10">
          {!hasConversation ? (
            <section className="min-h-[68vh] flex flex-col items-center justify-center text-center">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                Ready to generate flashcards?
              </h1>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl">
                Paste your notes, choose style, and get clean cards you can flip & export.
              </p>

              <Card className="mt-8 w-full max-w-3xl p-3 sm:p-4 rounded-3xl bg-background/50 border-white/10 backdrop-blur-xl shadow-2xl">
                <div className="flex flex-col gap-3">
                  <textarea
                    className="w-full min-h-[140px] sm:min-h-[170px] resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-4 outline-none focus:ring-2 focus:ring-primary/35 text-sm sm:text-base"
                    placeholder={placeholderExamples.join("\n")}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                      <span className="text-xs text-muted-foreground">Cards</span>
                      <input
                        className="w-16 bg-transparent text-sm outline-none"
                        type="number"
                        min={3}
                        max={50}
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                      />
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                      <span className="text-xs text-muted-foreground">Style</span>
                      <select
                        className="bg-transparent text-sm outline-none"
                        value={style}
                        onChange={(e) => setStyle(e.target.value as any)}
                      >
                        <option value="balanced">Balanced</option>
                        <option value="exam">Exam-focused</option>
                        <option value="simple">Simple</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                      <span className="text-xs text-muted-foreground">Type</span>
                      <select
                        className="bg-transparent text-sm outline-none"
                        value={mode}
                        onChange={(e) => setMode(e.target.value as any)}
                      >
                        <option value="auto">Auto</option>
                        <option value="short_notes">Short notes</option>
                        <option value="questions">Questions</option>
                      </select>
                    </div>

                    <div className="flex-1" />
                    <Button className="rounded-2xl" onClick={generate} disabled={loading}>
                      {loading ? "Generating…" : "Generate"}
                    </Button>
                  </div>

                  {error && (
                    <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
                      {error}
                    </div>
                  )}
                </div>
              </Card>

              <p className="mt-4 text-xs text-muted-foreground">Tip: headings + bullet points produce the best cards.</p>
            </section>
          ) : (
            <section className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
              {/* Conversation */}
              <Card className="rounded-3xl bg-background/45 border-white/10 backdrop-blur-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Studio</div>
                    <div className="text-xs text-muted-foreground">Notes → flashcards</div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="rounded-xl">
                        <Download className="h-4 w-4 mr-2" /> Export
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Export flashcards</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Button
                          className="w-full rounded-xl"
                          onClick={() =>
                            downloadText(
                              `${title.replace(/\s+/g, "-").toLowerCase()}.csv`,
                              toCsv(cards),
                              "text/csv"
                            )
                          }
                          disabled={!cards.length}
                        >
                          Download CSV
                        </Button>
                        <Button
                          variant="secondary"
                          className="w-full rounded-xl"
                          onClick={() =>
                            downloadText(
                              `${title.replace(/\s+/g, "-").toLowerCase()}.json`,
                              JSON.stringify({ title, flashcards: cards }, null, 2),
                              "application/json"
                            )
                          }
                          disabled={!cards.length}
                        >
                          Download JSON
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="px-5 py-5 space-y-4 max-h-[70vh] overflow-auto">
                  {messages.map((m, idx) => (
                    <div key={idx} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                      <div
                        className={
                          m.role === "user"
                            ? "max-w-[92%] sm:max-w-[75%] rounded-2xl bg-primary/15 border border-primary/20 px-4 py-3"
                            : "max-w-[92%] sm:max-w-[75%] rounded-2xl bg-white/5 border border-white/10 px-4 py-3"
                        }
                      >
                        <div className="text-xs text-muted-foreground mb-1">{m.role === "user" ? "You" : "AI"}</div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <div className="p-4 border-t border-white/10">
                  <div className="flex flex-col gap-3">
                    <textarea
                      className="w-full min-h-[110px] resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/35 text-sm"
                      placeholder="Paste more notes to generate a new set…"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                        <span className="text-xs text-muted-foreground">Cards</span>
                        <input
                          className="w-16 bg-transparent text-sm outline-none"
                          type="number"
                          min={3}
                          max={50}
                          value={count}
                          onChange={(e) => setCount(Number(e.target.value))}
                        />
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                        <span className="text-xs text-muted-foreground">Style</span>
                        <select
                          className="bg-transparent text-sm outline-none"
                          value={style}
                          onChange={(e) => setStyle(e.target.value as any)}
                        >
                          <option value="balanced">Balanced</option>
                          <option value="exam">Exam-focused</option>
                          <option value="simple">Simple</option>
                        </select>
                      </div>
                      <div className="flex-1" />
                      <Button className="rounded-2xl" onClick={generate} disabled={loading}>
                        {loading ? "Generating…" : "Generate"}
                      </Button>
                    </div>
                    {error && (
                      <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
                        {error}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Flashcards */}
              <Card className="rounded-3xl bg-background/45 border-white/10 backdrop-blur-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                  <div className="text-sm font-medium">{title}</div>
                  <div className="text-xs text-muted-foreground">
                    {cards.length ? `${cards.length} cards • tap to flip` : "Your cards will appear here"}
                  </div>
                </div>

                <div className="p-5">
                  {cards.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Generate once to see beautiful flashcards here.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {cards.map((c, i) => (
                        <FlipCard key={i} card={c} frontBg={frontBg} backBg={backBg} />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function FlipCard({
  card,
  frontBg,
  backBg,
}: {
  card: Flashcard;
  frontBg: string;
  backBg: string;
}) {
  const [flipped, setFlipped] = useState(false);
  const text = flipped ? card.answer : card.question;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${card.question}\n\n${card.answer}`);
    } catch {
      // ignore
    }
  }

  return (
    <button type="button" onClick={() => setFlipped((s) => !s)} className="text-left w-full group">
      <div
        className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-transform duration-200 group-hover:scale-[1.01] overflow-hidden relative"
        style={
          (flipped ? backBg : frontBg)
            ? {
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${flipped ? backBg : frontBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div className="text-xs text-muted-foreground">{flipped ? "Answer" : "Question"}</div>
          <span
            onClick={(e) => {
              e.stopPropagation();
              copy();
            }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            role="button"
            tabIndex={0}
          >
            <Copy className="h-3.5 w-3.5" /> Copy
          </span>
        </div>
        <div className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{text}</div>
        {Array.isArray(card.tags) && card.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {card.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="text-[11px] px-2 py-1 rounded-full border border-white/10 bg-white/5 text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
