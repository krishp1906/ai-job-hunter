import React, { useState, useEffect } from "react";
import { X, Building2, MapPin, ExternalLink, Sparkles, CheckCircle2, AlertTriangle, HelpCircle, ShieldCheck, Send } from "lucide-react";
import { ApplicationStatus } from "@prisma/client";

interface JobDetailModalProps {
  job: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (jobId: string, status: ApplicationStatus, approved: boolean, notes?: string) => Promise<void>;
  onOpenTailorResume: (job: any) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  isOpen,
  onClose,
  onUpdateStatus,
  onOpenTailorResume,
}) => {
  const [recommendation, setRecommendation] = useState<any>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(
    job?.applications?.[0]?.status || ApplicationStatus.DISCOVERED
  );
  const [isApprovedByCandidate, setIsApprovedByCandidate] = useState<boolean>(
    job?.applications?.[0]?.approvedByCandidate || false
  );
  const [notes, setNotes] = useState<string>(job?.applications?.[0]?.notes || "");
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (job && isOpen) {
      setSelectedStatus(job?.applications?.[0]?.status || ApplicationStatus.DISCOVERED);
      setIsApprovedByCandidate(job?.applications?.[0]?.approvedByCandidate || false);
      setNotes(job?.applications?.[0]?.notes || "");
      setStatusMessage(null);

      // Fetch AI recommendation
      setIsLoadingAi(true);
      fetch(`/api/jobs/${job.id}/ai-recommendation`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setRecommendation(data.recommendation);
          }
        })
        .catch((err) => console.error("Error loading recommendation:", err))
        .finally(() => setIsLoadingAi(false));
    }
  }, [job, isOpen]);

  if (!isOpen || !job) return null;

  const match = job.matchAnalysis;
  const score = match?.overallScore ?? 0;

  const handleSaveStatus = async () => {
    try {
      setIsSavingStatus(true);
      setStatusMessage(null);
      await onUpdateStatus(job.id, selectedStatus, isApprovedByCandidate, notes);
      setStatusMessage("Application status updated successfully!");
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsSavingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-white">{job.title}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                {score.toFixed(1)}% Match
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 flex items-center gap-2 mt-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1">
                <Building2 className="w-4 h-4 text-indigo-400" />
                {job.company}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-4 h-4 text-rose-400" />
                {job.location} ({job.workArrangement})
              </span>
              <span>•</span>
              <a
                href={job.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-medium"
              >
                Original Listing <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200">
          {/* Scoring Engine Breakdown */}
          {match && (
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Explainable 5-Factor Mathematical Evaluation
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Technical (35%)</div>
                  <div className="text-base font-bold text-indigo-300 mt-1">{match.technicalScore}%</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Experience (20%)</div>
                  <div className="text-base font-bold text-indigo-300 mt-1">{match.experienceScore}%</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Responsibilities (20%)</div>
                  <div className="text-base font-bold text-indigo-300 mt-1">{match.responsibilityScore}%</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Role Target (15%)</div>
                  <div className="text-base font-bold text-indigo-300 mt-1">{match.roleScore}%</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
                  <div className="text-slate-400 text-[11px]">Location (10%)</div>
                  <div className="text-base font-bold text-indigo-300 mt-1">{match.locationScore}%</div>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-slate-800/50">
                <span className="font-semibold text-slate-400">Scoring Engine Synthesis: </span>
                {match.scoringExplanation}
              </p>
            </div>
          )}

          {/* AI Assessment & Verdict */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                AI Recommendation & Fit Assessment
              </h3>
              {recommendation && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    recommendation.verdict === "STRONGLY_RECOMMENDED"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : recommendation.verdict === "RECOMMENDED"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  }`}
                >
                  Verdict: {recommendation.verdict.replace(/_/g, " ")}
                </span>
              )}
            </div>

            {isLoadingAi ? (
              <div className="p-6 text-center text-xs text-slate-400 animate-pulse">
                Analyzing requirements with AI recruitment engine...
              </div>
            ) : recommendation ? (
              <div className="space-y-4 text-xs">
                <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
                  {recommendation.suitabilitySummary}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Satisfied */}
                  <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-3.5">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Requirements You Satisfy
                    </span>
                    <ul className="space-y-1.5 text-slate-300 text-[11px]">
                      {recommendation.requirementsSatisfied.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Missing / Gaps */}
                  <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-3.5">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> Gaps & What to Address
                    </span>
                    <ul className="space-y-1.5 text-slate-300 text-[11px]">
                      {recommendation.requirementsMissing.length > 0 ? (
                        recommendation.requirementsMissing.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-400">•</span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-emerald-400">No critical requirements missing!</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Salary Info */}
                <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800 text-[11px]">
                  <span className="font-bold text-slate-300">Salary Evaluation: </span>
                  <span className="text-slate-400">{recommendation.salaryAssessment}</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Job-Specific Technical Interview Preparation */}
          {recommendation?.expectedQuestions && (
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-violet-400" />
                Technical Interview Preparation & Expected Questions
              </h3>

              {/* Prep Topics */}
              <div className="flex flex-wrap gap-1.5">
                {recommendation.interviewPrepTopics.map((topic: string, idx: number) => (
                  <span key={idx} className="px-2.5 py-1 rounded-md text-[11px] bg-violet-950/40 text-violet-300 border border-violet-800/40 font-medium">
                    {topic}
                  </span>
                ))}
              </div>

              {/* Questions */}
              <div className="space-y-3 pt-2">
                {recommendation.expectedQuestions.map((q: any, idx: number) => (
                  <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 text-xs">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-white text-xs">Q{idx + 1}: {q.question}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-indigo-300 shrink-0 font-medium">
                        {q.category}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed mt-2 bg-slate-950/50 p-2.5 rounded border border-slate-800/60">
                      <span className="font-semibold text-indigo-400">Answer Strategy: </span>
                      {q.suggestedAnswerStrategy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Application Tracker & Rule 8 Approval Section */}
          <div className="bg-slate-950/70 border border-indigo-900/40 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-400" />
              Application Tracker & Candidate Approval Gate (Rule 8)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-medium">Application Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ApplicationStatus)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="DISCOVERED">Discovered</option>
                  <option value="SAVED">Saved</option>
                  <option value="APPROVED_TO_APPLY">Approved to Apply</option>
                  <option value="APPLIED">Applied</option>
                  <option value="INTERVIEWING">Interviewing</option>
                  <option value="OFFERED">Offered</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-medium">Private Candidate Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Applied via portal; referral from teammate..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Business Rule 8 Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isApprovedByCandidate}
                  onChange={(e) => setIsApprovedByCandidate(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-white block">
                    Candidate Approval Authorization (Business Rule 8)
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    I explicitly confirm that I have reviewed this opportunity and authorize marking this role as Approved / Applied.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleSaveStatus}
                disabled={isSavingStatus}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isSavingStatus ? "Saving..." : "Update Application Status"}
              </button>

              {statusMessage && (
                <span
                  className={`text-xs ${
                    statusMessage.startsWith("Error") ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {statusMessage}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-xs">
          <button
            onClick={() => onOpenTailorResume(job)}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Generate Tailored Resume for this Role
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
