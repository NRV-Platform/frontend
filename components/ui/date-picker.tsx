"use client";

import { useEffect, useRef, useState } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// Parses "YYYY-MM-DD" (local, no timezone shift) into a Date at local midnight.
function parseDateOnly(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateOnly(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function displayDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad = first.getDay();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

function sameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const triggerBase =
  "w-full bg-[#141418] border border-[rgba(126,130,172,0.35)] text-[#E6E6E6] px-3 py-2.5 font-mono text-[12px] outline-none focus:border-[#7E82AC] transition-colors text-left cursor-pointer flex items-center justify-between gap-2";

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-[#7E82AC]">
      <rect x="3" y="5" width="18" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 9.5H21" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3V6.5M16 3V6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CalendarPanel({
  selected,
  onSelect,
  viewDate,
  setViewDate,
}: {
  selected: Date | null;
  onSelect: (d: Date) => void;
  viewDate: Date;
  setViewDate: (d: Date) => void;
}) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const cells = buildMonthGrid(year, month);
  const today = new Date();

  return (
    <div className="w-[260px]">
      <div className="flex items-center justify-between px-1 pb-2.5 mb-2.5 border-b border-[rgba(126,130,172,0.2)]">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          aria-label="Previous month"
          className="bg-transparent border-none text-[#888BA0] hover:text-[#E6E6E6] cursor-pointer px-1.5 py-1 font-mono text-[13px]"
        >
          ←
        </button>
        <span className="font-display font-bold text-[12px] tracking-[1px] text-[#E6E6E6] uppercase">
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          aria-label="Next month"
          className="bg-transparent border-none text-[#888BA0] hover:text-[#E6E6E6] cursor-pointer px-1.5 py-1 font-mono text-[13px]"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-center font-mono text-[9px] text-[#555] tracking-[1px] py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const isSelected = sameDay(d, selected);
          const isToday = sameDay(d, today);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(d)}
              className="aspect-square font-mono text-[11px] cursor-pointer transition-colors"
              style={{
                background: isSelected ? "#7E82AC" : "transparent",
                color: isSelected ? "#fff" : isToday ? "#BFC2DE" : "#BFC2DE",
                border: isToday && !isSelected ? "1px solid rgba(126,130,172,0.5)" : "1px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = "rgba(126,130,172,0.15)";
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = "transparent";
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date…",
  style,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseDateOnly(value);
  const [viewDate, setViewDate] = useState(selected ?? new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) setViewDate(selected);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative" style={style}>
      <button type="button" onClick={() => setOpen((o) => !o)} className={triggerBase}>
        <span className={selected ? "" : "text-[#555]"}>
          {selected ? displayDate(selected) : placeholder}
        </span>
        <CalendarIcon />
      </button>
      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-[400] bg-[#0E0E0E] border border-[rgba(126,130,172,0.35)] border-t-2 border-t-[#7E82AC] p-3.5 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
          <CalendarPanel
            selected={selected}
            viewDate={viewDate}
            setViewDate={setViewDate}
            onSelect={(d) => {
              onChange(formatDateOnly(d));
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

// Value/onChange use the native <input type="datetime-local"> format:
// "YYYY-MM-DDTHH:mm" — so this drops in wherever that was used before.
export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date & time…",
  style,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const [datePart, timePart] = value ? value.split("T") : ["", ""];
  const selected = datePart ? parseDateOnly(datePart) : null;
  const [viewDate, setViewDate] = useState(selected ?? new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) setViewDate(selected);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const commitDate = (d: Date) => {
    onChange(`${formatDateOnly(d)}T${timePart || "00:00"}`);
  };
  const commitTime = (t: string) => {
    onChange(`${datePart || formatDateOnly(new Date())}T${t}`);
  };

  return (
    <div ref={ref} className="relative" style={style}>
      <button type="button" onClick={() => setOpen((o) => !o)} className={triggerBase}>
        <span className={selected ? "" : "text-[#555]"}>
          {selected ? `${displayDate(selected)}${timePart ? " · " + timePart : ""}` : placeholder}
        </span>
        <CalendarIcon />
      </button>
      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-[400] bg-[#0E0E0E] border border-[rgba(126,130,172,0.35)] border-t-2 border-t-[#7E82AC] p-3.5 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
          <CalendarPanel selected={selected} viewDate={viewDate} setViewDate={setViewDate} onSelect={commitDate} />
          <div className="mt-3 pt-3 border-t border-[rgba(126,130,172,0.2)] flex items-center gap-2.5">
            <span className="font-mono text-[9px] text-[#555] tracking-[2px] uppercase">Time</span>
            <input
              type="time"
              value={timePart || ""}
              onChange={(e) => commitTime(e.target.value)}
              className="flex-1 bg-[#141418] border border-[rgba(126,130,172,0.35)] text-[#E6E6E6] px-2.5 py-1.5 font-mono text-[12px] outline-none focus:border-[#7E82AC]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
