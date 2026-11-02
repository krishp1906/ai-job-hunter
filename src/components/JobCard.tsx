import React from "react";
import Link from "next/link";
import { 
  Building2, 
  MapPin, 
  ExternalLink, 
  Sparkles, 
  FileText, 
  Bookmark, 
  CheckCircle, 
  ShieldAlert, 
  Award, 
  Mail, 
  Send 
} from "lucide-react";

interface JobCardProps {
  job: any;
  onOpenDetails: (job: any) => void;
  onOpenTailorResume: (job: any) => void;
  onOpenColdEmail: (job: any) => void;
  onStartApplication: (job: any) => void;
  onToggleSave: (job: any) => void;
  isSaved: boolean;
  isApplied: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onOpenDetails,
  onOpenTailorResume,
  onOpenColdEmail,
  onStartApplication,
  onToggleSave,
  isSaved,
  isApplied,
}) => {
  const match = job.matchAnalysis;
  const score = match?.overallScore ?? 0;
  const isHighMatch = score >= 80;
  const isMedMatch = score >= 70 && score < 80;

  const matchingSkills: string[] = match ? JSON.parse(match.matchingSkills || "[]") : [];
  const missingMandatory: string[] = match ? JSON.parse(match.missingMandatorySkills || "[]") : [];

  return (
    <div
      className={`bg-slate-900/60 border rounded-2xl p-5 md:p-6 transition-all flex flex-col justify-between ${
        isHighMatch
          ? "border-emerald-500/30 hover:border-emerald-500/50 shadow-lg shadow-emerald-950/20"
          : isMedMatch
          ? "border-amber-500/30 hover:border-amber-500/50"
          : "border-slate-800 hover:border-slate-700"
      }`}
    >
      <div>
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              {/* Correct route Link to /jobs/[id] */}
              <Link
                href={`/jobs/${job.id}`}
                className="font-bold text-white text-base md:text-lg hover:text-indigo-300 transition-colors"
              >
                {job.title}
              </Link>
              {isApplied && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  <CheckCircle className="w-3 h-3" /> Applied
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                {job.company}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                {job.location}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium">
                {job.workArrangement}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800/60 text-[10px] text-slate-400">
                {job.companyType}
              </span>
            </p>
          </div>

          {/* Score Badge */}
          <div className="text-right shrink-0">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black tracking-wide ${
                isHighMatch
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : isMedMatch
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{score.toFixed(1)}% Match</span>
            </div>
          </div>
        </div>

        {/* 5-Factor Scoring Weights Bar */}
        {match && (
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span className="font-medium text-slate-300">Scoring Breakdown:</span>
              <span className="text-[10px] text-slate-500">Weighted sum = 100%</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-[10px] text-center">
              <div className="p-1 rounded bg-slate-800/70 border border-slate-700/40">
                <div className="text-slate-400 text-[9px]">Tech (35%)</div>
                <div className="font-bold text-slate-200">{match.technicalScore}%</div>
              </div>
              <div className="p-1 rounded bg-slate-800/70 border border-slate-700/40">
                <div className="text-slate-400 text-[9px]">Exp (20%)</div>
                <div className="font-bold text-slate-200">{match.experienceScore}%</div>
              </div>
              <div className="p-1 rounded bg-slate-800/70 border border-slate-700/40">
                <div className="text-slate-400 text-[9px]">Resp (20%)</div>
                <div className="font-bold text-slate-200">{match.responsibilityScore}%</div>
              </div>
              <div className="p-1 rounded bg-slate-800/70 border border-slate-700/40">
                <div className="text-slate-400 text-[9px]">Role (15%)</div>
                <div className="font-bold text-slate-200">{match.roleScore}%</div>
              </div>
              <div className="p-1 rounded bg-slate-800/70 border border-slate-700/40">
                <div className="text-slate-400 text-[9px]">Loc (10%)</div>
                <div className="font-bold text-slate-200">{match.locationScore}%</div>
              </div>
            </div>

            <p className="mt-2.5 text-xs text-slate-300 leading-relaxed line-clamp-2">
              <span className="text-slate-500 font-semibold">Evaluation: </span>
              {match.scoringExplanation}
            </p>
          </div>
        )}

        {/* Skills Alignment Tags */}
        <div className="mt-3.5 space-y-2 text-xs">
          {matchingSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-emerald-400/90 font-medium mr-1">Matched:</span>
              {matchingSkills.slice(0, 5).map((skill) => (
                <span key={skill} className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                  {skill}
                </span>
              ))}
              {matchingSkills.length > 5 && (
                <span className="text-[10px] text-slate-400">+{matchingSkills.length - 5} more</span>
              )}
            </div>
          )}

          {missingMandatory.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-rose-400/90 font-medium mr-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Missing:
              </span>
              {missingMandatory.map((skill) => (
                <span key={skill} className="px-2 py-0.5 rounded text-[10px] bg-rose-950/40 text-rose-300 border border-rose-800/40">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="mt-5 pt-3.5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Salary & Link */}
        <div className="text-xs">
          <div className="font-semibold text-slate-200">
            {job.minSalary && job.maxSalary
              ? `₹${(job.minSalary / 100000).toFixed(1)} - ${(job.maxSalary / 100000).toFixed(1)} LPA`
              : "Salary Disclosed Upon Request"}
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-2">
            <span>{job.salaryIsEstimated ? "Estimated Market Rate" : "Employer Listed"}</span>
            <span>•</span>
            {/* Official Careers Portal Link */}
            <a
              href={job.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-semibold"
              title={`Open ${job.company}'s official careers portal in a new tab`}
            >
              Careers Portal <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        {/* Action Buttons: Apply Now, Cold Mail, Tailor Resume, AI Prep */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onToggleSave(job)}
            title={isSaved ? "Saved in pipeline" : "Save for review"}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              isSaved
                ? "bg-cyan-950/40 border-cyan-800 text-cyan-300"
                : "bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>

          {/* Apply Now Button: launches ApplicationModal */}
          <button
            onClick={() => onStartApplication(job)}
            title="Open official portal, customize tailored cover letter & resume, and log to tracker"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transition-all ${
              isApplied
                ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            {isApplied ? "Applied ✓" : "Apply Now"}
          </button>

          {/* Quick Cold Mail Button */}
          <button
            onClick={() => onOpenColdEmail(job)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            title="Generate personalized cold outreach email for hiring manager"
          >
            <Mail className="w-3.5 h-3.5 text-cyan-400" />
            Cold Mail
          </button>

          {/* Tailor Resume */}
          <button
            onClick={() => onOpenTailorResume(job)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            Resume
          </button>

          {/* AI Prep & Assessment */}
          <button
            onClick={() => onOpenDetails(job)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            AI Prep
          </button>
        </div>
      </div>
    </div>
  );
};
