import React from "react";
import { Activity, Globe, Wifi, WifiOff, Clock, User } from "lucide-react";
import { Site, AgentPerformance, monitoring_stream } from "../types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Video, VideoOff } from "lucide-react";
import Hls from "hls.js";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function HLSPlayer({ url, name }: { url: string; name: string }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    }
  }, [url]);

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
      />
      <div className="absolute top-1 left-1 flex items-center gap-1 bg-black/60 px-1 py-0.5 rounded backdrop-blur-sm border border-white/10">
        <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[6px] font-bold text-white uppercase tracking-tighter">LIVE</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
        <p className="text-[8px] font-bold text-white truncate uppercase tracking-tighter leading-none">{name}</p>
      </div>
    </div>
  );
}

export function VideoMonitoring({ streams }: { streams: monitoring_stream[] }) {
  return (
    <div className="grid grid-cols-2 gap-1 h-[120px]">
      {streams.map((stream) => (
        <div key={stream.id} className="relative bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center h-full">
          {stream.status === "online" ? (
             <HLSPlayer url={stream.url} name={stream.name} />
          ) : (
             <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-1 opacity-50 h-full">
               <VideoOff className="w-4 h-4 text-slate-700" />
               <span className="text-[6px] font-bold text-slate-600 uppercase tracking-tighter">NO SIGNAL</span>
               <div className="absolute bottom-1 left-1 right-1">
                 <p className="text-[8px] font-bold text-slate-500 truncate uppercase tracking-tighter leading-none">{stream.name}</p>
               </div>
             </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function SiteStatusGrid({ sites }: { sites: Site[] }) {
  return (
    <div className="kiosk-grid">
      {sites.map((site) => (
        <div
          key={site.id}
          className="bg-white border border-slate-200 p-1.5 rounded flex items-center gap-2 group transition-all"
        >
          <div className={cn(
            "w-1 h-6 rounded-full shrink-0",
            site.status === "online" ? "bg-blue-500" : "bg-rose-500 animate-pulse"
          )} />
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-900 truncate leading-tight tracking-tight">{site.name}</p>
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
    <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center">
      <div className="flex justify-between items-center mb-0.5">
        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">{title}</p>
        <Icon className={cn("w-3 h-3", colorClass)} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <h3 className="text-lg font-black text-slate-900 leading-none">{value}</h3>
        {change ? (
          <span className={cn(
            "text-[8px] font-black",
            change.positive ? "text-blue-600" : "text-rose-600"
          )}>
            {change.value}
          </span>
        ) : subtitle ? (
          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">{subtitle}</span>
        ) : null}
      </div>
    </div>
  );
}

export function AgentPerformanceList({ agents }: { agents?: AgentPerformance[] }) {
  if (!agents) return null;
  return (
    <div className="space-y-1">
      {agents.map((agent) => (
        <div key={agent.id} className="flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-xl shadow-sm">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[8px] uppercase border border-blue-200">
            {agent.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold text-slate-900 truncate leading-tight">{agent.name}</p>
            <p className="text-[7px] text-slate-500 font-medium tracking-tight">Active Support</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-blue-700 leading-none">{agent.resolved}</p>
            <p className="text-[6px] text-slate-400 font-black uppercase tracking-tighter">Solved</p>
          </div>
          <div className="text-right ml-1 border-l border-slate-100 pl-2">
            <p className="text-[9px] font-black text-slate-400 leading-none">{agent.open}</p>
            <p className="text-[6px] text-slate-400 font-black uppercase tracking-tighter">Open</p>
          </div>
        </div>
      ))}
    </div>
  );
}
