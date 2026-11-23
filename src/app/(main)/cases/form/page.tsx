"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import { useDonorCaseForm } from "@/hooks/useDonorCaseForm";
import { CaseFormHeader } from "@/components/cases/form/CaseFormHeader";
import { PatientAssessmentStep } from "@/components/cases/form/PatientAssessmentStep";
import { NegotiationRetrievalStep } from "@/components/cases/form/NegotiationRetrievalStep";
import { CaseFormFooter } from "@/components/cases/form/CaseFormFooter";

function DonorCaseFormContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const form = useDonorCaseForm(editId);

  if (form.pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
          <p className="text-sm font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 sm:px-6 md:px-10 py-6 md:py-8">
      <div className="w-full space-y-4">
        <CaseFormHeader
          editId={editId}
          isEditMode={form.isEditMode}
          caseIsComplete={form.caseIsComplete}
          caseMissingFields={form.caseMissingFields}
          caseStatus={form.caseStatus}
        />

        <Toast
          notification={form.notification}
          visible={form.toastVisible}
          onClose={form.dismissToast}
        />

        <div className="w-full">
          <div className="bg-white rounded-[32px] border border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 sm:p-8 md:p-10 space-y-6">
            {form.activeStep === 1 ? (
              <PatientAssessmentStep
                isEditMode={form.isEditMode}
                searchHn={form.searchHn}
                onSearchHnChange={form.setSearchHn}
                searchingPatient={form.searchingPatient}
                onSearchPatient={() => form.handleSearchPatient()}
                hn={form.hn}
                onHnChange={form.setHn}
                cid={form.cid}
                trimmedCid={form.trimmedCid}
                isCidIncomplete={form.isCidIncomplete}
                onCidChange={form.handleCidChange}
                fullname={form.fullname}
                onFullnameChange={form.setFullname}
                deathtext={form.deathtext}
                onDeathtextChange={form.setDeathtext}
                icd10={form.icd10}
                onIcd10Change={form.setIcd10}
                braincardiac={form.braincardiac}
                onBraincardiacChange={form.setBraincardiac}
                potential={form.potential}
                onPotentialChange={form.setPotential}
                chkpotential={form.chkpotential}
                onChkpotentialChange={form.setChkpotential}
                wardtotc={form.wardtotc}
                onWardtotcChange={form.setWardtotc}
                commentnonchk={form.commentnonchk}
                onCommentnonchkChange={form.setCommentnonchk}
              />
            ) : (
              <NegotiationRetrievalStep
                isEditMode={form.isEditMode}
                negotiate={form.negotiate}
                onNegotiateChange={form.setNegotiate}
                negotiateSucc={form.negotiateSucc}
                onNegotiateSuccChange={form.handleNegotiateSuccChange}
                commentnonego={form.commentnonego}
                onCommentnonegoChange={form.setCommentnonego}
                geteye={form.geteye}
                onGeteyeChange={form.setGeteye}
                eyetotal={form.eyetotal}
                onEyetotalChange={form.setEyetotal}
                commentnoget={form.commentnoget}
                onCommentnogetChange={form.setCommentnoget}
                negotiateStaff={form.negotiateStaff}
                onNegotiateStaffChange={form.setNegotiateStaff}
                geteyeStaff={form.geteyeStaff}
                onGeteyeStaffChange={form.setGeteyeStaff}
                geteyePlace={form.geteyePlace}
                onGeteyePlaceChange={form.setGeteyePlace}
                displayFirststaff={form.displayFirststaff}
                firsttime={form.firsttime}
                onFirsttimeChange={form.setFirsttime}
              />
            )}

            <CaseFormFooter
              activeStep={form.activeStep}
              isEditMode={form.isEditMode}
              submitting={form.submitting}
              isSendingMoph={form.isSendingMoph}
              isCidIncomplete={form.isCidIncomplete}
              caseIsComplete={form.caseIsComplete}
              caseMissingFields={form.caseMissingFields}
              caseStatus={form.caseStatus}
              onCancel={form.handleCancel}
              onPrevStep={() => form.setActiveStep(1)}
              onNextStep={form.handleNextStep}
              onSendMoph={form.handleSendMophFromForm}
              onSave={form.handleSaveCase}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DonorCaseFormPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
            <p className="text-sm font-medium">กำลังโหลดฟอร์ม...</p>
          </div>
        </div>
      }
    >
      <DonorCaseFormContent />
    </Suspense>
  );
}
