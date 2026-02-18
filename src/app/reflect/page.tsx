"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Starfield } from "@/components/Starfield";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/Button";

export default function ReflectPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "ready" | "saving" | "success" | "error">("idle");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const isAuthed = useMemo(() => !!playerId, [playerId]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus("ready");
        return;
      }
      const { data, error } = await supabase.rpc("ensure_player");
      if (error) {
        console.error("ensure_player error:", error);
        setErrMsg(error.message);
      } else {
        setPlayerId(data as string);
      }
      setStatus("ready");
    })();
  }, []);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg(null);
    if (!email) return;
    setIsSendingLink(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/reflect`,
      },
    });
    setIsSendingLink(false);
    if (error) {
      setErrMsg(error.message);
      setStatus("error");
    } else {
      setStatus("success");
    }
  }

  async function saveReflection() {
    if (!playerId || !text.trim()) return;
    setStatus("saving");
    const { error } = await supabase.from("reflections").insert({
      player_id: playerId,
      reflection_text: text,
    });
    if (error) {
      setErrMsg(error.message);
      setStatus("error");
    } else {
      setStatus("success");
      setText("");
    }
  }

  if (status === "idle") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Starfield />
        <div className="label-text opacity-40">◌ ◌ ◌</div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Starfield />

        <div className="max-w-md w-full">
          <div className="mb-12 text-center">
            <div className="label-text mb-6">◌ Authentication ◌</div>
            <h1 className="text-3xl md:text-4xl font-semibold mb-4">
              Sign in to reflect
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Enter your email to receive a magic link
            </p>
          </div>

          <form onSubmit={sendMagicLink} className="space-y-6">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="secondary"
              fullWidth
              disabled={!email || isSendingLink}
            >
              {isSendingLink ? "Sending..." : "Send Magic Link"}
            </Button>
          </form>

          {errMsg && (
            <div className="mt-6 p-4 border border-red-500/30 bg-red-500/10">
              <p className="text-red-400 text-sm">{errMsg}</p>
            </div>
          )}

          {status === "success" && (
            <div className="mt-6 p-4 border border-[var(--border-secondary)] bg-[var(--accent-faint)]">
              <p className="text-[var(--accent-primary)] text-sm">
                ✓ Check your email for the magic link!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Starfield />

      <div className="max-w-3xl w-full">
        <div className="mb-12 text-center">
          <div className="label-text mb-6">◌ Reflection ◌</div>
          <h1 className="text-3xl md:text-4xl font-semibold mb-4">
            Reflect on your journey
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            What insights have you discovered?
          </p>
        </div>

        <div className="space-y-6">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Begin writing your reflection..."
            rows={12}
          />

          <Button
            onClick={saveReflection}
            disabled={!text.trim() || status === "saving"}
            variant="secondary"
            fullWidth
          >
            {status === "saving" ? "Saving..." : "Save Reflection"}
          </Button>
        </div>

        {errMsg && (
          <div className="mt-6 p-4 border border-red-500/30 bg-red-500/10">
            <p className="text-red-400 text-sm">{errMsg}</p>
          </div>
        )}

        {status === "success" && (
          <div className="mt-6 p-4 border border-[var(--border-secondary)] bg-[var(--accent-faint)]">
            <p className="text-[var(--accent-primary)] text-sm text-center">
              ✓ Reflection saved successfully
            </p>
          </div>
        )}
      </div>
    </div>
  );
}