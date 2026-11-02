import React, { useState } from "react";
import { X, User, Briefcase, GraduationCap, MapPin, Code2, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { SkillCategory, ExperienceType, ProficiencyLevel } from "@prisma/client";

interface CandidateProfileModalProps {
  candidate: any;
  isOpen: boolean;
  onClose: () => void;
  onRefreshProfile: () => void;
}

export const CandidateProfileModal: React.FC<CandidateProfileModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onRefreshProfile,
}) => {
  const [activeTab, setActiveTab] = useState<"profile" | "skills">("profile");

  // Form states
  const [manualExperience, setManualExperience] = useState<string>(
    candidate?.manualExperienceYears?.toString() || ""
  );
  const [professionalSummary, setProfessionalSummary] = useState<string>(
    candidate?.professionalSummary || ""
  );

  // New skill states
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState<SkillCategory>(SkillCategory.CORE);
  const [newSkillExpType, setNewSkillExpType] = useState<ExperienceType>(ExperienceType.PROFESSIONAL);
  const [newSkillProficiency, setNewSkillProficiency] = useState<ProficiencyLevel>(ProficiencyLevel.INTERMEDIATE);
  const [newSkillYears, setNewSkillYears] = useState("1.0");

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !candidate) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setStatusMessage(null);

      const parsedExp = manualExperience.trim() === "" ? null : parseFloat(manualExperience);

      const res = await fetch("/api/candidate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manualExperienceYears: parsedExp,
          professionalSummary,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage("Profile updated successfully!");
        onRefreshProfile();
      } else {
        setStatusMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    try {
      setIsSubmitting(true);
      setStatusMessage(null);

      const res = await fetch("/api/candidate/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSkillName.trim(),
          category: newSkillCategory,
          experienceType: newSkillExpType,
          verifiedProficiency: newSkillProficiency,
          yearsOfExperience: parseFloat(newSkillYears) || 1.0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Skill '${newSkillName}' upserted successfully!`);
        setNewSkillName("");
        onRefreshProfile();
      } else {
        setStatusMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSkill = async (skillId: string, skillName: string) => {
    try {
      setStatusMessage(null);
      const res = await fetch(`/api/candidate/skills/${skillId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Skill '${skillName}' removed.`);
        onRefreshProfile();
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  const coreSkills = candidate.skills?.filter((s: any) => s.category === "CORE") || [];
  const additionalSkills = candidate.skills?.filter((s: any) => s.category === "ADDITIONAL") || [];
  const familiarSkills = candidate.skills?.filter((s: any) => s.category === "FAMILIAR") || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <User className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white">Candidate Profile & Skills Manager</h2>
              <p className="text-xs text-slate-400">
                Manage candidate verified experience, skills categorization, and targets.
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

        {/* Tab Switcher */}
        <div className="px-6 py-2.5 bg-slate-950/80 border-b border-slate-800 flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-2 transition-colors border-b-2 ${
              activeTab === "profile"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Profile & Experience Override
          </button>
          <button
            onClick={() => setActiveTab("skills")}
            className={`pb-2 transition-colors border-b-2 ${
              activeTab === "skills"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Technical Skills ({candidate.skills?.length || 0})
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="px-6 py-2 bg-indigo-950/40 border-b border-indigo-800/40 text-xs text-indigo-300 flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {activeTab === "profile" ? (
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              {/* Identity Details Readonly */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-500 block">Candidate Name</span>
                  <span className="font-bold text-white text-sm">{candidate.name}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Current Employer</span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                    {candidate.currentPosition} at {candidate.currentCompany}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Location</span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    {candidate.location}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Education</span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                    {candidate.educationDegree} (Silver Oak Univ, CGPA {candidate.educationCgpa})
                  </span>
                </div>
              </div>

              {/* Dynamic Experience Override Control */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="block font-semibold text-white">
                  Experience Calculation Mode (Dynamic vs Manual Override)
                </label>
                <p className="text-[11px] text-slate-400">
                  Dynamic calculation computes experience from employment start date ({new Date(candidate.employmentStartDate).toLocaleDateString()}). Current dynamic calculation: <strong>{candidate.dynamicExperience?.formatted}</strong>.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="Leave empty for dynamic calculation..."
                    value={manualExperience}
                    onChange={(e) => setManualExperience(e.target.value)}
                    className="w-64 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  {candidate.manualExperienceYears != null && (
                    <button
                      type="button"
                      onClick={() => setManualExperience("")}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                    >
                      Revert to Dynamic
                    </button>
                  )}
                </div>
              </div>

              {/* Professional Summary */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-white">Professional Summary</label>
                <textarea
                  rows={4}
                  value={professionalSummary}
                  onChange={(e) => setProfessionalSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Profile Changes"}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Add New Skill Form */}
              <form onSubmit={handleAddSkill} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  Add or Update Skill (Strict Non-Exaggeration)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Skill Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Next.js, Redis, Docker"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Category</label>
                    <select
                      value={newSkillCategory}
                      onChange={(e) => setNewSkillCategory(e.target.value as SkillCategory)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                    >
                      <option value="CORE">CORE</option>
                      <option value="ADDITIONAL">ADDITIONAL</option>
                      <option value="FAMILIAR">FAMILIAR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Experience Type</label>
                    <select
                      value={newSkillExpType}
                      onChange={(e) => setNewSkillExpType(e.target.value as ExperienceType)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                    >
                      <option value="PROFESSIONAL">PROFESSIONAL</option>
                      <option value="PERSONAL_PROJECT">PERSONAL PROJECT</option>
                      <option value="FAMILIARITY">FAMILIARITY</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Proficiency</label>
                    <select
                      value={newSkillProficiency}
                      onChange={(e) => setNewSkillProficiency(e.target.value as ProficiencyLevel)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                    >
                      <option value="BEGINNER">BEGINNER</option>
                      <option value="INTERMEDIATE">INTERMEDIATE</option>
                      <option value="ADVANCED">ADVANCED</option>
                      <option value="EXPERT">EXPERT</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting || !newSkillName.trim()}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    Save Skill
                  </button>
                </div>
              </form>

              {/* Skills Listings */}
              <div className="space-y-4">
                {/* Core Skills */}
                <div>
                  <h4 className="font-bold text-white mb-2 flex items-center justify-between">
                    <span>Core Skills ({coreSkills.length})</span>
                    <span className="text-[10px] text-emerald-400 font-normal">Production Verified</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {coreSkills.map((s: any) => (
                      <div key={s.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-white block">{s.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {s.verifiedProficiency} • {s.experienceType.replace(/_/g, " ")}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteSkill(s.id, s.name)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Skills */}
                <div>
                  <h4 className="font-bold text-white mb-2 flex items-center justify-between">
                    <span>Additional Skills ({additionalSkills.length})</span>
                    <span className="text-[10px] text-cyan-400 font-normal">Frameworks & Tools</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {additionalSkills.map((s: any) => (
                      <div key={s.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-white block">{s.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {s.verifiedProficiency} • {s.experienceType.replace(/_/g, " ")}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteSkill(s.id, s.name)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Familiar Technologies */}
                <div>
                  <h4 className="font-bold text-white mb-2 flex items-center justify-between">
                    <span>Familiar Technologies ({familiarSkills.length})</span>
                    <span className="text-[10px] text-amber-400 font-normal">Capped (Never Exaggerated)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {familiarSkills.map((s: any) => (
                      <div key={s.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-white block">{s.name}</span>
                          <span className="text-[10px] text-amber-400">
                            {s.verifiedProficiency} • {s.experienceType}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteSkill(s.id, s.name)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
