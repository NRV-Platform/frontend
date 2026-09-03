"use client";

import { useState } from "react";
import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Spark({ size = 12 }: { size?: number }) {
  return <span className="nrv-spark" style={{ width: size, height: size }} />;
}

export function SectionLabel({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <Spark />
      <span className="font-display font-extrabold text-[13px] tracking-[4px] text-[#E6E6E6] uppercase">
        {children}
      </span>
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}

export function PageHead({
  kicker,
  title,
  sub,
}: {
  kicker?: string;
  title: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="mb-9">
      {kicker && (
        <div className="font-mono text-[10px] text-[#888BA0] tracking-[4px] uppercase mb-2.5">
          {kicker}
        </div>
      )}
      <h1
        className="nrv-display text-[#E6E6E6] leading-none m-0"
        style={{ fontSize: "clamp(30px,5vw,52px)", letterSpacing: "-1px" }}
      >
        {title}
      </h1>
      {sub && (
        <p className="font-mono text-[12px] text-[#888BA0] leading-[1.7] mt-3.5 max-w-[640px]">
          {sub}
        </p>
      )}
    </div>
  );
}

export function Card({
  children,
  className = "",
  pad = 24,
  style,
}: {
  children: ReactNode;
  className?: string;
  pad?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`bg-[rgba(14,14,14,0.85)] border border-[rgba(126,130,172,0.3)] ${className}`}
      style={{ padding: pad, ...style }}
    >
      {children}
    </div>
  );
}

type BtnVariant = "primary" | "ghost" | "danger";

export function Btn({
  children,
  onClick,
  variant = "primary",
  disabled,
  className = "",
  style,
  type = "button",
}: {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: BtnVariant;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  type?: "button" | "submit";
}) {
  const variantClass =
    variant === "primary"
      ? "bg-[#7E82AC] border border-[#7E82AC] text-white"
      : variant === "danger"
      ? "bg-[#7f1d1d] border border-[#f87171] text-[#fecaca]"
      : "bg-transparent border border-[rgba(126,130,172,0.5)] text-[#BFC2DE]";
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`font-mono text-[11px] tracking-[2px] uppercase px-5 py-2.5 transition-opacity duration-150 ${
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:opacity-85"
      } ${variantClass} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}

export function Label({ children, req }: { children: ReactNode; req?: boolean }) {
  return (
    <label className="block font-mono text-[9px] tracking-[3px] uppercase text-[#888BA0] mb-1.5">
      {children}
      {req && <span className="text-[#FF6A39]"> *</span>}
    </label>
  );
}

const inputBase =
  "w-full bg-[#141418] border border-[rgba(126,130,172,0.35)] text-[#E6E6E6] px-3 py-2.5 font-mono text-[12px] outline-none focus:border-[#7E82AC] transition-colors";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={`${inputBase} ${className}`} />;
}

export function PasswordInput({
  blockClipboard,
  onPaste,
  onCopy,
  onCut,
  onDrop,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { blockClipboard?: boolean }) {
  const { className = "", ...rest } = props;
  const [visible, setVisible] = useState(false);
  const blockEvent = (e: React.SyntheticEvent) => e.preventDefault();
  return (
    <div className="relative">
      <input
        {...rest}
        type={visible ? "text" : "password"}
        onPaste={blockClipboard ? blockEvent : onPaste}
        onCopy={blockClipboard ? blockEvent : onCopy}
        onCut={blockClipboard ? blockEvent : onCut}
        onDrop={blockClipboard ? blockEvent : onDrop}
        autoComplete={blockClipboard ? "off" : rest.autoComplete}
        className={`${inputBase} pr-10 ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-0 top-0 bottom-0 px-3 flex items-center bg-transparent border-none cursor-pointer text-[#888BA0] hover:text-[#E6E6E6] transition-colors"
      >
        {visible ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 3l18 18M10.58 10.58a2 2 0 002.83 2.83M9.88 4.24A9.9 9.9 0 0112 4c5 0 9.27 3.11 11 8-.62 1.73-1.68 3.29-3.06 4.53M6.1 6.1C4.28 7.32 2.86 9.03 2 12c1.06 3.19 3.31 5.7 6.14 7.14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M2 12c1.73-4.89 6-8 10-8s8.27 3.11 10 8c-1.73 4.89-6 8-10 8s-8.27-3.11-10-8z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        )}
      </button>
    </div>
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`${inputBase} resize-y leading-[1.7] ${className}`}
    />
  );
}

