import React from "react";
import { Activity, Globe, Wifi, WifiOff, Clock, User, AlertCircle } from "lucide-react";
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

    if (typeof Hls !== "undefined" && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      return () => {
        hls.destroy();
      };
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
    <div className="grid grid-cols-2 gap-1 h-full">
      {streams.map((stream) => (
        <div key={stream.id} className={cn(
          "relative bg-slate-900 rounded-lg overflow-hidden border flex items-center justify-center min-h-0",
          stream.status === "online" ? "border-slate-800" : "border-rose-500/50 flash-red shadow-[0_0_15px_rgba(225,29,72,0.1)]"
        )}>
          {stream.status === "online" ? (
             <HLSPlayer url={stream.url} name={stream.name} />
          ) : (
             <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-1 opacity-50 h-full">
               <VideoOff className="w-4 h-4 text-rose-500/50 animate-pulse" />
               <span className="text-[6px] font-bold text-rose-500/70 uppercase tracking-tighter">NO SIGNAL</span>
               <div className="absolute bottom-1 left-1 right-1">
                 <p className="text-[8px] font-bold text-slate-500 truncate uppercase tracking-tighter leading-none">{stream.name}</p>
               </div>
             </div>
          )}
          {stream.status === "online" && (
            <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] z-10" />
          )}
        </div>
      ))}
    </div>
  );
}

