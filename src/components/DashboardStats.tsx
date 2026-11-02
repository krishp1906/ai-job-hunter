import React from "react";
import { Sparkles, Bookmark, Send, Users, TrendingUp, Compass, Target } from "lucide-react";

interface StatsProps {
  discoveredCount: number;
  match80Count: number;
  match70Count: number;
  savedCount: number;
  appliedCount: number;
  interviewCount: number;
  conversionRate: number;
}

export const DashboardStats: React.FC<StatsProps> = ({
  discoveredCount,
  match80Count,
  match70Count,
  savedCount,
  appliedCount,
  interviewCount,
  conversionRate,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Discovered</span>
          <Compass className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-white">{discoveredCount}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Pipeline total</span>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-emerald-500/20 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Match ≥ 80%</span>
          <Target className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-emerald-400">{match80Count}</span>
          <span className="text-[11px] text-emerald-500/80 block mt-0.5">Prime candidates</span>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Match ≥ 70%</span>
          <Sparkles className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-amber-400">{match70Count}</span>
          <span className="text-[11px] text-amber-500/80 block mt-0.5">Strong potential</span>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Saved</span>
          <Bookmark className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-cyan-400">{savedCount}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Under evaluation</span>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Applied</span>
          <Send className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-indigo-400">{appliedCount}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Approved & sent</span>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Interviews</span>
          <Users className="w-4 h-4 text-violet-400" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-violet-400">{interviewCount}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">In progress</span>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Conversion</span>
          <TrendingUp className="w-4 h-4 text-rose-400" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-rose-400">{conversionRate.toFixed(1)}%</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Interview rate</span>
        </div>
      </div>
    </div>
  );
};
