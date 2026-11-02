"use client";

import React, { useState } from "react";
import { Send, Mail, FileText, Sparkles, CheckCircle2, ExternalLink } from "lucide-react";
import { ColdEmailModal } from "@/components/ColdEmailModal";
import { TailoredResumeModal } from "@/components/TailoredResumeModal";
import { JobDetailModal } from "@/components/JobDetailModal";
import { ApplicationModal } from "@/components/ApplicationModal";
import { ApplicationStatus } from "@prisma/client";

interface JobDetailInteractiveProps {
  job: any;
}

export const JobDetailInteractive: React.FC<JobDetailInteractiveProps> = ({ job }) => {
  const [isColdEmailOpen, setIsColdEmailOpen] = useState(false);
  const [isTailorResumeOpen, setIsTailorResumeOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  const [appliedStatus, setAppliedStatus] = useState<ApplicationStatus>(
    job?.applications?.[0]?.status || ApplicationStatus.DISCOVERED
  );
  const [isApplying, setIsApplying] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const handleQuickApply = async () => {
    try {
      setIsApplying(true);
      setStatusFeedback(null);

      // Open official company application URL in new tab
      window.open(job.originalUrl, "_blank", "noopener,noreferrer");

      // Mark applied in database with explicit candidate approval (Rule 8)
      const res = await fetch(`/api/jobs/${job.id}/application`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: ApplicationStatus.APPLIED,
          approvedByCandidate: true,
          notes: "Applied via Quick Apply on company career site",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAppliedStatus(ApplicationStatus.APPLIED);
        setStatusFeedback("Application submitted & recorded in tracker!");
      } else {
        setStatusFeedback(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setStatusFeedback(`Error: ${err.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  const handleUpdateStatus = async (
    jobId: string,
    status: ApplicationStatus,
    approved: boolean,
    notes?: string
  ) => {
    const res = await fetch(`/api/jobs/${jobId}/application`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, approvedByCandidate: approved, notes }),
    });
    const data = await res.json();
    if (data.success) {
      setAppliedStatus(status);
    }
  };

  const isApplied = appliedStatus === ApplicationStatus.APPLIED;

  return (
    <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Start Application Button */}
        <button
          onClick={() => setIsApplicationModalOpen(true)}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-md transition-all ${
            isApplied
              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
              : "bg-indigo-600 hover:bg-indigo-500 text-white"
          }`}
        >
          <Send className="w-4 h-4" />
          {isApplied ? "Applied ✓ (Manage Application)" : "Apply (Portal, Resume & Cover Letter)"}
        </button>

        {/* Cold Email Button */}
        <button
          onClick={() => setIsColdEmailOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs md:text-sm transition-colors"
        >
          <Mail className="w-4 h-4 text-cyan-400" />
          Create Cold Mail
        </button>

        {/* Tailor Resume Button */}
        <button
          onClick={() => setIsTailorResumeOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs md:text-sm transition-colors"
        >
          <FileText className="w-4 h-4 text-indigo-400" />
          Tailor Resume
        </button>

        {/* AI Prep Button */}
        <button
          onClick={() => setIsDetailModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs md:text-sm transition-colors"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          AI Interview Prep
        </button>
      </div>

      {statusFeedback && (
        <span
          className={`text-xs font-medium ${
            statusFeedback.startsWith("Error") ? "text-rose-400" : "text-emerald-400"
          }`}
        >
          {statusFeedback}
        </span>
      )}

      {/* Modals */}
      <ApplicationModal
        job={job}
        isOpen={isApplicationModalOpen}
        onClose={() => setIsApplicationModalOpen(false)}
        onSaveApplication={handleUpdateStatus}
      />

      <ColdEmailModal
        job={job}
        isOpen={isColdEmailOpen}
        onClose={() => setIsColdEmailOpen(false)}
        onMarkApplied={handleQuickApply}
      />

      <TailoredResumeModal
        job={job}
        isOpen={isTailorResumeOpen}
        onClose={() => setIsTailorResumeOpen(false)}
      />

      <JobDetailModal
        job={job}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        onOpenTailorResume={() => {
          setIsDetailModalOpen(false);
          setIsTailorResumeOpen(true);
        }}
      />
    </div>
  );
};
