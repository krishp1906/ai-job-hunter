import prisma from "@/lib/prisma";
import { CandidateService } from "@/lib/services/candidate-service";
import { JobService } from "@/lib/services/job-service";
import { DashboardClient } from "@/components/DashboardClient";
import { Cpu, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const candidate = await CandidateService.getProfile();
  const jobs = await JobService.getJobListings();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Navbar */}
        <header className="border-b border-slate-800/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30 shadow-inner">
              <Cpu className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">AI JobHunter</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 border border-indigo-700/40">
                  v1.0 Production
                </span>
              </div>
              <p className="text-xs text-slate-400">
                AI Recruitment &amp; Match Analysis Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              All 8 Phases Complete &amp; Verified
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium bg-slate-900 text-slate-300 border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Anti-Hallucination Active
            </span>
          </div>
        </header>

        {/* Dashboard Client Component */}
        <DashboardClient
          initialCandidate={candidate}
          initialJobs={jobs}
        />

        {/* Footer */}
        <footer className="border-t border-slate-800/80 pt-8 pb-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-4">
            <span>AI JobHunter Engine</span>
            <span>•</span>
            <span>5-Factor Explainable Scoring (35/20/20/15/10)</span>
            <span>•</span>
            <span>Zero-Fabrication Resume Profiles</span>
            <span>•</span>
            <span>Strict Rule 8 Candidate Gate</span>
          </div>
          <p>© {new Date().getFullYear()} AI JobHunter. Zero Fake Jobs &amp; Factual Resumes.</p>
        </footer>
      </div>
    </main>
  );
}