type SelectOption = string | { value: string; label: string; disabled?: boolean };

export function Select({
  options,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[] }) {
  return (
    <select {...props} className={`${inputBase} ${className}`}>
      {options.map((o) =>
        typeof o === "string" ? (
          <option key={o} value={o}>
            {o}
          </option>
        ) : (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        )
      )}
    </select>
  );
}

export function Field({
  label,
  req,
  children,
  className = "",
  style,
}: {
  label: ReactNode;
  req?: boolean;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={className} style={style}>
      <Label req={req}>{label}</Label>
      {children}
    </div>
  );
}

const PILL_COLORS: Record<string, string> = {
  Upcoming: "#BFC2DE",
  Active: "#4ade80",
  Completed: "#888BA0",
  pending: "#fbbf24",
  approved: "#4ade80",
  rejected: "#f87171",
  waitlist: "#FF6A39",
  denied: "#f87171",
  scheduled: "#BFC2DE",
  final: "#4ade80",
  forfeit: "#f87171",
  postponed: "#fbbf24",
  cancelled: "#555",
  draft: "#fbbf24",
  published: "#4ade80",
  locked: "#f87171",
  open: "#4ade80",
  synced: "#4ade80",
  failed: "#f87171",
  stale: "#fbbf24",
};

export function Pill({ children, color }: { children: ReactNode; color?: string }) {
  const key = typeof children === "string" ? children : "";
  const c = color || PILL_COLORS[key] || "#888BA0";
  return (
    <span
      className="font-mono text-[9px] tracking-[2px] uppercase whitespace-nowrap px-2 py-0.5"
      style={{ color: c, border: `1px solid ${c}44` }}
    >
      {children}
    </span>
  );
}

export function TeamChip({
  tag,
  color,
  isNrv,
  dim,
}: {
  tag: string;
  color?: string | null;
  isNrv?: boolean;
  dim?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="w-[3px] h-4 flex-shrink-0"
        style={{ background: isNrv ? color || "#444" : "#444" }}
      />
      <span
        className="font-display font-bold text-[14px] tracking-[1.5px] uppercase"
        style={{ color: dim ? "#555" : isNrv ? "#E6E6E6" : "#9a9db5" }}
      >
        {tag}
      </span>
    </span>
  );
}

export interface TableCol<T> {
  h: string;
  right?: boolean;
  render: (row: T, i: number) => ReactNode;
}

