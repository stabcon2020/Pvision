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
import { 
  LayoutDashboard, Server, Ticket, CheckCircle, AlertCircle, Timer,
  RefreshCw, Settings, Search, Bell, Map, Share2, Activity, Globe, Building2,
  Cloud, Sun, CloudRain, Wind, Thermometer, Calendar, Clock
} from "lucide-react";
import { Site, FreshserviceAnalytics, monitoring_stream } from "./types";
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
}

export default function App() {
  const [sites, setSites] = useState<Site[]>([]);
  const [analytics, setAnalytics] = useState<FreshserviceAnalytics | null>(null);
  const [streams, setStreams] = useState<monitoring_stream[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [oooStatus, setOooStatus] = useState<any>(null);
  const [calendar, setCalendar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [sitesRes, analyticsRes, streamsRes, weatherRes, oooRes, calRes] = await Promise.all([
        axios.get("/api/sites"),
        axios.get("/api/freshservice/analytics"),
        axios.get("/api/streams"),
        axios.get("/api/weather"),
        axios.get("/api/exchange/ooo"),
        axios.get("/api/exchange/calendar")
      ]);
      setSites(sitesRes.data);
      setAnalytics(analyticsRes.data);
      setStreams(streamsRes.data);
      setWeather(weatherRes.data);
      setOooStatus(oooRes.data);
      setCalendar(calRes.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (error: any) {
      console.error("Fetch Error:", error);
      setError(`CONNECTION ERROR: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 5000); // Refresh every 5s
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
      {/* Header - Made more compact for low res */}
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
          {/* Hobart Weather Widget */}
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
                {weather.temp > 20 ? <Sun className="w-4 h-4 fill-current opacity-70" /> : <Cloud className="w-4 h-4 fill-current opacity-70" />}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
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

      {/* Main Kiosk Content Area */}
      <main className="flex-1 p-1 flex flex-col gap-1 min-h-0 overflow-hidden">
        {/* Connectivity Matrix - Full Width Top */}
        <div className="flex-1 min-h-0 flex flex-col gap-0.5">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-[7px] font-black uppercase tracking-[0.1em] text-blue-800/50 leading-none py-0.5">Connectivity Matrix</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                <span className="text-[6px] font-bold text-slate-400 uppercase">ONLINE</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[6px] font-bold text-slate-400 uppercase">OFFLINE</span>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-white/50 rounded-lg p-1.5 border border-blue-100/50 overflow-y-auto hide-scrollbar">
            <SiteStatusGrid sites={sites} />
          </div>
        </div>

        {/* Global Footer Grid - Always 5 Columns Side-by-Side */}
        <div className="grid grid-cols-5 gap-1 h-[180px] shrink-0 min-h-0">
          {/* Block 1: Video Streams */}
          <div className="bg-white/40 rounded-lg border border-blue-100/30 p-1 flex flex-col min-h-0 overflow-hidden">
            <h2 className="text-[7px] font-black uppercase tracking-[0.1em] text-blue-800/50 leading-none mb-1">AV Stream</h2>
            <div className="flex-1 min-h-0">
               <VideoMonitoring streams={streams} />
            </div>
          </div>

          {/* Block 2: ITSM Status */}
          <div className="bg-white/40 rounded-lg border border-blue-100/30 p-1 flex flex-col min-h-0 overflow-hidden">
            <h2 className="text-[7px] font-black uppercase tracking-[0.1em] text-blue-800/50 leading-none mb-1">ITSM</h2>
            <div className="grid grid-cols-2 gap-1 flex-1 px-0.5">
              <AnalyticsCard title="Open" value={analytics?.summary?.open || 0} icon={Ticket} colorClass="text-blue-600" />
              <AnalyticsCard title="Pend" value={analytics?.summary?.pending || 0} icon={Timer} colorClass="text-amber-600" />
              <AnalyticsCard title="Res" value={analytics?.summary?.resolved || 0} icon={CheckCircle} colorClass="text-blue-500" />
              <AnalyticsCard title="Total" value={analytics?.summary?.closed || 0} icon={AlertCircle} colorClass="text-slate-400" />
            </div>
          </div>

          {/* Block 3: Service Desk (Freshservice) */}
          <div className="bg-white/40 rounded-lg border border-blue-100/30 p-1 flex flex-col min-h-0 overflow-hidden">
            <h2 className="text-[7px] font-black uppercase tracking-[0.1em] text-blue-800/50 leading-none mb-1">Service Desk</h2>
            <div className="flex-1 overflow-y-auto hide-scrollbar bg-white/30 rounded p-0.5">
              <AgentPerformanceList agents={analytics?.agents} />
            </div>
          </div>

          {/* Block 4: Staff Presence (Exchange) */}
          <div className="bg-white/40 rounded-lg border border-blue-100/30 p-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-[7px] font-black uppercase tracking-[0.1em] text-blue-800/50 leading-none">Out of Office</h2>
              {oooStatus?.lastSync && (
                <div className="flex items-center gap-1">
                  {oooStatus.isSyncing && <RefreshCw className="w-2 h-2 text-amber-500 animate-spin" />}
                  <span className="text-[5px] font-bold text-slate-400 uppercase tracking-tighter">
                    Synced: {new Date(oooStatus.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
            <div className={cn(
              "flex-1 overflow-y-auto hide-scrollbar grid gap-x-1 gap-y-0.5 items-start content-start",
              oooStatus?.users?.filter((u: any) => u.status === "Out of Office" && u.returnDate).length > 20 ? "grid-cols-4" : 
              oooStatus?.users?.filter((u: any) => u.status === "Out of Office" && u.returnDate).length > 8 ? "grid-cols-3" : "grid-cols-2"
            )}>
              {oooStatus?.users ? (
                (() => {
                  const oooWithDate = oooStatus.users.filter((u: any) => u.status === "Out of Office" && u.returnDate);
                  if (oooWithDate.length === 0) {
                    return (
                      <div className="col-span-full flex-1 flex flex-col items-center justify-center gap-1 opacity-40 py-4">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-[6px] font-black uppercase text-slate-400">No Scheduled OOO</span>
                      </div>
                    );
                  }
                  return oooWithDate.map((user: any, idx: number) => {
                    const rDate = new Date(user.returnDate);
                    const isToday = rDate.toDateString() === new Date().toDateString();
                    const dateStr = isToday 
                      ? `Today @ ${rDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : rDate.toLocaleDateString([], { day: 'numeric', month: 'short' });
                    
                    return (
                      <div key={idx} className="flex flex-col px-1 py-0.5 rounded bg-amber-50/70 border border-amber-100/50 min-w-0">
                        <div className="flex items-center gap-1 min-w-0">
                          <div className="w-1 h-1 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                          <span className="text-[6px] font-bold text-amber-900 truncate leading-tight uppercase">{user.name}</span>
                        </div>
                        <span className="text-[5px] font-black text-amber-600 uppercase tracking-tighter mt-0.5 ml-1.5 opacity-80">
                          Till: {dateStr}
                        </span>
                      </div>
                    );
                  });
                })()
              ) : (
                <div className="col-span-full flex-1 flex items-center justify-center text-[7px] text-slate-400 font-bold uppercase italic py-4">Syncing...</div>
              )}
            </div>
          </div>

          {/* Block 5: Daily Agenda */}
          <div className="bg-white/40 rounded-lg border border-blue-100/30 p-1 flex flex-col min-h-0 overflow-hidden shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-[7px] font-black uppercase tracking-[0.1em] text-blue-800/50 leading-none">Daily Agenda</h2>
              <div className="flex items-center gap-1">
                <Calendar className="w-2 h-2 text-blue-400" />
                <span className="text-[5px] font-bold text-slate-400 uppercase tracking-tighter">Helpdesk Shared</span>
              </div>
            </div>
            <div className={cn(
              "flex-1 overflow-y-auto hide-scrollbar grid gap-x-1 gap-y-0.5 items-start content-start",
              calendar?.events?.length > 7 ? "grid-cols-3" : 
              calendar?.events?.length > 3 ? "grid-cols-2" : "grid-cols-1"
            )}>
              {calendar?.events?.length > 0 ? (
                calendar.events.map((event: any, idx: number) => {
                  const startTime = new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                  return (
                    <div key={idx} className="flex gap-1 p-1 rounded bg-blue-50/40 border border-blue-100/30 min-w-0">
                      <div className="flex flex-col items-center justify-center min-w-[20px] border-r border-blue-100/50 pr-1 shrink-0">
                        <Clock className="w-1.5 h-1.5 text-blue-400 mb-0.5" />
                        <span className="text-[5.5px] font-black text-blue-800 leading-none">{startTime}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[6px] font-bold text-slate-800 truncate leading-tight uppercase">{event.subject}</p>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <Map className="w-1 h-1 text-slate-400 shrink-0" />
                          <span className="text-[4.5px] font-bold text-slate-400 uppercase truncate leading-none">{event.location}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30 gap-1 mt-4">
                  <Calendar className="w-4 h-4 text-slate-300" />
                  <span className="text-[6px] font-black uppercase text-slate-400">No Events Scheduled</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
