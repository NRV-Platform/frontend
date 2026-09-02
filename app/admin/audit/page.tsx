"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AuditLogEntry } from "@/lib/types";
import { AdminHead } from "@/components/admin/shared";
import { Card, Table, fmtDT } from "@/components/ui/primitives";

export default function AdminAuditPage() {
  const [audit, setAudit] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    api.get<AuditLogEntry[]>("/audit").then(setAudit).catch(() => setAudit([]));
  }, []);

  return (
    <div>
      <AdminHead
        title="Audit Log"
        sub="Actor, action, target, timestamp — recorded on approvals, deletions, role changes, results, and rulebook versions."
      />
      <Card pad={0}>
        <Table
          cols={[
            { h: "When", render: (a: AuditLogEntry) => <span className="whitespace-nowrap text-[#555]">{fmtDT(a.at)}</span> },
            { h: "Actor", render: (a: AuditLogEntry) => <span className="text-[#BFC2DE]">{a.actor?.name ?? a.actorId}</span> },
            { h: "Action", render: (a: AuditLogEntry) => <span className="text-[#E6E6E6]">{a.action}</span> },
            { h: "Target", render: (a: AuditLogEntry) => <span>{a.target}</span> },
          ]}
          rows={audit}
          keyFn={(a) => a.id}
        />
      </Card>
    </div>
  );
}
