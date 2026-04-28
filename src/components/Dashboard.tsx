import React from "react";
import { Activity, Globe, Wifi, WifiOff, Clock, User } from "lucide-react";
import { Site, AgentPerformance } from "../types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function SiteStatusGrid({ sites }: { sites: Site[] }) {
  return (
    <div className="kiosk-grid">
      {sites.map((site) => (
        <div
          key={site.id}
          className="bg-white border border-slate-200 p-1.5 rounded-lg flex items-center gap-2 group transition-all"
        >
          <div className={cn(
            "w-1.5 h-6 rounded-full shrink-0",
            site.status === "online" ? "bg-blue-500" : "bg-rose-500 animate-pulse"
          )} />
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-900 truncate leading-tight">{site.name}</p>
            <p className="text-[8px] text-slate-500 font-mono truncate leading-none">
              {site.latency !== null ? `${site.latency}ms` : "OFFLINE"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsCard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  colorClass = "text-blue-600",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: { value: string; positive: boolean };
  icon: React.ElementType;
  colorClass?: string;
}) {
  return (
    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
      <div className="flex justify-between items-center mb-1">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{title}</p>
        <Icon className={cn("w-3.5 h-3.5", colorClass)} />
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-xl font-black text-slate-900 leading-tight">{value}</h3>
        {change ? (
          <span className={cn(
            "text-[9px] font-black",
            change.positive ? "text-blue-600" : "text-rose-600"
          )}>
            {change.value}
          </span>
        ) : subtitle ? (
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{subtitle}</span>
        ) : null}
      </div>
    </div>
  );
}

export function AgentPerformanceList({ agents }: { agents?: AgentPerformance[] }) {
  if (!agents) return null;
  return (
    <div className="space-y-2">
      {agents.map((agent) => (
        <div key={agent.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs uppercase shadow-sm border border-blue-200">
            {agent.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate leading-tight">{agent.name}</p>
            <p className="text-[10px] text-slate-500 font-medium tracking-tight">Active Support Agent</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-blue-700 leading-none">{agent.resolved}</p>
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Solved</p>
          </div>
          <div className="text-right ml-2 border-l border-slate-100 pl-3">
            <p className="text-sm font-black text-slate-400 leading-none">{agent.open}</p>
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Open</p>
          </div>
        </div>
      ))}
    </div>
  );
}
