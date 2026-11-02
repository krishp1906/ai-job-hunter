import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  Building2, 
  MapPin, 
  ExternalLink, 
  ArrowLeft, 
  Award, 
  ShieldCheck, 
  Sparkles, 
  HelpCircle, 
  Mail, 
  FileText, 
  CheckCircle2, 
  Clock 
} from "lucide-react";
import { JobDetailInteractive } from "./JobDetailInteractive";

export const dynamic = "force-dynamic";

interface JobPageProps {
  params: { id: string };
}

export default async function JobDetailPage({ params }: JobPageProps) {
  const job = await prisma.jobListing.findUnique({
    where: { id: params.id },
    include: {
      matchAnalysis: true,
      recommendations: true,
      applications: true,
    },
  });

  if (!job) {
    notFound();
  }

  const match = job.matchAnalysis;
  const score = match?.overallScore ?? 0;
  const matchingSkills: string[] = match ? JSON.parse(match.matchingSkills || "[]") : [];
  const missingMandatory: string[] = match ? JSON.parse(match.missingMandatorySkills || "[]") : [];
  const mandatorySkills: string[] = JSON.parse(job.mandatorySkills || "[]");
  const preferredSkills: string[] = JSON.parse(job.preferredSkills || "[]");
  const responsibilities: string[] = JSON.parse(job.responsibilities || "[]");

  const isHighMatch = score >= 80;
  const isMedMatch = score >= 70 && score < 80;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 lg:p-12">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to AI JobHunter Dashboard
          </Link>
        </div>

        {/* Hero Card */}
        <div
          className={`bg-slate-900/80 border rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl ${
            isHighMatch
              ? "border-emerald-500/30"
              : isMedMatch
              ? "border-amber-500/30"
              : "border-slate-800"
          }`}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {job.title}
                </h1>
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                    isHighMatch
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : isMedMatch
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  {score.toFixed(1)}% Match
                </div>
              </div>

              <p className="text-sm text-slate-400 flex flex-wrap items-center gap-2 mt-2">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  {job.company}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  {job.location} ({job.workArrangement})
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  Posted {new Date(job.postedAt).toLocaleDateString()}
                </span>
              </p>
            </div>

            {/* Salary info & Original URL */}
            <div className="text-right">
              <div className="text-lg font-bold text-white">
                {job.minSalary && job.maxSalary
                  ? `₹${(job.minSalary / 100000).toFixed(1)} - ${(job.maxSalary / 100000).toFixed(1)} LPA`
                  : "Salary Disclosed Upon Request"}
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 justify-end">
                <span>{job.salaryIsEstimated ? "Estimated Benchmark" : "Employer Listed"}</span>
                <span>•</span>
                <a
                  href={job.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-semibold"
                >
                  Official URL <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Interactive Action Bar (Quick Apply, Cold Mail, Tailor Resume) */}
          <JobDetailInteractive job={job} />
        </div>

        {/* 5-Factor Scoring Breakdown */}
        {match && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Explainable 5-Factor Match Evaluation
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Technical (35%)</span>
                <span className="text-xl font-black text-indigo-300 mt-1 block">{match.technicalScore}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Experience (20%)</span>
                <span className="text-xl font-black text-indigo-300 mt-1 block">{match.experienceScore}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Responsibilities (20%)</span>
                <span className="text-xl font-black text-indigo-300 mt-1 block">{match.responsibilityScore}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Role Target (15%)</span>
                <span className="text-xl font-black text-indigo-300 mt-1 block">{match.roleScore}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-slate-400 text-[11px] block">Location (10%)</span>
                <span className="text-xl font-black text-indigo-300 mt-1 block">{match.locationScore}%</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              <strong className="text-white">Scoring Assessment: </strong>
              {match.scoringExplanation}
            </p>

            {/* Skills Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-2">Matching Candidate Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {matchingSkills.map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-md bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="font-bold text-rose-400 block mb-2">Missing Mandatory Requirements</span>
                {missingMandatory.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {missingMandatory.map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-md bg-rose-950/40 text-rose-300 border border-rose-800/40 text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-emerald-400 text-[11px]">All mandatory technical skills satisfied!</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Job Description & Requirements */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs md:text-sm">
          <h2 className="text-base font-bold text-white">Job Description &amp; Responsibilities</h2>
          <p className="text-slate-300 leading-relaxed whitespace-pre-line">{job.description}</p>

          {responsibilities.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="font-bold text-white">Key Responsibilities</h3>
              <ul className="space-y-1.5 text-slate-300 text-xs pl-4">
                {responsibilities.map((r, idx) => (
                  <li key={idx} className="list-disc marker:text-indigo-400">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 text-xs">
            <div>
              <span className="font-bold text-slate-400 block mb-1.5">Mandatory Skills Required:</span>
              <div className="flex flex-wrap gap-1.5">
                {mandatorySkills.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {preferredSkills.length > 0 && (
              <div>
                <span className="font-bold text-slate-400 block mb-1.5">Preferred Skills:</span>
                <div className="flex flex-wrap gap-1.5">
                  {preferredSkills.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded bg-slate-800/60 text-slate-300 border border-slate-700/60">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
