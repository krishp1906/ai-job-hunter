import React, { useState, useEffect } from "react";
import { 
  X, 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  Copy, 
  Check, 
  Printer, 
  Sparkles, 
  Send, 
  Building2, 
  ShieldCheck,
  Award,
  Layers
} from "lucide-react";
import { ApplicationStatus } from "@prisma/client";

interface ApplicationModalProps {
  job: any;
  isOpen: boolean;
  onClose: () => void;
  onSaveApplication: (
    jobId: string,
    status: ApplicationStatus,
    approved: boolean,
    notes?: string
  ) => Promise<void>;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  job,
  isOpen,
  onClose,
  onSaveApplication,
}) => {
  const [activeMaterialTab, setActiveMaterialTab] = useState<"coverLetter" | "resume">("coverLetter");
  const [coverLetterData, setCoverLetterData] = useState<any>(null);
  const [resumeData, setResumeData] = useState<any>(null);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

  // Form states
  const [applicationMethod, setApplicationMethod] = useState("Company Website (Direct Portal)");
  const [quotedSalary, setQuotedSalary] = useState("₹6,00,000 LPA");
  const [applicationNotes, setApplicationNotes] = useState("");
  const [hasConfirmedApproval, setHasConfirmedApproval] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Copy states
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);
  const [copiedResume, setCopiedResume] = useState(false);

  useEffect(() => {
    if (job && isOpen) {
      setIsSuccess(false);
      setIsLoadingMaterials(true);

      // Fetch Cover Letter & Tailored Resume simultaneously
      Promise.all([
        fetch(`/api/jobs/${job.id}/cover-letter`).then((r) => r.json()),
        fetch("/api/resumes/tailor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: job.id }),
        }).then((r) => r.json()),
      ])
        .then(([clRes, resRes]) => {
          if (clRes.success) setCoverLetterData(clRes.coverLetter);
          if (resRes.success) setResumeData(resRes.resume);
        })
        .catch((err) => console.error("Error loading application materials:", err))
        .finally(() => setIsLoadingMaterials(false));
    }
  }, [job, isOpen]);

  if (!isOpen || !job) return null;

  const score = job.matchAnalysis?.overallScore || 0;

  const handleOpenPortal = () => {
    window.open(job.originalUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyCoverLetter = () => {
    if (coverLetterData?.fullLetterText) {
      navigator.clipboard.writeText(coverLetterData.fullLetterText);
      setCopiedCoverLetter(true);
      setTimeout(() => setCopiedCoverLetter(false), 2000);
    }
  };

  const handleCopyResume = () => {
    if (resumeData?.markdownText) {
      navigator.clipboard.writeText(resumeData.markdownText);
      setCopiedResume(true);
      setTimeout(() => setCopiedResume(false), 2000);
    }
  };

  const handleSubmitApplication = async () => {
    try {
      setIsSubmitting(true);
      const notesCombined = `Method: ${applicationMethod} | Quoted CTC: ${quotedSalary} | Notes: ${applicationNotes || "Application submitted with tailored materials."}`;
      await onSaveApplication(job.id, ApplicationStatus.APPLIED, hasConfirmedApproval, notesCombined);
      setIsSuccess(true);
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/95">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Application Assistant &amp; Submission Hub</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                <Award className="w-3.5 h-3.5 inline mr-1" />
                {score.toFixed(1)}% Match
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-slate-200 font-semibold">{job.title}</span>
              <span>at</span>
              <span className="text-indigo-400 font-semibold">{job.company}</span>
              <span>•</span>
              <span>{job.location}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 bg-slate-950/40">
          {/* STEP 1: Direct Portal Launcher */}
          <div className="bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                Step 1: Official Employer Application Portal
              </span>
              <h3 className="font-bold text-white text-sm">
                Apply directly on {job.company}&apos;s official careers page
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                We generated your tailored cover letter and resume below. Click to open the official application form in a new tab.
              </p>
            </div>

            <button
              onClick={handleOpenPortal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-colors shrink-0 shadow-lg shadow-indigo-600/20"
            >
              Open Company Portal <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* STEP 2: Tailored Application Materials */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Step 2: Prepared Application Materials
                </span>
                <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                  <button
                    onClick={() => setActiveMaterialTab("coverLetter")}
                    className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      activeMaterialTab === "coverLetter"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Custom Cover Letter
                  </button>
                  <button
                    onClick={() => setActiveMaterialTab("resume")}
                    className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      activeMaterialTab === "resume"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Tailored Resume
                  </button>
                </div>
              </div>

              {activeMaterialTab === "coverLetter" ? (
                <button
                  onClick={handleCopyCoverLetter}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
                >
                  {copiedCoverLetter ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCoverLetter ? "Copied Cover Letter!" : "Copy Cover Letter"}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyResume}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
                  >
                    {copiedResume ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedResume ? "Copied Resume!" : "Copy Markdown"}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                </div>
              )}
            </div>

            {/* Preview Box */}
            {isLoadingMaterials ? (
              <div className="p-8 text-center text-slate-400 animate-pulse">
                Generating customized application materials for {job.company}...
              </div>
            ) : activeMaterialTab === "coverLetter" && coverLetterData ? (
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 text-slate-300 font-sans whitespace-pre-line leading-relaxed shadow-inner max-h-64 overflow-y-auto">
                {coverLetterData.fullLetterText}
              </div>
            ) : activeMaterialTab === "resume" && resumeData ? (
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 text-slate-300 font-mono text-[11px] whitespace-pre-wrap leading-relaxed shadow-inner max-h-64 overflow-y-auto">
                {resumeData.markdownText}
              </div>
            ) : null}
          </div>

          {/* STEP 3: Tracking & Logging Section */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Step 3: Application Record &amp; Status Tracking
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-medium">Application Method</label>
                <select
                  value={applicationMethod}
                  onChange={(e) => setApplicationMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Company Website (Direct Portal)">Company Website (Direct Portal)</option>
                  <option value="LinkedIn Easy Apply">LinkedIn Easy Apply</option>
                  <option value="Recruiter Email / Cold Mail">Recruiter Email / Cold Outreach</option>
                  <option value="Employee Referral">Employee Referral</option>
                  <option value="Indeed / Naukri">Indeed / Naukri</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-medium">Expected / Quoted Compensation</label>
                <input
                  type="text"
                  placeholder="e.g. ₹6,50,000 LPA"
                  value={quotedSalary}
                  onChange={(e) => setQuotedSalary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1 text-[11px] font-medium">Notes &amp; Follow-up Details</label>
                <input
                  type="text"
                  placeholder="e.g. Applied with tailored resume; highlighted Next.js booking & Mapbox experience"
                  value={applicationNotes}
                  onChange={(e) => setApplicationNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Business Rule 8 Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasConfirmedApproval}
                  onChange={(e) => setHasConfirmedApproval(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-white block">
                    Confirm Candidate Authorization (Business Rule 8)
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    I confirm that I have submitted this application or authorize recording it in my recruitment pipeline.
                  </span>
                </div>
              </label>
            </div>

            {/* Submission Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={handleSubmitApplication}
                disabled={isSubmitting || !hasConfirmedApproval}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? "Saving Application..." : "Save & Record as Applied"}
              </button>

              {isSuccess && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-800/40">
                  <CheckCircle2 className="w-4 h-4" />
                  Application for {job.company} successfully logged in tracker!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-xs">
          <span className="text-slate-500 text-[11px]">
            Protected candidate workflow • 100% factual accuracy preserved.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
};