export function SiteStatusGrid({ sites }: { sites: Site[] }) {
  const offlineSites = sites.filter(s => s.status === 'offline');
  const onlineSites = sites.filter(s => s.status === 'online');

  return (
    <div className="flex flex-col gap-4">
      {offlineSites.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 px-1">
            <AlertCircle className="w-2.5 h-2.5 text-rose-500 animate-pulse" />
            <span className="text-[7px] font-black text-rose-900 uppercase tracking-widest leading-none">Critical Outages ({offlineSites.length})</span>
          </div>
          <div className="kiosk-grid">
            {offlineSites.map((site) => (
              <div key={site.id}>
                <SiteCard site={site} />
              </div>
            ))}
          </div>
          <div className="h-px bg-rose-100/50 my-1" />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 px-1">
          <Globe className="w-2.5 h-2.5 text-emerald-500/50" />
          <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Healthy Operational Nodes ({onlineSites.length})</span>
        </div>
        <div className="kiosk-grid">
          {onlineSites.map((site) => (
            <div key={site.id}>
              <SiteCard site={site} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SiteCard({ site }: { site: Site }) {
  return (
    <div
      className={cn(
        "bg-white border border-slate-200 p-1 rounded flex items-center gap-1.5 group transition-all",
        site.status === "offline" && "flash-red border-rose-200 shadow-[0_0_15px_rgba(225,29,72,0.1)]"
      )}
    >
      <div className={cn(
        "w-0.5 h-5 rounded-full shrink-0",
        site.status === "online" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(225,29,72,0.5)]"
      )} />
      <div className="min-w-0">
        <p className={cn(
          "text-[8px] font-bold truncate leading-tight tracking-tight uppercase",
          site.status === "online" ? "text-slate-900" : "text-rose-900"
        )}>{site.name}</p>
        <p className={cn(
          "text-[7px] font-mono truncate leading-none opacity-70",
          site.status === "online" ? "text-slate-500" : "text-rose-500/70"
        )}>
          {site.latency !== null ? `${site.latency}ms` : "OFFLINE"}
        </p>
      </div>
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
    <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-center">
      <div className="flex justify-between items-center">
        <p className="text-[7px] text-slate-500 font-bold uppercase tracking-wider">{title}</p>
        <Icon className={cn("w-2.5 h-2.5", colorClass)} />
      </div>
      <div className="flex items-baseline gap-1">
        <h3 className="text-base font-black text-slate-900 leading-none">{value}</h3>
        {change ? (
          <span className={cn(
            "text-[7px] font-black",
            change.positive ? "text-blue-600" : "text-rose-600"
          )}>
            {change.value}
          </span>
        ) : subtitle ? (
          <span className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter">{subtitle}</span>
        ) : null}
      </div>
    </div>
  );
}

export function AgentPerformanceList({ agents }: { agents?: AgentPerformance[] }) {
  if (!agents) return null;
  return (
    <div className="flex flex-col gap-0.5">
      {agents.slice(0, 4).map((agent) => (
        <div key={agent.id} className="flex items-center gap-1 px-1 py-0.5 bg-white border border-slate-100 rounded shadow-sm">
          <div className="w-5 h-5 rounded-full bg-blue-100 shrink-0 flex items-center justify-center text-blue-700 font-bold text-[6px] uppercase border border-blue-200">
            {agent.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[7px] font-bold text-slate-900 truncate leading-tight">{agent.name}</p>
          </div>
          <div className="text-right">
            <p className="text-[7px] font-black text-emerald-600 leading-none">{agent.resolved}</p>
            <p className="text-[4px] text-slate-400 font-black uppercase tracking-tighter">Solved</p>
          </div>
          <div className="text-right ml-1 border-l border-slate-100 pl-1">
            <p className="text-[7px] font-black text-rose-500 leading-none">{agent.open}</p>
            <p className="text-[4px] text-slate-400 font-black uppercase tracking-tighter">Open</p>
          </div>
        </div>
      ))}
    </div>
  );
}

import { HyperVCluster, HyperVVM } from "../types";
import { Server, Database, HardDrive, Cpu, Layers } from "lucide-react";

export function HyperVInfrastructureMatrix({ clusters }: { clusters: HyperVCluster[] }) {
  if (!clusters || clusters.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 h-full">
      {clusters.map((cluster) => {
        const memPercent = (cluster.usedMemoryGB / cluster.totalMemoryGB) * 100;
        const storagePercent = (cluster.usedStorageTB / cluster.totalStorageTB) * 100;

        return (
          <div key={cluster.id} className="bg-white/40 rounded-lg border border-blue-100/30 p-1.5 flex flex-col gap-1.5 min-h-0 overflow-hidden">
            <div className="flex justify-between items-center border-b border-blue-100/30 pb-1">
              <div className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-blue-600" />
                <span className="text-[8px] font-black text-blue-900 uppercase tracking-tight">{cluster.name}</span>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1">
                  <Cpu className="w-2 h-2 text-slate-400" />
                  <span className="text-[7px] font-black text-blue-600">{cluster.cpuUsage}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <HardDrive className="w-2 h-2 text-slate-400" />
                  <span className="text-[7px] font-black text-emerald-600">{storagePercent.toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {cluster.nodes.map((node) => (
                <div key={node.id} className="bg-white/60 rounded p-1 border border-blue-50/50">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1">
                      <Server className="w-2 h-2 text-slate-500" />
                      <span className="text-[6px] font-bold text-slate-700 truncate max-w-[50px]">{node.name}</span>
                    </div>
                    <div className={cn("w-1 h-1 rounded-full", node.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500')} />
                  </div>
                  
                  {/* VM Matrix Grid */}
                  <div className="grid grid-cols-6 gap-0.5 mt-1">
                    {node.vms.map((vm) => (
                      <div 
                        key={vm.id} 
                        title={`${vm.name} - ${vm.status}`}
                        className={cn(
                          "w-1.5 h-1.5 rounded-[1px] transition-all",
                          vm.status === "running" ? "bg-blue-500" :
                          vm.status === "paused" ? "bg-amber-400" : "bg-slate-200"
                        )}
                      />
                    ))}
                    {/* Fillers to keep grid shape if needed */}
                  </div>
                  <div className="mt-1 flex justify-between items-center">
                    <span className="text-[5px] font-black text-slate-400 uppercase tracking-tighter">{node.vmCount} VMs</span>
                    <span className="text-[5px] font-black text-blue-600 uppercase tracking-tighter">{node.memoryUsage}% RAM</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-auto pt-1 flex gap-2">
              <div className="flex-1">
                <div className="h-0.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: `${memPercent}%` }} />
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[4px] font-black text-slate-400 uppercase">Memory</span>
                  <span className="text-[4px] font-black text-blue-600 uppercase">{cluster.usedMemoryGB}GB / {cluster.totalMemoryGB}GB</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
