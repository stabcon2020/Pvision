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
    } catch (error) {
      console.error("Fetch Error:", error);
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
      <main className="flex-1 p-1 grid grid-cols-1 lg:grid-cols-5 gap-1 min-h-0 overflow-hidden">
        {/* Gateway Matrix - Occupies 3 columns */}
        <div className="lg:col-span-3 flex flex-col min-h-0 overflow-hidden gap-1">
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
          
          <div className="flex-1 bg-white/50 rounded-lg p-1 border border-blue-100/50 overflow-y-auto hide-scrollbar">
            <SiteStatusGrid sites={sites} />
          </div>

          {/* Video Monitoring Section */}
          <div className="flex flex-col gap-1 shrink-0">
            <h2 className="text-[7px] font-black uppercase tracking-[0.1em] text-blue-800/50 leading-none py-0.5">AV Monitoring</h2>
            <div className="bg-white/50 rounded-lg p-1 border border-blue-100/50 shadow-sm shrink-0">
               <VideoMonitoring streams={streams} />
            </div>
          </div>
        </div>

        {/* Sidebar Status - Column 4 & 5 */}
        <div className="lg:col-span-2 flex flex-col gap-1 overflow-hidden">
          {/* ITSM Section */}
          <div className="space-y-1 shrink-0">
            <h2 className="text-[7px] font-black uppercase tracking-[0.1em] text-blue-800/50 leading-none py-0.5">ITSM Status</h2>
            <div className="grid grid-cols-2 gap-1">
              <AnalyticsCard title="Open" value={analytics?.summary?.open || 0} icon={Ticket} colorClass="text-blue-600" />
              <AnalyticsCard title="Pending" value={analytics?.summary?.pending || 0} icon={Timer} colorClass="text-amber-600" />
              <AnalyticsCard title="Resolved" value={analytics?.summary?.resolved || 0} icon={CheckCircle} colorClass="text-blue-500" />
              <AnalyticsCard title="Closed" value={analytics?.summary?.closed || 0} icon={AlertCircle} colorClass="text-slate-400" />
            </div>
          </div>

          {/* Agent Section */}
          <div className="flex flex-col gap-1 flex-1 min-h-0">
            <h2 className="text-[7px] font-black uppercase tracking-[0.1em] text-blue-800/50 leading-none py-0.5">Service Desk</h2>
            <div className="flex-1 overflow-y-auto hide-scrollbar bg-white/30 rounded-lg p-0.5">
              <AgentPerformanceList agents={analytics?.agents} />
            </div>
          </div>

          <div className="bg-blue-900 rounded-lg p-2 text-white shadow-lg shrink-0">
            <div className="flex justify-between items-center mb-0.5">
              <p className="text-[6px] font-black opacity-60 uppercase">Network Summary</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black tracking-tighter leading-none">{sites.filter(s => s.status === 'online').length}</span>
              <span className="text-blue-400 text-[8px] font-bold">/ {sites.length} ONLINE</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
