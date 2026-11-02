import React, { useState, useEffect } from "react";
import { X, Copy, Check, ShieldCheck, Printer, FileText } from "lucide-react";
import { ResumeProfileType } from "@prisma/client";

interface TailoredResumeModalProps {
  job: any;
  isOpen: boolean;
  onClose: () => void;
}

export const TailoredResumeModal: React.FC<TailoredResumeModalProps> = ({
  job,
  isOpen,
  onClose,
}) => {
  const [profileType, setProfileType] = useState<ResumeProfileType>(ResumeProfileType.FULL_STACK);
  const [resumeData, setResumeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(false);

  useEffect(() => {
    if (job && isOpen) {
      // Auto-select profile based on title
      const title = job.title.toLowerCase();
      let defaultType: ResumeProfileType = ResumeProfileType.FULL_STACK;
      if (title.includes("backend") || title.includes("node") || title.includes("nest")) {
        defaultType = ResumeProfileType.BACKEND;
      } else if (title.includes("frontend") || title.includes("react") || title.includes("ui")) {
        defaultType = ResumeProfileType.FRONTEND;
      }
      setProfileType(defaultType);
      fetchTailoredResume(job.id, defaultType);
    }
  }, [job, isOpen]);

  const fetchTailoredResume = async (jobId: string, type: ResumeProfileType) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/resumes/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, profileType: type }),
      });
      const data = await res.json();
      if (data.success) {
        setResumeData(data.resume);
      }
    } catch (err) {
      console.error("Failed to generate resume:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileChange = (type: ResumeProfileType) => {
    setProfileType(type);
    if (job) {
      fetchTailoredResume(job.id, type);
    }
  };

  const handleCopyMarkdown = () => {
    if (resumeData?.markdownText) {
      navigator.clipboard.writeText(resumeData.markdownText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">
                Tailored Resume Generator: {job.title} ({job.company})
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Factual, customized resume version aligned with this opportunity.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Selector & Controls Bar */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Target Profile:</span>
            <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
              <button
                onClick={() => handleProfileChange(ResumeProfileType.FULL_STACK)}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  profileType === ResumeProfileType.FULL_STACK
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Profile A: Full Stack
              </button>
              <button
                onClick={() => handleProfileChange(ResumeProfileType.BACKEND)}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  profileType === ResumeProfileType.BACKEND
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Profile B: Backend
              </button>
              <button
                onClick={() => handleProfileChange(ResumeProfileType.FRONTEND)}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  profileType === ResumeProfileType.FRONTEND
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Profile C: Frontend
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMarkdown(!showMarkdown)}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              {showMarkdown ? "Preview Render" : "Raw Markdown"}
            </button>
            <button
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy MD"}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Export
            </button>
          </div>
        </div>

        {/* Factual Integrity Banner */}
        <div className="px-6 py-2 bg-emerald-950/20 border-b border-emerald-900/30 flex items-center gap-2 text-[11px] text-emerald-400">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            <strong>Factual Preservation Active:</strong> Years of experience, employment dates, Silver Oak CGPA (9.22), and capstone project ownership are strictly preserved without fabrication.
          </span>
        </div>

        {/* Resume Preview Content */}
        <div className="p-6 md:p-8 overflow-y-auto bg-slate-950 text-slate-200 font-sans">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Synthesizing targeted resume for {job.company}...
            </div>
          ) : showMarkdown ? (
            <pre className="p-4 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto border border-slate-800">
              {resumeData?.markdownText}
            </pre>
          ) : resumeData ? (
            <div className="max-w-3xl mx-auto space-y-6 bg-slate-900/60 p-6 md:p-8 rounded-xl border border-slate-800/80 shadow-inner">
              {/* Header */}
              <div className="border-b border-slate-800 pb-4 text-center">
                <h1 className="text-2xl font-black text-white">{resumeData.candidateName}</h1>
                <p className="text-xs text-slate-400 mt-1">
                  {resumeData.contact.location} • {resumeData.contact.email} • {resumeData.contact.phone}
                </p>
                <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 text-[11px] font-semibold">
                  Targeted for: {resumeData.targetJobTitle} — {resumeData.targetCompany}
                </div>
              </div>

              {/* Summary */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
                  Professional Summary
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {resumeData.tailoredSummary}
                </p>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
                  Technical Skills
                </h3>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <p>
                    <strong className="text-white">Core Technologies: </strong>
                    {resumeData.targetedSkills.core.join(", ")}
                  </p>
                  <p>
                    <strong className="text-white">Emphasized for Role: </strong>
                    {resumeData.targetedSkills.specialized.join(", ")}
                  </p>
                  <p>
                    <strong className="text-white">Architecture & Tools: </strong>
                    REST APIs, PostgreSQL, TypeORM, Prisma, Git, Postman, WCAG
                  </p>
                </div>
              </div>

              {/* Experience */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">
                  Professional Experience
                </h3>
                <div className="space-y-4">
                  {resumeData.highlightedExperience.map((exp: any, idx: number) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="font-bold text-white">
                          {exp.role} — <span className="text-indigo-300">{exp.company}</span>
                        </span>
                        <span className="text-slate-400 text-[11px]">{exp.period}</span>
                      </div>
                      <ul className="space-y-1 text-slate-300 text-[11px] pl-3">
                        {exp.bullets.map((b: string, bIdx: number) => (
                          <li key={bIdx} className="list-disc marker:text-indigo-500">
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Capstone Projects */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">
                  Key Projects & Capabilities
                </h3>
                <div className="space-y-4">
                  {resumeData.selectedProjects.map((proj: any, idx: number) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="font-bold text-white">{proj.title}</span>
                        <span className="text-slate-400 text-[11px]">
                          {proj.technologies.slice(0, 4).join(", ")}
                        </span>
                      </div>
                      <ul className="space-y-1 text-slate-300 text-[11px] pl-3">
                        {proj.bullets.map((b: string, bIdx: number) => (
                          <li key={bIdx} className="list-disc marker:text-indigo-500">
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
                  Education
                </h3>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-white">
                    {resumeData.education.degree} — <span className="text-slate-300">{resumeData.education.institution}</span>
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Class of {resumeData.education.graduationYear} • <strong>CGPA: {resumeData.education.cgpa}</strong>
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-xs">
          <span className="text-slate-400 text-[11px]">
            Ready for candidate review. No unverified claims included.
          </span>
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
