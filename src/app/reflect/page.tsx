"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ReflectPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sendingLink" | "ready" | "saving" | "success" | "error">("idle");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [errMsg, setErrMsg] = useState<string | null>(null);
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
    setStatus("sendingLink");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/reflect`,
      },
    });
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

  if (status === "idle" || status === "sendingLink") {
    return <div className="p-8 text-white">Loading...</div>;
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <h1 className="text-3xl mb-6">Sign in to reflect</h1>
          <form onSubmit={sendMagicLink} className="space-y-4">
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded"
            />
            <button
              type="submit"
              className="w-full p-3 bg-teal-500 hover:bg-teal-600 rounded font-semibold"
            >
              Send magic link
            </button>
          </form>
          {errMsg && <p className="mt-4 text-red-500">{errMsg}</p>}
          {status === "success" && <p className="mt-4 text-green-500">Check your email!</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl mb-6">Reflect on your journey</h1>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What did you discover?"
          className="w-full h-64 p-4 bg-gray-900 border border-gray-700 rounded resize-none"
        />
        <button
          onClick={saveReflection}
          disabled={!text.trim() || status === "saving"}
          className="mt-4 w-full p-3 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-700 rounded font-semibold"
        >
          {status === "saving" ? "Saving..." : "Save reflection"}
        </button>
        {errMsg && <p className="mt-4 text-red-500">{errMsg}</p>}
        {status === "success" && <p className="mt-4 text-green-500">Reflection saved!</p>}
      </div>
    </div>
  );
}