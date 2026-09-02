"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type ToastKind = "success" | "error" | "info";
interface ToastState {
  msg: string;
  kind: ToastKind;
  id: number;
}

const ToastContext = createContext<((msg: string, kind?: ToastKind) => void) | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const show = useCallback((msg: string, kind: ToastKind = "success") => {
    setToast({ msg, kind, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const color =
    toast?.kind === "success" ? "#22c55e" : toast?.kind === "error" ? "#f87171" : "#BFC2DE";

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1100] bg-[#141414] px-5 py-3 flex items-center gap-3 shadow-[0_12px_30px_rgba(0,0,0,0.5)] max-w-[90vw]"
          style={{ border: `1px solid ${color}66` }}
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          />
          <span className="font-mono text-[11px] text-[#E6E6E6] tracking-[1px]">{toast.msg}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
