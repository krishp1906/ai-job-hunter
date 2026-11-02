import React, { useState, useRef } from "react";
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  ArrowRight, 
  Building2, 
  GraduationCap, 
  Layers, 
  ShieldCheck,
  Check
} from "lucide-react";
import { SkillCategory, ExperienceType, ProficiencyLevel } from "@prisma/client";

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: () => void;
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const [activeInputTab, setActiveInputTab] = useState<"file" | "text">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Parsing state
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setSelectedFile(file);
        setParseError(null);
      } else {
        setParseError("Please select a PDF document (.pdf).");
      }
    }
  };

  const handleParse = async () => {
    try {
      setIsParsing(true);
      setParseError(null);
      setExtractedData(null);

      let res;
      if (activeInputTab === "file") {
        if (!selectedFile) {
          setParseError("Please select a PDF resume file first.");
          setIsParsing(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", selectedFile);
        res = await fetch("/api/candidate/resume-upload", {
          method: "POST",
          body: formData,
        });
      } else {
        if (pastedText.trim().length < 40) {
          setParseError("Please paste your resume text (at least 40 characters).");
          setIsParsing(false);
          return;
        }
        res = await fetch("/api/candidate/resume-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: pastedText }),
        });
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to parse resume");
      }

      setExtractedData(data.extractedData);
    } catch (err: any) {
      setParseError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleApplyProfile = async () => {
    if (!extractedData) return;
    try {
      setIsSaving(true);
      setParseError(null);
      const res = await fetch("/api/candidate/apply-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileData: extractedData }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to apply profile data");
      }

      setSaveSuccess(true);
      setTimeout(() => {
        onProfileUpdated();
        onClose();
      }, 1500);
    } catch (err: any) {
      setParseError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Upload className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">AI Resume Parser &amp; Profile Onboarding</h2>
              <p className="text-xs text-slate-400">
                Upload your resume (PDF) to auto-extract your skills, experience, and personalize the platform
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {parseError && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-semibold text-sm">
                Profile applied successfully! All job match scores have been recalculated.
              </span>
            </div>
          )}

          {!extractedData ? (
            /* STEP 1: Upload or Paste */
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 max-w-xs">
                <button
                  type="button"
                  onClick={() => setActiveInputTab("file")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeInputTab === "file" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Upload PDF
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInputTab("text")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeInputTab === "text" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Paste Text
                </button>
              </div>

              {activeInputTab === "file" ? (
                /* PDF Drop Zone */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition-all space-y-3"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {selectedFile ? selectedFile.name : "Click to select your Resume PDF"}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(1)} KB • Ready to parse`
                        : "Supports all standard PDF resumes. Fast semantic text extraction."}
                    </p>
                  </div>
                </div>
              ) : (
                /* Text Area */
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Paste Resume Text</label>
                  <textarea
                    rows={8}
                    placeholder="Paste the full text of your resume here including contact details, skills, experience, and education..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleParse}
                  disabled={isParsing}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {isParsing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Parsing Resume with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Extract Profile &amp; Skills
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: Review & Edit Extracted Data (Business Rule 12) */
            <div className="space-y-5">
              <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-3.5 flex items-center justify-between text-indigo-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>
                    <strong>Review Extracted Profile (Rule 12):</strong> Verify and edit any field below before applying.
                  </span>
                </div>
                <button
                  onClick={() => setExtractedData(null)}
                  className="text-xs text-indigo-400 hover:text-white underline font-semibold"
                >
                  Upload Different File
                </button>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Candidate Name</label>
                  <input
                    type="text"
                    value={extractedData.name}
                    onChange={(e) => setExtractedData({ ...extractedData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Email</label>
                  <input
                    type="email"
                    value={extractedData.email}
                    onChange={(e) => setExtractedData({ ...extractedData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Phone</label>
                  <input
                    type="text"
                    value={extractedData.phone}
                    onChange={(e) => setExtractedData({ ...extractedData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Current Title</label>
                  <input
                    type="text"
                    value={extractedData.currentPosition}
                    onChange={(e) => setExtractedData({ ...extractedData, currentPosition: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Current Employer</label>
                  <input
                    type="text"
                    value={extractedData.currentCompany}
                    onChange={(e) => setExtractedData({ ...extractedData, currentCompany: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Location</label>
                  <input
                    type="text"
                    value={extractedData.location}
                    onChange={(e) => setExtractedData({ ...extractedData, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Professional Summary */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Professional Summary</label>
                <textarea
                  rows={3}
                  value={extractedData.professionalSummary}
                  onChange={(e) => setExtractedData({ ...extractedData, professionalSummary: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              {/* Education */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1 font-semibold">Degree &amp; Institution</label>
                  <input
                    type="text"
                    value={`${extractedData.educationDegree} • ${extractedData.educationInstitution}`}
                    onChange={(e) => {
                      const parts = e.target.value.split("•");
                      setExtractedData({
                        ...extractedData,
                        educationDegree: parts[0]?.trim() || extractedData.educationDegree,
                        educationInstitution: parts[1]?.trim() || extractedData.educationInstitution,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">CGPA / Percentage</label>
                  <input
                    type="number"
                    step="0.01"
                    value={extractedData.educationCgpa}
                    onChange={(e) => setExtractedData({ ...extractedData, educationCgpa: parseFloat(e.target.value) || 8.5 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Extracted Technical Skills Tags */}
              <div className="space-y-2">
                <label className="block text-slate-400 font-semibold">
                  Extracted Technical Skills ({extractedData.skills?.length || 0})
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 max-h-40 overflow-y-auto">
                  {extractedData.skills?.map((s: any, idx: number) => (
                    <span
                      key={idx}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                        s.category === "CORE"
                          ? "bg-indigo-950/60 text-indigo-300 border-indigo-700/60"
                          : s.category === "ADDITIONAL"
                          ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/60"
                          : "bg-cyan-950/60 text-cyan-300 border-cyan-700/60"
                      }`}
                    >
                      {s.name} ({s.verifiedProficiency})
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setExtractedData(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleApplyProfile}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Applying Profile &amp; Re-Scoring Jobs...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Apply Profile &amp; Recalculate Matches
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
