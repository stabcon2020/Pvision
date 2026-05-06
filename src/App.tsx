/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area 
} from "recharts";
import { motion } from "motion/react";
import { 
  LayoutDashboard, Server, Ticket, CheckCircle, AlertCircle, Timer,
  RefreshCw, Settings, Search, Bell, Map, Share2, Activity, Globe, Building2,
  Cloud, Sun, CloudRain, Wind, Thermometer, Calendar, Clock,
  CloudLightning, CloudFog, CloudSun, CloudMoon, Moon
} from "lucide-react";
import { Site, FreshserviceAnalytics, monitoring_stream, WatchdogService } from "./types";
import { SiteStatusGrid, AnalyticsCard, AgentPerformanceList, VideoMonitoring } from "./components/Dashboard";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface WeatherData {
  temp: number;
  apparent_temp: number;
  press: number;
  rel_hum: number;
  wind_spd_kmh: number;
  wind_dir: string;
  local_date_time: string;
  name: string;
  weather?: string;
}

export default function App() {
  const [sites, setSites] = useState<Site[]>([]);
  const [analytics, setAnalytics] = useState<FreshserviceAnalytics | null>(null);
  const [streams, setStreams] = useState<monitoring_stream[]>([]);
  const [watchdogs, setWatchdogs] = useState<WatchdogService[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [oooStatus, setOooStatus] = useState<any>(null);
  const [calendar, setCalendar] = useState<any>(null);
  const [politas, setPolitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [sitesRes, analyticsRes, streamsRes, watchdogRes, weatherRes, oooRes, calRes, politasRes] = await Promise.all([
        axios.get("/api/sites"),
        axios.get("/api/freshservice/analytics"),
        axios.get("/api/streams"),
        axios.get("/api/watchdog"),
        axios.get("/api/weather"),
        axios.get("/api/exchange/ooo"),
        axios.get("/api/exchange/calendar"),
        axios.get("/api/politas")
      ]);
      setSites(sitesRes.data);
      setAnalytics(analyticsRes.data);
      setStreams(streamsRes.data);
      setWatchdogs(watchdogRes.data);
      setWeather(weatherRes.data);
      setOooStatus(oooRes.data);
      setCalendar(calRes.data);
      setPolitas(politasRes.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError(`CONNECTION ERROR: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 5000);
    return () => clearInterval(interval);
  }, []);

  if (error && sites.length === 0) {
    return (
      <div className="h-screen bg-rose-950 text-white flex items-center justify-center p-8">
        <div className="max-w-md w-full border border-rose-500/50 p-6 rounded-2xl bg-black/40 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4 text-rose-500">
            <AlertCircle className="w-8 h-8" />
            <h1 className="text-2xl font-black italic tracking-tighter">SYSTEM CRASH</h1>
          </div>
          <p className="text-xs font-mono text-rose-200/70 mb-6 leading-relaxed">
            {error}
            <br /><br />
            Please check network connectivity or backend status.
          </p>
          <button 
            onClick={() => fetchData(true)}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 rounded-xl font-bold tracking-widest text-[10px] uppercase transition-all"
          >
            Force Reconnect
          </button>
        </div>
      </div>
    );
  }

  if (loading && sites.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-blue-900 text-white font-black">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <RefreshCw className="animate-spin w-12 h-12 text-blue-400" />
            <Building2 className="absolute inset-0 m-auto w-5 h-5 text-white" />
          </div>
          <div className="text-center">
            <p className="text-xl tracking-tighter">INITIALIZING PARLVISION</p>
            <p className="text-[10px] text-blue-400 uppercase tracking-widest mt-1">Connecting to gateway matrix...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#f0f4f8] text-slate-950 font-sans overflow-hidden flex flex-col text-[12px]">
      <header className="bg-white border-b border-blue-100 py-2 px-4 flex justify-between items-center shrink-0 h-14">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center shadow-md">
            <Building2 className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black mb-0 tracking-tighter text-blue-900 leading-none">ParlVision</h1>
            <p className="text-[8px] text-blue-700 font-bold uppercase tracking-widest mt-0.5 opacity-70">Tasmanian Parliament // Live Monitor</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {weather && (
            <div className="flex items-center gap-3 px-3 py-1.5 bg-blue-50/50 rounded-lg border border-blue-100/50">
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black text-blue-900">{weather.temp}°C</span>
                <span className="text-[7px] text-blue-400 font-bold uppercase tracking-tighter">Hobart</span>
              </div>
              <div className="w-px h-5 bg-blue-100/50" />
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                <div className="flex items-center gap-1">
                  <Wind className="w-2.5 h-2.5 text-blue-400" />
                  <span className="text-[7px] font-bold text-slate-500 uppercase">{weather.wind_spd_kmh}km/h {weather.wind_dir}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="w-2.5 h-2.5 text-blue-400" />
                  <span className="text-[7px] font-bold text-slate-500 uppercase">{weather.rel_hum}% HUM</span>
                </div>
              </div>
              <div className="text-blue-500">
                {(() => {
                  const condition = (weather.weather || "").toLowerCase();
                  if (condition.includes("rain") || condition.includes("shower")) return <CloudRain className="w-4 h-4 fill-current opacity-70" />;
                  if (condition.includes("storm") || condition.includes("thunder")) return <CloudLightning className="w-4 h-4 fill-current opacity-70" />;
                  if (condition.includes("fog") || condition.includes("mist")) return <CloudFog className="w-4 h-4 fill-current opacity-70" />;
                  if (condition.includes("partly") || condition.includes("mostly")) return <CloudSun className="w-4 h-4 fill-current opacity-70" />;
                  if (condition.includes("cloud")) return <Cloud className="w-4 h-4 fill-current opacity-70" />;
                  if (condition.includes("fine") || condition.includes("clear") || condition.includes("sunny")) return <Sun className="w-4 h-4 fill-current opacity-70" />;
                  
                  // Fallback based on typical BOM observation names or temp
                  return weather.temp > 22 ? <Sun className="w-4 h-4 fill-current opacity-70" /> : <Cloud className="w-4 h-4 fill-current opacity-70" />;
                })()}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end mr-2">
              <div className="flex items-center gap-1.5 text-[8px] font-bold text-blue-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                ACTIVE
              </div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">SYNC: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
            </div>
            
            <button 
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className={`p-1.5 bg-blue-50 hover:bg-blue-100 rounded-md transition-all border border-blue-100 text-blue-600 ${refreshing ? 'animate-spin opacity-50' : ''}`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-2 flex flex-col gap-2 min-h-0 overflow-hidden">
        {/* Connectivity Matrix - Scalable Middle Section */}
        <div className="flex-1 min-h-0 flex flex-col gap-1">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-[8px] font-black uppercase tracking-[0.1em] text-blue-800/50 leading-none">Electorate Office Gateways</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                <span className="text-[6px] font-bold text-slate-400 uppercase">ONLINE</span>
              </div>
              <div className="flex items-center gap-1 text-rose-500">
                <Activity className="w-2.5 h-2.5 animate-pulse" />
                <span className="text-[6px] font-bold uppercase">ALERTS</span>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-white/50 rounded-lg p-2 border border-blue-100/50 overflow-y-auto hide-scrollbar">
            <SiteStatusGrid sites={sites} />
          </div>
        </div>

        {/* 3x2 Dashboard Grid - Fixed Height to prevent footer clipping on TV */}
        <div className="grid grid-cols-3 grid-rows-2 gap-1.5 h-[320px] shrink-0 min-h-0">
          {/* Row 1 */}
          <div className="bg-white/40 rounded-lg border border-blue-100/30 p-1.5 flex flex-col min-h-0 overflow-hidden shadow-sm">
            <h2 className="text-[7px] font-black uppercase tracking-[0.1em] text-blue-800/50 leading-none mb-1 text-center">WEB STREAM</h2>
            <div className="flex-1 min-h-0 rounded overflow-hidden">
              <VideoMonitoring streams={streams} />
            </div>
          </div>

          <div className="bg-white/40 rounded-lg border border-blue-100/30 p-1.5 flex flex-col min-h-0 overflow-hidden text-center shadow-sm">
            <h2 className="text-[7px] font-black uppercase tracking-[0.1em] text-blue-800/50 leading-none mb-1">TICKETS</h2>
            <div className="grid grid-cols-1 gap-1 flex-1 p-0.5">
              <AnalyticsCard title="Open" value={analytics?.summary?.open || 0} icon={Ticket} colorClass="text-blue-600" />
              <AnalyticsCard title="Pend" value={analytics?.summary?.pending || 0} icon={Timer} colorClass="text-amber-600" />
              <AnalyticsCard title="Res" value={analytics?.summary?.resolved || 0} icon={CheckCircle} colorClass="text-emerald-500" />
            </div>
          </div>

          <div className="bg-white/40 rounded-lg border border-blue-100/30 p-1.5 flex flex-col min-h-0 overflow-hidden shadow-sm">
            <h2 className="text-[7px] font-black uppercase tracking-[0.1em] text-blue-800/50 leading-none mb-1 text-center">TICKET LEADERBOARD</h2>
            <div className="flex-1 overflow-y-auto hide-scrollbar bg-white/30 rounded p-1">
              <AgentPerformanceList agents={analytics?.agents} />
            </div>
          </div>

          {/* Row 2 */}
          <div className="bg-white/40 rounded-lg border border-blue-100/30 p-1.5 flex flex-col min-h-0 overflow-hidden shadow-sm">
             <h2 className="text-[7px] font-black uppercase tracking-[0.1em] text-blue-800/50 leading-none mb-1 text-center">OUT OF OFFICE</h2>
             <div className="flex-1 overflow-y-auto hide-scrollbar grid grid-cols-2 gap-1 p-0.5 content-start">
               {oooStatus?.users?.filter((u: any) => u.status === "Out of Office").slice(0, 8).map((user: any, idx: number) => (
                 <div key={idx} className="bg-amber-50/50 border border-amber-100 p-1 rounded text-[6px] font-bold text-amber-900 flex justify-between items-center gap-1 uppercase">
                   <span className="truncate">{user.name}</span>
                   {user.returnDate && (
                     <span className="text-[4.5px] opacity-60 whitespace-nowrap">
                       RET: {new Date(user.returnDate).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                     </span>
                   )}
                 </div>
               ))}
             </div>
          </div>

          <div className="bg-white/40 rounded-lg border border-blue-100/30 p-1.5 flex flex-col min-h-0 overflow-hidden shadow-sm">
             <h2 className="text-[7px] font-black uppercase tracking-[0.1em] text-blue-800/50 leading-none mb-1 text-center">WHAT'S ON TODAY</h2>
             <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-1 p-0.5">
               {calendar?.events?.slice(0, 4).map((event: any, idx: number) => (
                 <div key={idx} className="bg-blue-50/50 border border-blue-100 p-1 rounded text-[6px] font-bold text-blue-900 truncate uppercase">
                    {event.subject}
                 </div>
               ))}
             </div>
          </div>

          <div className="bg-white/40 rounded-lg border border-blue-100/30 p-1.5 flex flex-col min-h-0 overflow-hidden shadow-sm">
             <h2 className="text-[7px] font-black uppercase tracking-[0.1em] text-blue-800/50 leading-none mb-1 text-center">WATCHDOG</h2>
             <div className="flex-1 overflow-y-auto hide-scrollbar grid grid-cols-2 gap-1 p-0.5 content-start">
               {watchdogs?.map((service, idx) => {
                 const isStale = service.lastUpdate 
                   ? (new Date().getTime() - new Date(service.lastUpdate).getTime()) > 5 * 60 * 1000 
                   : false;
                 
                 return (
                   <div 
                     key={idx} 
                     className={cn(
                       "flex items-center gap-1 p-1 rounded border transition-colors",
                       isStale 
                         ? "bg-orange-50 border-orange-200 animate-pulse" 
                         : service.status === 'online' 
                           ? "bg-emerald-50 border-emerald-100" 
                           : "bg-rose-50 border-rose-100"
                     )}
                   >
                      <div className={cn(
                        "w-1 h-1 rounded-full",
                        isStale 
                          ? "bg-orange-500" 
                          : service.status === 'online' 
                            ? "bg-emerald-500" 
                            : "bg-rose-500 animate-pulse"
                      )} />
                      <span className={cn(
                        "text-[5px] font-black truncate uppercase",
                        isStale 
                          ? "text-orange-900" 
                          : service.status === 'online' 
                            ? "text-emerald-900" 
                            : "text-rose-900"
                      )}>
                        {service.name}
                      </span>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>
      </main>

      {/* #POLITAS Twitter-style Ticker */}
      <div className="h-6 bg-black border-t border-white/10 flex items-center overflow-hidden shrink-0 relative">
        <div className="absolute left-0 top-0 bottom-0 px-2 bg-black text-white flex items-center gap-1.5 z-10 shadow-[4px_0_10px_rgba(0,0,0,0.5)] border-r border-white/10">
          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-current" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
          <span className="text-[7px] font-black tracking-widest">#POLITAS</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <motion.div 
            className="flex items-center gap-16 whitespace-nowrap pl-[100px]"
            animate={{ x: ["0%", "-100%"] }}
            transition={{ 
              duration: 120, // Faster scroll but still readable
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {[...politas, ...politas].length > 0 ? (
              [...politas, ...politas].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[7px] font-black text-white">
                    {item.author}
                  </span>
                  <span className="text-[6px] font-medium text-gray-500">
                    {item.handle}
                  </span>
                  <span className="text-[7px] font-medium text-gray-100">
                    {item.title}
                  </span>
                  <span className="text-[5.5px] font-bold text-blue-400 opacity-80">
                    {item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-[7px] font-bold text-gray-500 uppercase tracking-wide">
                CONNECTING TO X.COM REAL-TIME FEED... FETCHING #POLITAS DATA...
              </span>
            )}
          </motion.div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 px-2 bg-black border-l border-white/10 text-[5px] font-black text-gray-400 flex items-center z-10 italic uppercase">
          Live Updates
        </div>
      </div>
    </div>
  );
}
