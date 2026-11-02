import React, { useState } from "react";
import { Search, Filter, RefreshCw, PlusCircle, Globe, Sparkles } from "lucide-react";
import { ImportJobModal } from "./ImportJobModal";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  roleFilter: string;
  onRoleFilterChange: (val: string) => void;
  locationFilter: string;
  onLocationFilterChange: (val: string) => void;
  companyTypeFilter: string;
  onCompanyTypeFilterChange: (val: string) => void;
  minScoreFilter: number;
  onMinScoreFilterChange: (val: number) => void;
  onTriggerDiscovery: () => void;
  isDiscovering: boolean;
  onJobImported: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  locationFilter,
  onLocationFilterChange,
  companyTypeFilter,
  onCompanyTypeFilterChange,
  minScoreFilter,
  onMinScoreFilterChange,
  onTriggerDiscovery,
  isDiscovering,
  onJobImported,
}) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <>
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 shadow-md">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search legitimate jobs by title, company, or keyword (e.g. Next.js, Mapbox, NestJS, Digicorp)..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Action Buttons: Live Discover & Import Job */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onTriggerDiscovery}
              disabled={isDiscovering}
              title="Actively scan regional tech portals for new matching openings"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs md:text-sm font-semibold transition-colors disabled:opacity-50 shrink-0 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isDiscovering ? "animate-spin" : ""}`} />
              {isDiscovering ? "Scanning Live Portals..." : "Scan Live Jobs"}
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              title="Paste any real job posting from LinkedIn, Indeed, or company sites"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs md:text-sm font-semibold transition-colors shrink-0 shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              Import Job URL
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          {/* Role Category */}
          <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            {["ALL", "FULL_STACK", "BACKEND", "FRONTEND"].map((role) => (
              <button
                key={role}
                onClick={() => onRoleFilterChange(role)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  roleFilter === role
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {role === "ALL" ? "All Roles" : role === "FULL_STACK" ? "Full Stack" : role === "BACKEND" ? "Backend" : "Frontend"}
              </button>
            ))}
          </div>

          {/* Location Filter */}
          <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            {["ALL", "AHMEDABAD", "GANDHINAGAR", "REMOTE"].map((loc) => (
              <button
                key={loc}
                onClick={() => onLocationFilterChange(loc)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  locationFilter === loc
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {loc === "ALL" ? "All Locations" : loc === "AHMEDABAD" ? "Ahmedabad" : loc === "GANDHINAGAR" ? "Gandhinagar" : "Remote India"}
              </button>
            ))}
          </div>

          {/* Minimum Match Score */}
          <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            {[
              { label: "All Matches", val: 0 },
              { label: "≥ 70%", val: 70 },
              { label: "≥ 80%", val: 80 },
            ].map((score) => (
              <button
                key={score.val}
                onClick={() => onMinScoreFilterChange(score.val)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  minScoreFilter === score.val
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {score.label}
              </button>
            ))}
          </div>

          {/* Company Type Dropdown */}
          <select
            value={companyTypeFilter}
            onChange={(e) => onCompanyTypeFilterChange(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Company Types</option>
            <option value="PRODUCT">Product / SaaS</option>
            <option value="STARTUP">Startups</option>
            <option value="IT_SERVICE">IT Services</option>
            <option value="FINTECH">Fintech</option>
          </select>
        </div>
      </div>

      <ImportJobModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onJobImported={onJobImported}
      />
    </>
  );
};
