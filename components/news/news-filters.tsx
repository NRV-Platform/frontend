"use client";

import { useRouter } from "next/navigation";

export function NewsFilters({ cats, active }: { cats: string[]; active: string }) {
  const router = useRouter();
  return (
    <div className="flex gap-2 flex-wrap mb-7">
      {cats.map((c) => (
        <button
          key={c}
          onClick={() => router.push(c === "All" ? "/news" : `/news?category=${encodeURIComponent(c)}`)}
          className="font-mono text-[10px] tracking-[2px] uppercase px-3.5 py-1.5 cursor-pointer"
          style={{
            background: active === c ? "#7E82AC" : "transparent",
            border: `1px solid ${active === c ? "#7E82AC" : "rgba(126,130,172,0.35)"}`,
            color: active === c ? "#fff" : "#888BA0",
          }}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
