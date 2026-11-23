"use client";

import { useState } from "react";
import { X, UserPlus, RefreshCw } from "lucide-react";
import { RoleMultiSelect } from "@/components/admin/RoleMultiSelect";
import type { AppRole, ManagedUserPayload } from "@/types";

interface AddUserModalProps {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: ManagedUserPayload) => Promise<void>;
}

const INPUT_CLS =
  "w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all";

export function AddUserModal({ open, submitting, onClose, onSubmit }: AddUserModalProps) {
  const [providerId, setProviderId] = useState("");
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [hospcode, setHospcode] = useState("10664");
  const [appRole, setAppRole] = useState<AppRole>("eye");

  if (!open) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      provider_id: providerId.trim(),
      name: name.trim(),
      position: position.trim() || null,
      hospcode: hospcode.trim() || null,
      app_role: appRole,
      is_active: true,
    });
    setProviderId("");
    setName("");
    setPosition("");
    setAppRole("eye");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">เพิ่มผู้ใช้งานและกำหนดสิทธิ์</h2>
              <p className="text-xs text-slate-400">กำหนดสิทธิ์ล่วงหน้าก่อนผู้ใช้งาน Login ครั้งแรก</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Provider ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              placeholder="เช่น 0711E5BD111E9"
              className={INPUT_CLS}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              ชื่อ-สกุล <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น นางสาว สมหญิง ใจดี"
              className={INPUT_CLS}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                ตำแหน่ง
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="เช่น พยาบาลวิชาชีพ"
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                รหัสหน่วยบริการ
              </label>
              <input
                type="text"
                value={hospcode}
                onChange={(e) => setHospcode(e.target.value)}
                placeholder="10664"
                className={INPUT_CLS}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              สิทธิ์การเข้าใช้งานระบบ <span className="text-rose-500">*</span>
            </label>
            <RoleMultiSelect value={appRole} onChange={setAppRole} />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-[#29b6f6] hover:bg-[#0288d1] shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>บันทึกผู้ใช้งาน</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
