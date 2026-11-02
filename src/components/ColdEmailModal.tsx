import React, { useState, useEffect } from "react";
import { X, Mail, Copy, Check, ExternalLink, Send, Sparkles, Building2, UserCheck } from "lucide-react";

interface ColdEmailModalProps {
  job: any;
  isOpen: boolean;
  onClose: () => void;
  onMarkApplied?: (jobId: string) => void;
}

export const ColdEmailModal: React.FC<ColdEmailModalProps> = ({
  job,
  isOpen,
  onClose,
  onMarkApplied,
}) => {
  const [recipientRole, setRecipientRole] = useState("Hiring Manager");
  const [coldEmailData, setColdEmailData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedSubjectIndex, setCopiedSubjectIndex] = useState<number | null>(null);
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0);
  const [appliedFeedback, setAppliedFeedback] = useState(false);

  useEffect(() => {
    if (job && isOpen) {
      fetchColdEmail(job.id, recipientRole);
    }
  }, [job, isOpen, recipientRole]);

  const fetchColdEmail = async (jobId: string, role: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/jobs/${jobId}/cold-email?recipientRole=${encodeURIComponent(role)}`);
      const data = await res.json();
      if (data.success) {
        setColdEmailData(data.coldEmail);
      }
    } catch (err) {
      console.error("Failed to generate cold email:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyBody = () => {
    if (coldEmailData?.emailBody) {
      navigator.clipboard.writeText(coldEmailData.emailBody);
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    }
  };

  const handleCopySubject = (subject: string, index: number) => {
    navigator.clipboard.writeText(subject);
    setCopiedSubjectIndex(index);
    setTimeout(() => setCopiedSubjectIndex(null), 2000);
  };

  const handleMarkApplied = () => {
    if (onMarkApplied && job) {
      onMarkApplied(job.id);
      setAppliedFeedback(true);
      setTimeout(() => setAppliedFeedback(false), 3000);
    }
  };

  if (!isOpen || !job) return null;

  const currentSubject = coldEmailData?.subjectLines?.[selectedSubjectIndex] || "";
  const dynamicMailto = `mailto:careers@${job.company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com?subject=${encodeURIComponent(
    currentSubject
  )}&body=${encodeURIComponent(coldEmailData?.emailBody || "")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Mail className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Cold Email Generator</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Factual Pitch
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Personalized recruiter outreach tailored to <strong className="text-slate-200">{job.title}</strong> at <strong className="text-slate-200">{job.company}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recipient Role Selection Bar */}
        <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Recipient Target:</span>
            <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
              {["Hiring Manager", "Head of Engineering", "Technical Recruiter"].map((role) => (
                <button
                  key={role}
                  onClick={() => setRecipientRole(role)}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    recipientRole === role
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyBody}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
            >
              {copiedBody ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedBody ? "Copied Email!" : "Copy Email"}
            </button>

            <a
              href={dynamicMailto}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Mail Client
            </a>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 bg-slate-950/40">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 animate-pulse">
              Synthesizing tailored cold email with matching production evidence...
            </div>
          ) : coldEmailData ? (
            <>
              {/* Subject Lines Selector */}
              <div className="space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                  Subject Line Options (Select Preferred):
                </span>
                <div className="space-y-1.5">
                  {coldEmailData.subjectLines.map((subj: string, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedSubjectIndex(idx)}
                      className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        selectedSubjectIndex === idx
                          ? "bg-indigo-950/40 border-indigo-500/50 text-white"
                          : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${selectedSubjectIndex === idx ? "bg-indigo-400" : "bg-slate-600"}`}></span>
                        <span className="font-medium text-xs">{subj}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopySubject(subj, idx);
                        }}
                        className="p-1 text-slate-400 hover:text-white shrink-0"
                      >
                        {copiedSubjectIndex === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Body Preview Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    Email Pitch Preview:
                  </span>
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Factual match highlighting
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-sans whitespace-pre-line leading-relaxed shadow-inner">
                  {coldEmailData.emailBody}
                </div>
              </div>

              {/* Action Banner to Mark Outreach in Tracker */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-300 text-xs">
                    Sent or plan to send this email? Log it in your job application tracker.
                  </span>
                </div>

                <button
                  onClick={handleMarkApplied}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {appliedFeedback ? "Logged as Applied! ✓" : "Mark as Applied"}
                </button>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-xs">
          <span className="text-slate-500 text-[11px]">
            Preserves candidate verified experience with zero fabrication.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
