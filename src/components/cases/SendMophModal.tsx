"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CloudUpload,
  FileText,
  Info,
  RefreshCw,
  Send,
  X,
} from "lucide-react";
import { api } from "@/hooks/useApi";
import {
  getEyeCount,
  getStorageStatus,
  isNegotiateSuccess,
} from "@/lib/caseHelpers";
import type { DonorCaseItem } from "@/types";

interface SendMophModalProps {
  target: DonorCaseItem | null;
  isSending: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onEditCase: (id: number) => void;
}

export function SendMophModal({
  target,
  isSending,
  onClose,
  onConfirm,
  onEditCase,
}: SendMophModalProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, unknown> | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  if (!target) return null;

  const handleTogglePreview = async () => {
    if (!showPreview && !previewData) {
      try {
        setIsLoadingPreview(true);
        const res = await api.previewMoph(target.id);
        if (res.success && res.data) {
          setPreviewData(res.data.payload);
        }
      } catch (err) {
        console.error("Failed to load MOPH preview:", err);
      } finally {
        setIsLoadingPreview(false);
      }
    }
    setShowPreview((prev) => !prev);
  };

  const eyeCount = getEyeCount(target);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200/80 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200/60 flex items-center justify-center text-sky-600 shrink-0">
            <CloudUpload className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 leading-snug">
              ส่งข้อมูลเคสบริจาคไปยังระบบ สธ. (MOPH)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ระบบจะจัดเตรียม Payload และส่งข้อมูลไปยังระบบ MOPH Eye Donation API
            </p>
          </div>
          <button
            type="button"
            disabled={isSending}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Case Info Summary */}
        <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 space-y-2.5 mb-4 text-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">ผู้เสียชีวิต / ผู้ป่วย:</span>
            <span className="font-semibold text-slate-800">
              {target.fullname || "ไม่ระบุชื่อ"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">เลข HN:</span>
            <span className="font-mono font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200/60">
              {target.hn}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">เลขบัตรประชาชน:</span>
            <span className="font-mono text-slate-700">{target.cid || "-"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">โรงพยาบาล:</span>
            <span className="font-semibold text-slate-700">
              โรงพยาบาลปกเกล้า (10664)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">ผลเจรจา / จัดเก็บ:</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">
                {isNegotiateSuccess(target.negotiate_succ)
                  ? "เจรจาสำเร็จ"
                  : "เจรจาไม่สำเร็จ"}
              </span>
              <span className="text-slate-400">•</span>
              <span className="font-semibold text-slate-800">
                {getStorageStatus(target)} ({eyeCount} ดวง)
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
            <span className="text-slate-500 font-medium">สถานะส่ง MOPH ปัจจุบัน:</span>
            {target.status === 2 ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> เคยส่งแล้ว
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                ยังไม่เคยส่ง
              </span>
            )}
          </div>
        </div>

        {/* Status Alert */}
        {target.is_complete !== 1 ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900 mb-1">
                  ไม่สามารถส่งข้อมูลได้: ข้อมูลยังไม่ครบถ้วน
                </p>
                <p className="mb-1.5 text-rose-700">
                  กรุณากรอกข้อมูลที่จำเป็นต่อไปนี้ให้ครบถ้วนก่อนส่งไปยัง สธ. (MOPH):
                </p>
                {target.missing_fields && target.missing_fields.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {target.missing_fields.map((field) => (
                      <span
                        key={field}
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-rose-300 text-rose-800 font-semibold text-[11px]"
                      >
                        • {field}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEditCase(target.id)}
              className="mt-3 w-full py-2 px-3 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 font-semibold rounded-xl text-xs transition-colors text-center cursor-pointer"
            >
              ไปที่หน้าแก้ไขข้อมูลเคสนี้
            </button>
          </div>
        ) : target.status === 2 ? (
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-800 mb-4">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>แจ้งเตือน:</strong> เคสนี้เคยส่งข้อมูลไปยังระบบ สธ. (MOPH)
              เรียบร้อยแล้ว หากกดยืนยันจะเป็นการส่งข้อมูลปรับปรุงใหม่
            </span>
          </div>
        ) : (
          <div className="bg-sky-50 border border-sky-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-sky-800 mb-4">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <span>
              เมื่อกดยืนยัน ระบบจะส่งข้อมูลผู้ป่วยและการเจรจาบริจาคไปยัง MOPH ทันที
              และปรับสถานะของเคสเป็น <strong>&quot;ส่งแล้ว&quot;</strong>
            </span>
          </div>
        )}

        {/* Toggle Preview Payload */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleTogglePreview}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>ตรวจสอบโครงสร้างข้อมูลที่จะส่ง (JSON Payload)</span>
            </span>
            {isLoadingPreview ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
            ) : showPreview ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {showPreview && (
            <div className="mt-2 p-3 bg-slate-900 rounded-xl text-emerald-400 font-mono text-[11px] max-h-48 overflow-y-auto border border-slate-800">
              {isLoadingPreview ? (
                <div className="text-center py-4 text-slate-400">
                  กำลังโหลดข้อมูล Payload...
                </div>
              ) : previewData ? (
                <pre className="whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(previewData, null, 2)}
                </pre>
              ) : (
                <div className="text-slate-400">ไม่สามารถแสดง Payload ได้</div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSending}
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isSending || target.is_complete !== 1}
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-[#0288d1] hover:from-sky-600 hover:to-[#0277bd] text-white font-semibold text-sm transition-all shadow-md shadow-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>กำลังส่งข้อมูลไป MOPH...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>ยืนยันส่งข้อมูลไป MOPH</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
