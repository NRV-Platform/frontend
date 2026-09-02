"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import type { User, SiteRole } from "@/lib/types";
import { AdminHead } from "@/components/admin/shared";
import { Card, Table, Select, Pill, Btn, ConfirmModal } from "@/components/ui/primitives";

const SITE_ROLES: SiteRole[] = ["admin", "editor", "user"];

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [confirm, setConfirm] = useState<User | null>(null);
  const isAdmin = me?.role === "admin";

  const load = async () => {
    try {
      const list = await api.get<User[]>("/users");
      setUsers(list);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to load users", "error");
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.get<User[]>("/users");
        if (!cancelled) setUsers(list);
      } catch (e) {
        if (!cancelled) toast(e instanceof ApiError ? e.message : "Failed to load users", "error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setRole = async (id: string, role: string) => {
    try {
      await api.patch(`/users/${id}/role`, { role });
      toast("Role updated");
      load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to update role", "error");
    }
  };

  const toggleSuspend = async () => {
    if (!confirm) return;
    try {
      await api.patch(`/users/${confirm.id}/suspend`, { suspended: !confirm.suspended });
      toast(confirm.suspended ? "Account reinstated" : "Account suspended");
      setConfirm(null);
      load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to update account", "error");
    }
  };

  return (
    <div>
      <AdminHead
        title="Users"
        sub="Roles: admin, editor, user. Role changes and suspend/reinstate are admin-only."
      />
      <Card pad={0} className="mb-6">
        <Table
          cols={[
            {
              h: "Account",
              render: (a: User) => (
                <div>
                  <div className="text-[#E6E6E6]">{a.name}</div>
                  <div className="text-[10px] text-[#555]">{a.email}</div>
                </div>
              ),
            },
            {
              h: "Role",
              render: (a: User) =>
                isAdmin ? (
                  <Select
                    value={a.role}
                    onChange={(e) => setRole(a.id, e.target.value)}
                    options={SITE_ROLES}
                    style={{ width: 130, padding: "6px 8px", fontSize: 11 }}
                  />
                ) : (
                  <Pill color="#BFC2DE">{a.role}</Pill>
                ),
            },
            {
              h: "Player Tag",
              render: (a: User) => <span className="text-[#888BA0]">{a.playerTag}</span>,
            },
            {
              h: "Discord",
              render: (a: User) =>
                a.discordId ? (
                  <span className="text-[#888BA0]">{a.discordId}</span>
                ) : (
                  <span className="text-[#333]">not linked</span>
                ),
            },
            {
              h: "Status",
              render: (a: User) =>
                a.suspended ? <Pill color="#f87171">suspended</Pill> : <Pill color="#4ade80">active</Pill>,
            },
            ...(isAdmin
              ? [
                  {
                    h: "",
                    right: true,
                    render: (a: User) =>
                      a.role !== "admin" && (
                        <Btn
                          variant={a.suspended ? "ghost" : "danger"}
                          style={{ padding: "5px 12px", fontSize: 9 }}
                          onClick={() => setConfirm(a)}
                        >
                          {a.suspended ? "Reinstate" : "Suspend"}
                        </Btn>
                      ),
                  },
                ]
              : []),
          ]}
          rows={users}
          keyFn={(a) => a.id}
        />
      </Card>
      <ConfirmModal
        open={!!confirm}
        title={confirm && confirm.suspended ? "Reinstate account" : "Suspend account"}
        danger={!!confirm && !confirm.suspended}
        confirmLabel={confirm && confirm.suspended ? "Reinstate" : "Suspend account"}
        body={
          confirm &&
          (confirm.suspended
            ? `Reinstate ${confirm.email}? They will be able to log in again.`
            : `Suspend ${confirm.email}? They are blocked from re-authenticating and any existing session is killed immediately.`)
        }
        onCancel={() => setConfirm(null)}
        onConfirm={toggleSuspend}
      />
    </div>
  );
}
