"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { DashboardStats } from "./DashboardStats";
import { FilterBar } from "./FilterBar";
import { JobCard } from "./JobCard";
import { JobDetailModal } from "./JobDetailModal";
import { TailoredResumeModal } from "./TailoredResumeModal";
import { CandidateProfileModal } from "./CandidateProfileModal";
import { ColdEmailModal } from "./ColdEmailModal";
import { ApplicationModal } from "./ApplicationModal";
import { ResumeUploadModal } from "./ResumeUploadModal";
import { 
  Briefcase, 
  MapPin, 
  GraduationCap, 
  Layers, 
  CheckCircle2,
  Settings,
  Sparkles,
  ExternalLink,
  Clock,
  Send,
  Building2,
  FileCheck2,
  Bookmark,
  Upload
} from "lucide-react";
import { ApplicationStatus } from "@prisma/client";

interface DashboardClientProps {
  initialCandidate: any;
  initialJobs: any[];
}

export const DashboardClient: React.FC<DashboardClientProps> = ({
  initialCandidate,
  initialJobs,
}) => {
  const [candidate, setCandidate] = useState<any>(initialCandidate);
  const [jobs, setJobs] = useState<any[]>(initialJobs);
  const [activeMainTab, setActiveMainTab] = useState<"opportunities" | "tracker">("opportunities");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [companyTypeFilter, setCompanyTypeFilter] = useState("ALL");
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryNotification, setDiscoveryNotification] = useState<string | null>(null);

  // Modals state
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<any | null>(null);
  const [selectedJobForTailor, setSelectedJobForTailor] = useState<any | null>(null);
  const [selectedJobForColdEmail, setSelectedJobForColdEmail] = useState<any | null>(null);
  const [selectedJobForApplication, setSelectedJobForApplication] = useState<any | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isResumeUploadOpen, setIsResumeUploadOpen] = useState(false);

  // Debounce search query to optimize API calls (300ms)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // Refresh candidate
  const refreshCandidate = async () => {
    try {
      const res = await fetch("/api/candidate");
      const data = await res.json();
      if (data.success) {
        setCandidate(data.candidate);
      }
    } catch (err) {
      console.error("Failed to refresh candidate:", err);
    }
  };

  // Optimized fetch jobs with debounce & params
  const refreshJobs = async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "ALL") params.append("roleCategory", roleFilter);
      if (locationFilter !== "ALL") params.append("location", locationFilter);
      if (companyTypeFilter !== "ALL") params.append("companyType", companyTypeFilter);
      if (minScoreFilter > 0) params.append("minMatchScore", minScoreFilter.toString());
      if (debouncedSearch.trim()) params.append("searchQuery", debouncedSearch.trim());

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error("Failed to refresh jobs:", err);
    }
  };

  useEffect(() => {
    refreshJobs();
  }, [roleFilter, locationFilter, companyTypeFilter, minScoreFilter, debouncedSearch]);

  // Dynamic discovery trigger
  const handleTriggerDiscovery = async () => {
    try {
      setIsDiscovering(true);
      setDiscoveryNotification(null);
      const res = await fetch("/api/jobs/discover", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setDiscoveryNotification(data.message);
        await refreshJobs();
        setTimeout(() => setDiscoveryNotification(null), 5000);
      }
    } catch (err) {
      console.error("Discovery error:", err);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Update application status
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
    if (!data.success) {
      throw new Error(data.error);
    }
    // Optimistic UI update
    setJobs((prevJobs) =>
      prevJobs.map((j) => {
        if (j.id === jobId) {
          return {
            ...j,
            applications: [
              {
                ...j.applications?.[0],
                status,
                approvedByCandidate: approved,
                notes: notes || j.applications?.[0]?.notes,
              },
            ],
          };
        }
        return j;
      })
    );
  };

  // Toggle Save quick action
  const handleToggleSave = async (job: any) => {
    const isCurrentlySaved = job.applications?.[0]?.status === ApplicationStatus.SAVED;
    const newStatus = isCurrentlySaved ? ApplicationStatus.DISCOVERED : ApplicationStatus.SAVED;
    await handleUpdateStatus(job.id, newStatus, false, isCurrentlySaved ? "Unsaved" : "Saved for review");
  };

  // Calculate metrics
  const discoveredCount = jobs.length;
  const match80Count = jobs.filter((j) => (j.matchAnalysis?.overallScore || 0) >= 80).length;
  const match70Count = jobs.filter((j) => (j.matchAnalysis?.overallScore || 0) >= 70).length;
  const savedJobs = jobs.filter((j) => j.applications?.[0]?.status === ApplicationStatus.SAVED);
  const appliedJobs = jobs.filter((j) => j.applications?.[0]?.status === ApplicationStatus.APPLIED);
  const interviewJobs = jobs.filter((j) => j.applications?.[0]?.status === ApplicationStatus.INTERVIEWING);

  const savedCount = savedJobs.length;
  const appliedCount = appliedJobs.length;
  const interviewCount = interviewJobs.length;
  const conversionRate = appliedCount > 0 ? (interviewCount / appliedCount) * 100 : 0;

  // Filtered tracker list
  const trackerJobs = jobs.filter(
    (j) => j.applications && j.applications.length > 0 && j.applications[0].status !== ApplicationStatus.DISCOVERED
  );

  return (
    <div className="space-y-8">
      {/* Candidate Hero Card */}
      {candidate && (
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-800 pb-6">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {candidate.name}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Full Stack Developer
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Candidate Active
                </span>
              </div>

              <p className="text-slate-300 font-medium text-sm mt-2 flex flex-wrap items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <span>{candidate.currentPosition}</span>
                <span className="text-slate-500">•</span>
                <span className="text-white font-semibold">{candidate.currentCompany}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">Started {new Date(candidate.employmentStartDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
              </p>
            </div>

            {/* Quick Metadata & Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Experience</span>
                <span className="font-bold text-emerald-400 text-xs">
                  {candidate.dynamicExperience?.formatted || "1+ years"}
                </span>
              </div>

              <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Location</span>
                <span className="font-semibold text-slate-200 text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-400" /> Ahmedabad, IN
                </span>
              </div>

              <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Education</span>
                <span className="font-semibold text-slate-200 text-xs flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-amber-400" /> CGPA {candidate.educationCgpa}
                </span>
              </div>

              <button
                onClick={() => setIsResumeUploadOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
                title="Upload your PDF resume to auto-parse and update your profile"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-200" />
                Upload Resume (PDF)
              </button>

              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
              >
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                Edit Profile &amp; Skills
              </button>
            </div>
          </div>

          <p className="mt-5 text-xs md:text-sm text-slate-300 leading-relaxed max-w-5xl">
            {candidate.professionalSummary}
          </p>

          {/* Quick Target Criteria Badges */}
          <div className="mt-5 pt-4 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 font-semibold mr-1">Target Roles:</span>
              {candidate.targetRoles?.slice(0, 5).map((role: string) => (
                <span key={role} className="px-2.5 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60 text-[11px]">
                  {role}
                </span>
              ))}
              {candidate.targetRoles?.length > 5 && (
                <span className="text-[11px] text-slate-500">+{candidate.targetRoles.length - 5} more</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 font-semibold mr-1">Locations:</span>
              {candidate.targetLocations?.map((loc: string) => (
                <span key={loc} className="px-2 py-0.5 rounded-md bg-indigo-950/50 text-indigo-300 border border-indigo-800/40 text-[11px]">
                  {loc}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats Bar */}
      <DashboardStats
        discoveredCount={discoveredCount}
        match80Count={match80Count}
        match70Count={match70Count}
        savedCount={savedCount}
        appliedCount={appliedCount}
        interviewCount={interviewCount}
        conversionRate={conversionRate}
      />

      {/* Discovery Notification Toast */}
      {discoveryNotification && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-emerald-300 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{discoveryNotification}</span>
          </div>
          <button onClick={() => setDiscoveryNotification(null)} className="text-emerald-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Tabs (Opportunities Feed vs Applications Tracker) */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-1">
        <div className="flex items-center gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveMainTab("opportunities")}
            className={`pb-2.5 border-b-2 flex items-center gap-2 transition-colors ${
              activeMainTab === "opportunities"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            Discovered Opportunities ({jobs.length})
          </button>

          <button
            onClick={() => setActiveMainTab("tracker")}
            className={`pb-2.5 border-b-2 flex items-center gap-2 transition-colors ${
              activeMainTab === "tracker"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            My Applications Tracker ({trackerJobs.length})
          </button>
        </div>
      </div>

      {activeMainTab === "opportunities" ? (
        <>
          {/* Filter Bar with Live Search & Import */}
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            locationFilter={locationFilter}
            onLocationFilterChange={setLocationFilter}
            companyTypeFilter={companyTypeFilter}
            onCompanyTypeFilterChange={setCompanyTypeFilter}
            minScoreFilter={minScoreFilter}
            onMinScoreFilterChange={setMinScoreFilter}
            onTriggerDiscovery={handleTriggerDiscovery}
            isDiscovering={isDiscovering}
            onJobImported={refreshJobs}
          />

          {/* Opportunities Grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                Showing <strong className="text-white">{jobs.length}</strong> verified opportunities
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Live Dynamic Discovery • 1-Click Apply • Tailored Cover Letter &amp; Resume
              </span>
            </div>

            {jobs.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
                <Layers className="w-8 h-8 text-slate-600 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-300">No opportunities match the current filter</h3>
                <p className="text-xs text-slate-500">
                  Try adjusting the location or score threshold, or click &quot;Discover Jobs&quot; to scan for new listings.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {jobs.map((job) => {
                  const isSaved = job.applications?.[0]?.status === ApplicationStatus.SAVED;
                  const isApplied = job.applications?.[0]?.status === ApplicationStatus.APPLIED;

                  return (
                    <JobCard
                      key={job.id}
                      job={job}
                      onOpenDetails={(j) => setSelectedJobForDetail(j)}
                      onOpenTailorResume={(j) => setSelectedJobForTailor(j)}
                      onOpenColdEmail={(j) => setSelectedJobForColdEmail(j)}
                      onStartApplication={(j) => setSelectedJobForApplication(j)}
                      onToggleSave={handleToggleSave}
                      isSaved={isSaved}
                      isApplied={isApplied}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        /* Applications Tracker Tab */
        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Tracking <strong className="text-white">{trackerJobs.length}</strong> active applications in your pipeline
            </span>
          </div>

          {trackerJobs.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
              <FileCheck2 className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-300">No applications recorded yet</h3>
              <p className="text-xs text-slate-500">
                Browse discovered opportunities and click &quot;Apply&quot; to submit and log your application here.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-4">Company &amp; Role</th>
                      <th className="p-4">Match Score</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Submission Method &amp; Notes</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {trackerJobs.map((job) => {
                      const app = job.applications[0];
                      const score = job.matchAnalysis?.overallScore || 0;

                      return (
                        <tr key={job.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4">
                            <Link href={`/jobs/${job.id}`} className="font-bold text-white hover:text-indigo-300 block">
                              {job.title}
                            </Link>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Building2 className="w-3 h-3 text-indigo-400" />
                              {job.company} • {job.location}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                              {score.toFixed(1)}%
                            </span>
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                app.status === "APPLIED"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : app.status === "INTERVIEWING"
                                  ? "bg-violet-500/10 text-violet-400 border border-violet-500/30"
                                  : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>

                          <td className="p-4 max-w-xs">
                            <p className="text-[11px] text-slate-300 leading-snug truncate">
                              {app.notes || "Recorded in candidate tracker."}
                            </p>
                            {app.appliedAt && (
                              <span className="text-[10px] text-slate-500 block mt-0.5">
                                Logged: {new Date(app.appliedAt).toLocaleDateString()}
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => setSelectedJobForApplication(job)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold"
                            >
                              Manage / Materials
                            </button>
                            <a
                              href={job.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 text-[11px] font-semibold"
                            >
                              Portal <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* MODALS */}
      <ApplicationModal
        job={selectedJobForApplication}
        isOpen={!!selectedJobForApplication}
        onClose={() => setSelectedJobForApplication(null)}
        onSaveApplication={handleUpdateStatus}
      />

      <JobDetailModal
        job={selectedJobForDetail}
        isOpen={!!selectedJobForDetail}
        onClose={() => setSelectedJobForDetail(null)}
        onUpdateStatus={handleUpdateStatus}
        onOpenTailorResume={(j) => {
          setSelectedJobForDetail(null);
          setSelectedJobForTailor(j);
        }}
      />

      <ColdEmailModal
        job={selectedJobForColdEmail}
        isOpen={!!selectedJobForColdEmail}
        onClose={() => setSelectedJobForColdEmail(null)}
        onMarkApplied={(jobId) => handleUpdateStatus(jobId, ApplicationStatus.APPLIED, true, "Applied via Cold Email")}
      />

      <TailoredResumeModal
        job={selectedJobForTailor}
        isOpen={!!selectedJobForTailor}
        onClose={() => setSelectedJobForTailor(null)}
      />

      <CandidateProfileModal
        candidate={candidate}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onRefreshProfile={refreshCandidate}
      />

      <ResumeUploadModal
        isOpen={isResumeUploadOpen}
        onClose={() => setIsResumeUploadOpen(false)}
        onProfileUpdated={() => {
          refreshCandidate();
          refreshJobs();
        }}
      />
    </div>
  );
};
