"use client";

import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Ellipsis,
  Send,
  Pencil,
  Trash2,
} from "lucide-react";
import { Popover, Button } from "@heroui/react";
import type { DonorCaseItem } from "@/types";
import { getGender, isNegotiateSuccess } from "@/lib/caseHelpers";
import { AnimatedPupilEyes } from "./AnimatedPupilEyes";

interface CasesTableProps {
  cases: DonorCaseItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSendMoph: (item: DonorCaseItem) => void;
  onEdit: (id: number) => void;
  onDelete: (item: DonorCaseItem) => void;
}

export function CasesTable({
  cases,
  loading,
  error,
  onRetry,
  onSendMoph,
  onEdit,
  onDelete,
}: CasesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/90 border-b border-slate-200/80 text-base font-bold text-slate-700">
            <th className="py-4 px-6 text-center">HN</th>
            <th className="py-4 px-6 text-center">ชื่อ-สกุล</th>
            <th className="py-4 px-6 text-center">เพศ</th>
            <th className="py-4 px-6 text-center">เลขบัตรประชาชน</th>
            <th className="py-4 px-6 text-center">ผลเจรจา</th>
            <th className="py-4 px-6 text-center">สถานะข้อมูล</th>
            <th className="py-4 px-6 text-center">ส่ง สธ. (MOPH)</th>
            <th className="py-4 px-6 text-center">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-base">
          {loading ? (
            <tr>
              <td colSpan={8} className="py-16 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
                  <span className="text-base font-medium">กำลังโหลดข้อมูลเคส...</span>
                </div>
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={8} className="py-12 text-center text-rose-500 text-base">
                <p className="font-semibold">{error}</p>
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-2 text-base text-sky-600 hover:underline font-semibold cursor-pointer"
                >
                  ลองใหม่อีกครั้ง
                </button>
              </td>
            </tr>
          ) : cases.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-16 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-14 h-14 flex items-center justify-center text-slate-400">
                    <AnimatedPupilEyes className="w-14 h-14" />
                  </div>
                  <p className="text-base font-semibold text-slate-700">
                    ไม่พบข้อมูลเคสบริจาค
                  </p>
                  <p className="text-base text-slate-400">
                    กดปุ่ม &quot;บันทึกเคสใหม่&quot; ด้านบนเพื่อเพิ่มข้อมูลเข้าระบบ
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            cases.map((item, index) => {
              const negotiateOk = isNegotiateSuccess(item.negotiate_succ);
              const gender = getGender(item);

              return (
                <tr
                  key={`${item.id}-${index}`}
                  className="hover:bg-slate-50/80 transition-colors group text-base font-normal text-slate-700"
                >
                  <td className="py-4 px-6 text-center font-mono font-medium text-slate-700 text-sm">
                    <span className="inline-block px-2.5 py-1 bg-slate-100/90 rounded-lg text-slate-700 font-semibold">
                      {item.hn}
                    </span>
                  </td>

                  <td className="py-4 px-6 font-medium text-slate-800 text-base text-center">
                    {item.fullname || "ไม่ระบุชื่อ"}
                  </td>

                  <td className="py-4 px-6 text-center">
                    {gender === "ชาย" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/60">
                        ชาย
                      </span>
                    ) : gender === "หญิง" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200/60">
                        หญิง
                      </span>
                    ) : (
                      <span className="text-slate-500 text-sm">{gender}</span>
                    )}
                  </td>

                  <td className="py-4 px-6 font-mono font-normal text-slate-600 text-sm text-center">
                    {item.cid || "-"}
                  </td>

                  <td className="py-4 px-6 text-center">
                    {negotiateOk ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                        สำเร็จ
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
                        ไม่สำเร็จ
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 text-center">
                    {item.is_complete === 1 ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                        ข้อมูลครบ
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs cursor-help"
                        title={
                          item.missing_fields && item.missing_fields.length > 0
                            ? `ข้อมูลยังไม่ครบ: ${item.missing_fields.join(", ")}`
                            : "ข้อมูลยังไม่ครบถ้วน"
                        }
                      >
                        <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
                        ข้อมูลไม่ครบ
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 text-center">
                    {item.status === 2 ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                        ส่งแล้ว
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
                        ยังไม่ส่ง
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex items-center justify-center">
                      <Popover>
                        <Button
                          isIconOnly
                          size="sm"
                          aria-label="More options"
                          variant="tertiary"
                          className="w-8 h-8 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Ellipsis className="w-4 h-4" />
                        </Button>
                        <Popover.Content
                          className="w-52 p-1.5 shadow-xl border border-slate-200/90 rounded-2xl bg-white z-50"
                          offset={8}
                        >
                          <Popover.Dialog className="outline-none focus:outline-none">
                            <Popover.Arrow />
                            <div className="flex flex-col gap-1">
                              {item.is_complete !== 1 ? (
                                <button
                                  type="button"
                                  disabled
                                  title={
                                    item.missing_fields && item.missing_fields.length > 0
                                      ? `ข้อมูลยังไม่ครบถ้วน (ขาด: ${item.missing_fields.join(", ")})`
                                      : "ข้อมูลยังไม่ครบถ้วน ไม่สามารถส่งได้"
                                  }
                                  className="w-full px-3 py-2 text-xs font-medium text-slate-400 bg-transparent rounded-xl cursor-not-allowed flex items-center justify-between opacity-60 select-none text-left"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <Send className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span className="whitespace-nowrap">ส่งข้อมูลไป MOPH</span>
                                  </div>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onSendMoph(item)}
                                  className="group w-full px-3 py-2 text-xs font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors text-left cursor-pointer flex items-center gap-2.5 active:scale-[0.98]"
                                >
                                  <Send className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                                  <span className="whitespace-nowrap">
                                    {item.status === 2 ? "ส่ง สธ. ซ้ำ" : "ส่งข้อมูลไป MOPH"}
                                  </span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => onEdit(item.id)}
                                className="group w-full px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors text-left cursor-pointer flex items-center gap-2.5"
                              >
                                <Pencil className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                                <span className="whitespace-nowrap">แก้ไขข้อมูล</span>
                              </button>

                              <div className="my-0.5 border-t border-slate-100" />

                              <button
                                type="button"
                                onClick={() => onDelete(item)}
                                className="group w-full px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors text-left cursor-pointer flex items-center gap-2.5"
                              >
                                <Trash2 className="w-4 h-4 text-rose-400 group-hover:text-rose-600 transition-colors shrink-0" />
                                <span className="whitespace-nowrap">ลบเคส</span>
                              </button>
                            </div>
                          </Popover.Dialog>
                        </Popover.Content>
                      </Popover>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