export function Table<T>({
  cols,
  rows,
  onRowClick,
  keyFn,
}: {
  cols: TableCol<T>[];
  rows: T[];
  onRowClick?: (row: T, i: number) => void;
  keyFn?: (row: T, i: number) => string | number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th
                key={i}
                className="font-mono text-[9px] tracking-[2px] uppercase text-[#555] px-3 py-2.5 whitespace-nowrap border-b border-[rgba(126,130,172,0.25)]"
                style={{ textAlign: c.right ? "right" : "left" }}
              >
                {c.h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr
              key={keyFn ? keyFn(r, ri) : ri}
              onClick={onRowClick ? () => onRowClick(r, ri) : undefined}
              className={`transition-colors duration-150 ${
                onRowClick ? "cursor-pointer hover:bg-[rgba(126,130,172,0.07)]" : ""
              }`}
            >
              {cols.map((c, ci) => (
                <td
                  key={ci}
                  className="font-mono text-[12px] text-[#BFC2DE] px-3 py-3 border-b border-[rgba(255,255,255,0.04)]"
                  style={{ textAlign: c.right ? "right" : "left" }}
                >
                  {c.render(r, ri)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <Empty label="Nothing here yet" />}
    </div>
  );
}

export function Empty({ label }: { label: string }) {
  return (
    <div className="py-9 px-5 text-center font-mono text-[11px] text-[#444] tracking-[2px] uppercase">
      {label}
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel = "Delete",
  danger = true,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex items-center justify-center p-5"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[440px] max-w-full bg-[#141414] shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
        style={{
          border: `1px solid ${danger ? "rgba(248,113,113,0.35)" : "rgba(126,130,172,0.4)"}`,
        }}
      >
        <div className="px-[22px] py-[18px] border-b border-white/[0.06] flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center font-display font-black text-[16px] flex-shrink-0"
            style={{
              border: `1.5px solid ${danger ? "#f87171" : "#7E82AC"}`,
              color: danger ? "#f87171" : "#BFC2DE",
            }}
          >
            !
          </div>
          <div className="font-display font-bold text-[17px] text-[#E6E6E6] tracking-[1px] uppercase">
            {title}
          </div>
        </div>
        <div className="px-[22px] py-5 font-mono text-[12px] text-[#888BA0] leading-[1.7]">
          {body}
        </div>
        <div className="px-[22px] py-3.5 border-t border-white/[0.06] flex gap-2.5 justify-end bg-[#0E0E0E]">
          <Btn variant="ghost" onClick={onCancel}>
            Cancel
          </Btn>
          <Btn variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Btn>
        </div>
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-[88vh] overflow-y-auto bg-[#141414] border border-[rgba(126,130,172,0.4)] shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
        style={{ width }}
      >
        <div className="px-[22px] py-4 border-b border-white/[0.06] font-display font-bold text-[16px] text-[#E6E6E6] tracking-[1px] uppercase">
          {title}
        </div>
        <div className="p-[22px]">{children}</div>
        {footer && (
          <div className="px-[22px] py-3.5 border-t border-white/[0.06] flex gap-2.5 justify-end bg-[#0E0E0E]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function fmtDT(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase() +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

export function fmtD(iso?: string | null) {
  if (!iso) return "—";
  const hasTime = iso.includes("T");
  const d = new Date(hasTime ? iso : iso + "T12:00");
  return d
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
}

export function Md({ text, className = "" }: { text: string; className?: string }) {
  const blocks = String(text || "").split(/\n\n+/);
  const inline = (s: string) => {
    const parts = s.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith("**") ? (
        <strong key={i} className="text-[#E6E6E6]">
          {p.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{p}</span>
      )
    );
  };
  return (
    <div className={`font-mono text-[13px] text-[#9a9db5] leading-[1.9] ${className}`}>
      {blocks.map((b, i) => {
        if (b.startsWith("## "))
          return (
            <h2
              key={i}
              className="font-display font-extrabold text-[19px] tracking-[1.5px] uppercase text-[#E6E6E6] mt-7 mb-3"
            >
              {b.slice(3)}
            </h2>
          );
        if (b.startsWith("> "))
          return (
            <blockquote
              key={i}
              className="border-l-2 border-[#7E82AC] pl-4 my-4 text-[#BFC2DE]"
            >
              {inline(b.slice(2))}
            </blockquote>
          );
        if (b.split("\n").every((l) => l.startsWith("- ")))
          return (
            <ul key={i} className="my-3.5 pl-5 flex flex-col gap-1.5 list-disc">
              {b.split("\n").map((l, j) => (
                <li key={j}>{inline(l.slice(2))}</li>
              ))}
            </ul>
          );
        return (
          <p key={i} className="my-3.5">
            {inline(b)}
          </p>
        );
      })}
    </div>
  );
}
