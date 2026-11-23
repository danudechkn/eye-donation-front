"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Search,
  UserPlus,
  RefreshCw,
  Trash2,
  Eye,
  HeartPulse,
  Users,
  Power,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { api } from "@/hooks/useApi";
import { useUserRealtime } from "@/hooks/useRealtime";
import { Toast, useToast } from "@/components/ui/Toast";
import { AddUserModal } from "@/components/admin/AddUserModal";
import { RoleMultiSelect } from "@/components/admin/RoleMultiSelect";
import type { AppRole, ManagedUserItem, ManagedUserPayload, UserStatus } from "@/types";

function getUserStatus(u: ManagedUserItem): UserStatus {
  if (u.status === "pending" || u.status === "active" || u.status === "suspended") {
    return u.status;
  }
  return u.is_active ? "active" : "pending";
}

export default function AdminUsersPage() {
  const { notification, visible: toastVisible, showToast, dismissToast } = useToast();

  const [users, setUsers] = useState<ManagedUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadUsers = useCallback(
    async (search?: string, silent = false) => {
      try {
        if (!silent) setLoading(true);
        const res = await api.getUsers(search);
        if (res.success && Array.isArray(res.data)) {
          setUsers(res.data);
        }
      } catch (err: unknown) {
        if (!silent) {
          const msg = err instanceof Error ? err.message : "ไม่สามารถโหลดรายชื่อผู้ใช้งานได้";
          showToast("error", msg);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [showToast],
  );

  // อัปเดตรายชื่อผู้ใช้แบบ Real-time เมื่อมีผู้ใช้ใหม่ล็อกอินเข้ามา หรือ Admin คนอื่นแก้ไขสิทธิ์
  useUserRealtime(() => {
    void loadUsers(searchTerm, true);
  });

  useEffect(() => {
    let active = true;
    api
      .getUsers()
      .then((res) => {
        if (!active) return;
        if (res.success && Array.isArray(res.data)) {
          setUsers(res.data);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        const msg = err instanceof Error ? err.message : "ไม่สามารถโหลดรายชื่อผู้ใช้งานได้";
        showToast("error", msg);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [showToast]);

  const handleRoleChange = async (userItem: ManagedUserItem, nextRole: AppRole) => {
    if (userItem.app_role === nextRole) return;
    try {
      setUpdatingId(userItem.id);
      await api.updateUser(userItem.id, { app_role: nextRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userItem.id ? { ...u, app_role: nextRole } : u)),
      );
      showToast("success", `อัปเดตสิทธิ์ของ ${userItem.name} เรียบร้อยแล้ว`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถเปลี่ยนสิทธิ์ได้";
      showToast("error", msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = async (userItem: ManagedUserItem, nextStatus: UserStatus) => {
    try {
      setUpdatingId(userItem.id);
      const nextActive = nextStatus === "active";
      await api.updateUser(userItem.id, { status: nextStatus, is_active: nextActive });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userItem.id
            ? { ...u, status: nextStatus, is_active: nextActive }
            : u,
        ),
      );
      const currentStatus = getUserStatus(userItem);
      showToast(
        "success",
        nextStatus === "active"
          ? currentStatus === "pending"
            ? `อนุมัติสิทธิ์ให้ ${userItem.name} เรียบร้อยแล้ว`
            : `เปิดใช้งานบัญชี ${userItem.name} อีกครั้งแล้ว`
          : `ระงับการใช้งานบัญชี ${userItem.name} ชั่วคราวแล้ว`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถอัปเดตสถานะได้";
      showToast("error", msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userItem: ManagedUserItem) => {
    if (!window.confirm(`ยืนยันการลบผู้ใช้งาน "${userItem.name}" ออกจากรายการสิทธิ์?`)) {
      return;
    }
    try {
      setUpdatingId(userItem.id);
      await api.deleteUser(userItem.id);
      setUsers((prev) => prev.filter((u) => u.id !== userItem.id));
      showToast("success", `ลบผู้ใช้งาน ${userItem.name} สำเร็จ`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถลบผู้ใช้งานได้";
      showToast("error", msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateUser = async (payload: ManagedUserPayload) => {
    try {
      setCreating(true);
      await api.createUser(payload);
      setShowAddModal(false);
      showToast("success", "เพิ่มผู้ใช้งานและกำหนดสิทธิ์สำเร็จ");
      await loadUsers(searchTerm);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถเพิ่มผู้ใช้งานได้";
      showToast("error", msg);
    } finally {
      setCreating(false);
    }
  };

  const pendingCount = users.filter((u) => getUserStatus(u) === "pending").length;
  const eyeCount = users.filter(
    (u) => getUserStatus(u) === "active" && (u.app_role === "eye" || u.app_role === "both"),
  ).length;
  const organCount = users.filter(
    (u) =>
      getUserStatus(u) === "active" && (u.app_role === "organ" || u.app_role === "both"),
  ).length;
  const adminCount = users.filter(
    (u) => getUserStatus(u) === "active" && u.app_role === "admin",
  ).length;

  return (
    <div className="min-h-screen bg-slate-50/60 p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#0288d1]" />
            <span>จัดการสิทธิ์ผู้ใช้งาน (Role Management)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            กำหนดสิทธิ์แยกการเข้าถึงระหว่างระบบบริจาคดวงตา, ระบบบริจาคอวัยวะ และผู้ดูแลระบบ
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#29b6f6] hover:bg-[#0288d1] text-white font-semibold text-sm rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>เพิ่มผู้ใช้งาน</span>
        </button>
      </div>

      <Toast notification={notification} visible={toastVisible} onClose={dismissToast} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/70 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">ผู้ใช้งานทั้งหมด</p>
            <p className="text-xl font-bold text-slate-800">{users.length} คน</p>
          </div>
        </div>

        <div
          className={`bg-white p-4 rounded-2xl border flex items-center gap-3.5 ${pendingCount > 0 ? "border-amber-300/80 bg-amber-50/30" : "border-slate-200/70"
            }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">รออนุมัติ</p>
            <p className="text-xl font-bold text-amber-600">{pendingCount} คน</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/70 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">สิทธิ์บริจาคดวงตา</p>
            <p className="text-xl font-bold text-sky-700">{eyeCount} คน</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/70 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">สิทธิ์บริจาคอวัยวะ</p>
            <p className="text-xl font-bold text-rose-700">{organCount} คน</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/70 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">ผู้ดูแลระบบ (ทั้งหมด)</p>
            <p className="text-xl font-bold text-emerald-700">{adminCount} คน</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void loadUsers(searchTerm)}
              placeholder="ค้นหาชื่อ, Provider ID, หน่วยงาน..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-sm font-bold text-slate-700">
                <th className="py-3.5 px-5">ผู้ใช้งาน</th>
                <th className="py-3.5 px-5">Provider ID</th>
                <th className="py-3.5 px-5">ตำแหน่ง / หน่วยงาน</th>
                <th className="py-3.5 px-5 w-60">สิทธิ์ระบบ (Role)</th>
                <th className="py-3.5 px-5 text-center">สถานะ</th>
                <th className="py-3.5 px-5 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-sky-500" />
                      <span>กำลังโหลดรายชื่อผู้ใช้งาน...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    ไม่พบข้อมูลผู้ใช้งาน
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isBusy = updatingId === u.id;
                  const status = getUserStatus(u);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-slate-800">
                        {u.name}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-600">
                        {u.provider_id || u.cid || "-"}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">
                        <div>{u.position || "-"}</div>
                        {u.hospcode && (
                          <span className="text-xs text-slate-400">
                            รหัสหน่วย: {u.hospcode}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <RoleMultiSelect
                          value={u.app_role}
                          disabled={isBusy}
                          onChange={(nextRole) => void handleRoleChange(u, nextRole)}
                        />
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {status === "active" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                            ใช้งานปกติ
                          </span>
                        ) : status === "pending" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
                            รออนุมัติ
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
                            ระงับสิทธิ์
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {status === "pending" ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleStatusChange(u, "active")}
                              title="อนุมัติและเปิดใช้งานสิทธิ์นี้"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>อนุมัติ</span>
                            </button>
                          ) : status === "suspended" ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleStatusChange(u, "active")}
                              title="เปิดใช้งานบัญชีนี้อีกครั้ง"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/80 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <Power className="w-3.5 h-3.5" />
                              <span>เปิดใช้งาน</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleStatusChange(u, "suspended")}
                              title="ระงับสิทธิ์ชั่วคราว"
                              className="p-2 rounded-xl border text-amber-600 border-amber-200/70 hover:bg-amber-50 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleDeleteUser(u)}
                            title="ลบผู้ใช้งาน"
                            className="p-2 rounded-xl border border-rose-200/70 text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddUserModal
        open={showAddModal}
        submitting={creating}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateUser}
      />
    </div>
  );
}
