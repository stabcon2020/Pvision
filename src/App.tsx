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
  RefreshCw, Settings, Search, Bell, Map, Share2, Activity, Globe, Building2
} from "lucide-react";
import { Site, FreshserviceAnalytics, monitoring_stream } from "./types";
import { SiteStatusGrid, AnalyticsCard, AgentPerformanceList, VideoMonitoring } from "./components/Dashboard";

export default function App() {
  const [sites, setSites] = useState<Site[]>([]);
  const [analytics, setAnalytics] = useState<FreshserviceAnalytics | null>(null);
  const [streams, setStreams] = useState<monitoring_stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [sitesRes, analyticsRes, streamsRes] = await Promise.all([
        axios.get("/api/sites"),
        axios.get("/api/freshservice/analytics"),
        axios.get("/api/streams")
      ]);
      setSites(sitesRes.data);
      setAnalytics(analyticsRes.data);
      setStreams(streamsRes.data);
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
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 text-[8px] font-bold text-blue-600">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
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
                <div className="w-1 h-1 rounded-full bg-blue-500" />
                <span className="text-[6px] font-bold text-slate-400 uppercase">ON</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[6px] font-bold text-slate-400 uppercase">OFF</span>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-white/50 rounded-lg p-1.5 border border-blue-100/50 overflow-y-auto hide-scrollbar">
            <SiteStatusGrid sites={sites} />
          </div>
        </div>

        {/* Global Footer Grid - 4 Blocks Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-1.5 h-[160px] shrink-0">
          {/* Block 1: Video Streams */}
          <div className="bg-white/40 rounded-lg border border-blue-100/30 p-1 flex flex-col min-h-0">
            <h2 className="text-[7px] font-black uppercase tracking-[0.1em] text-blue-800/50 leading-none mb-1">AV Monitoring</h2>
            <div className="flex-1 min-h-0">
               <VideoMonitoring streams={streams} />
            </div>
          </div>

          {/* Block 2: ITSM Status */}
          <div className="bg-white/40 rounded-lg border border-blue-100/30 p-1 flex flex-col min-h-0">
            <h2 className="text-[7px] font-black uppercase tracking-[0.1em] text-blue-800/50 leading-none mb-1">ITSM Status</h2>
            <div className="grid grid-cols-2 gap-1 flex-1 overflow-y-auto hide-scrollbar px-0.5">
              <AnalyticsCard title="Open" value={analytics?.summary?.open || 0} icon={Ticket} colorClass="text-blue-600" />
              <AnalyticsCard title="Pending" value={analytics?.summary?.pending || 0} icon={Timer} colorClass="text-amber-600" />
              <AnalyticsCard title="Resolved" value={analytics?.summary?.resolved || 0} icon={CheckCircle} colorClass="text-blue-500" />
              <AnalyticsCard title="Closed" value={analytics?.summary?.closed || 0} icon={AlertCircle} colorClass="text-slate-400" />
            </div>
          </div>

          {/* Block 3: Service Desk */}
          <div className="bg-white/40 rounded-lg border border-blue-100/30 p-1 flex flex-col min-h-0">
            <h2 className="text-[7px] font-black uppercase tracking-[0.1em] text-blue-800/50 leading-none mb-1">Service Desk</h2>
            <div className="flex-1 overflow-y-auto hide-scrollbar bg-white/30 rounded p-0.5">
              <AgentPerformanceList agents={analytics?.agents} />
            </div>
          </div>

          <div className="bg-blue-900 rounded-lg p-3 text-white shadow-lg flex flex-col justify-center">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[6px] font-black opacity-60 uppercase">Network Summary</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black tracking-tighter leading-none">{sites?.filter(s => s.status === 'online').length || 0}</span>
              <span className="text-blue-400 text-[10px] font-bold">/ {sites?.length || 0} ONLINE</span>
            </div>
            <p className="text-[6px] text-blue-300 font-bold uppercase tracking-widest mt-1">Operational Nodes</p>
          </div>
        </div>
      </main>
    </div>
  );
}
