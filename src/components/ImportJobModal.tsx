import React, { useState } from "react";
import { X, PlusCircle, Link as LinkIcon, Sparkles, Building2, MapPin, Send, CheckCircle2 } from "lucide-react";
import { WorkArrangement, CompanyType } from "@prisma/client";

interface ImportJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobImported: () => void;
}

export const ImportJobModal: React.FC<ImportJobModalProps> = ({
  isOpen,
  onClose,
  onJobImported,
}) => {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("Ahmedabad, Gujarat");
  const [workArrangement, setWorkArrangement] = useState<WorkArrangement>(WorkArrangement.HYBRID);
  const [companyType, setCompanyType] = useState<CompanyType>(CompanyType.PRODUCT);
  const [originalUrl, setOriginalUrl] = useState("");
  const [mandatorySkills, setMandatorySkills] = useState("React.js, Next.js, TypeScript, Node.js");
  const [description, setDescription] = useState("");
  const [minSalary, setMinSalary] = useState("500000");
  const [maxSalary, setMaxSalary] = useState("800000");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!title.trim() || !company.trim() || !originalUrl.trim() || !description.trim()) {
      setErrorMessage("Please fill in Title, Company, Official URL, and Description.");
      return;
    }

    try {
      setIsSubmitting(true);
      const skillsArray = mandatorySkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        workArrangement,
        companyType,
        originalUrl: originalUrl.trim(),
        source: "Manual Candidate Ingestion",
        description: description.trim(),
        mandatorySkills: skillsArray,
        preferredSkills: ["PostgreSQL", "Tailwind CSS"],
        minSalary: minSalary ? Number(minSalary) : undefined,
        maxSalary: maxSalary ? Number(maxSalary) : undefined,
        salaryCurrency: "INR",
        salaryIsEstimated: false,
        salarySource: "Employer Listed / Candidate Verified",
        experienceMinYears: 1.0,
        experienceMaxYears: 2.5,
      };

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to ingest job");
      }

      setSuccessMessage(`Opportunity at ${company} ingested & evaluated with 5-factor match score!`);
      setTimeout(() => {
        onJobImported();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <PlusCircle className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">Import &amp; Analyze Live Job</h2>
              <p className="text-xs text-slate-400">
                Paste any legitimate job opening from LinkedIn, Indeed, Naukri, or employer career sites
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {successMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Job Title *</label>
              <input
                type="text"
                placeholder="e.g. Full Stack Developer (Next.js & Node.js)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Company Name *</label>
              <input
                type="text"
                placeholder="e.g. Solvative, Bacancy, Digicorp"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Location</label>
              <input
                type="text"
                placeholder="e.g. Ahmedabad, Gujarat or Remote — India"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Work Arrangement</label>
              <select
                value={workArrangement}
                onChange={(e) => setWorkArrangement(e.target.value as WorkArrangement)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={WorkArrangement.HYBRID}>Hybrid</option>
                <option value={WorkArrangement.REMOTE}>Remote</option>
                <option value={WorkArrangement.ONSITE}>Onsite</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1 font-semibold">Official Job Application URL *</label>
              <input
                type="url"
                placeholder="https://company.com/careers or https://linkedin.com/jobs/..."
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1 font-semibold">Mandatory Technical Skills (comma separated) *</label>
              <input
                type="text"
                placeholder="React.js, Next.js, TypeScript, Node.js, REST APIs"
                value={mandatorySkills}
                onChange={(e) => setMandatorySkills(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Min Salary (INR / year)</label>
              <input
                type="number"
                placeholder="500000"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Max Salary (INR / year)</label>
              <input
                type="number"
                placeholder="800000"
                value={maxSalary}
                onChange={(e) => setMaxSalary(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1 font-semibold">Job Description / Requirements *</label>
              <textarea
                rows={4}
                placeholder="Paste the job description, team overview, and technical expectations here..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Auto-scores with 5-factor mathematical engine upon ingestion.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-md transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {isSubmitting ? "Ingesting & Scoring..." : "Analyze & Ingest Job"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
