"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { Card, Field, Input, Btn } from "@/components/ui/primitives";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const res =
      mode === "login"
        ? await login(email.trim().toLowerCase(), password)
        : await signup(email.trim().toLowerCase(), password, name.trim());
    setBusy(false);
    if (!res.ok) {
      setErr(res.error || "Something went wrong");
      return;
    }
    toast(mode === "login" ? "Logged in" : "Account created");
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ padding: "100px 20px 60px" }}>
      <div className="w-[420px] max-w-full">
        <div className="text-center mb-8">
          <Image
            src="/assets/nerve-wordmark.png"
            alt="NERVE"
            width={4096}
            height={896}
            priority
            style={{ width: 220, height: "auto", opacity: 0.9, margin: "0 auto" }}
          />
          <div className="font-mono text-[10px] text-[#888BA0] tracking-[5px] uppercase mt-2.5">
            {mode === "login" ? "Account login" : "Create an account"}
          </div>
        </div>
        <Card pad={28}>
          <form onSubmit={submit} className="flex flex-col gap-4.5" style={{ gap: 18 }}>
            {mode === "signup" && (
              <Field label="Name" req>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
            )}
            <Field label="Email" req>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </Field>
            <Field label="Password" req>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </Field>
            {err && <div className="font-mono text-[11px] text-[#f87171] leading-[1.6]">{err}</div>}
            <Btn type="submit" disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            </Btn>
          </form>
        </Card>
        <div className="mt-5 text-center">
          <button
            onClick={() => {
              setMode((m) => (m === "login" ? "signup" : "login"));
              setErr("");
            }}
            className="font-mono text-[11px] text-[#888BA0] tracking-[1px] uppercase cursor-pointer bg-transparent border-none hover:text-[#E6E6E6]"
          >
            {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
