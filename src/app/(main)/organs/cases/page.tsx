"use client";

import { HeartPulse, Search } from "lucide-react";

export default function OrganCasesPage() {
  return (
    <div className="min-h-screen bg-slate-50/60 p-6 md:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            ทะเบียนเคสบริจาคอวัยวะ
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            รายการเคสผู้บริจาคอวัยวะและข้อมูลการประสานงานจัดเก็บอวัยวะ
          </p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              disabled
              placeholder="ค้นหา HN, ชื่อ-สกุล..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl text-sm cursor-not-allowed"
            />
          </div>
        </div>

        <div className="py-20 px-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#29b6f6] flex items-center justify-center mx-auto">
            <HeartPulse className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            โมดูลบันทึกเคสบริจาคอวัยวะพร้อมสำหรับเพิ่มฟิลด์และ API
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            หน้านี้จำกัดสิทธิ์ให้เฉพาะผู้ใช้งานสิทธิ์ <strong className="text-slate-600">บริจาคอวัยวะ</strong> และ <strong className="text-slate-600">ผู้ดูแลระบบ</strong> เท่านั้น
          </p>
        </div>
      </div>
    </div>
  );
}
