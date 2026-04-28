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
import { Site, FreshserviceAnalytics } from "./types";
import { SiteStatusGrid, AnalyticsCard, AgentPerformanceList } from "./components/Dashboard";

export default function App() {
  const [sites, setSites] = useState<Site[]>([]);
  const [analytics, setAnalytics] = useState<FreshserviceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    try {
      const [sitesRes, analyticsRes] = await Promise.all([
        axios.get("/api/sites"),
        axios.get("/api/freshservice/analytics")
      ]);
      setSites(sitesRes.data);
      setAnalytics(analyticsRes.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen bg-[#f0f4f8] text-slate-950 font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-blue-100 py-3 px-8 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
            <Building2 className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black mb-0 tracking-tighter text-blue-900 leading-none">ParlVision</h1>
            <p className="text-[10px] text-blue-700 font-bold uppercase tracking-widest mt-1 opacity-70">Parliament of Tasmania // Live Monitor</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              SYSTEM ACTIVE
            </div>
            <p className="text-[10px] font-bold text-slate-400">SYNC: {lastUpdated.toLocaleTimeString()}</p>
          </div>
          <button className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all border border-slate-200 text-slate-400">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Kiosk Content Area */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0 overflow-hidden">
        {/* Gateway Matrix - Occupies first 3 columns, more space for 36 sites */}
        <div className="lg:col-span-3 flex flex-col min-h-0 overflow-hidden gap-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-800/50">Gateway Connectivity Matrix</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[8px] font-bold text-slate-400 uppercase">ONLINE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[8px] font-bold text-slate-400 uppercase">FAULT</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 bg-blue-50/20 rounded-2xl p-4 border border-blue-100 overflow-y-auto hide-scrollbar">
            <SiteStatusGrid sites={sites} />
          </div>

          {/* Activity Trend Chart moved here to fill bottom of wide area */}
          <div className="h-[140px] bg-white rounded-2xl border border-blue-100 p-3 shadow-sm shrink-0">
            <div className="flex justify-between items-center mb-2 px-2">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Global Network Traffic // 7-Day Trend</p>
              <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Live Telemetry</span>
            </div>
            <div className="h-[90px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.trends}>
                  <defs>
                    <linearGradient id="colorParlBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="tickets" 
                    stroke="#2563eb" 
                    fillOpacity={1} 
                    fill="url(#colorParlBlue)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar Status - Column 4 */}
        <div className="lg:col-span-1 flex flex-col gap-5 overflow-hidden">
          {/* ITSM Section - 2x2 Grid for better space utility */}
          <div className="space-y-3 shrink-0">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-800/50">ITSM Status</h2>
            <div className="grid grid-cols-2 gap-2">
              <AnalyticsCard title="Open" value={analytics?.summary.open || 0} icon={Ticket} colorClass="text-blue-600" />
              <AnalyticsCard title="Pending" value={analytics?.summary.pending || 0} icon={Timer} colorClass="text-amber-600" />
              <AnalyticsCard title="Resolved" value={analytics?.summary.resolved || 0} icon={CheckCircle} colorClass="text-blue-500" />
              <AnalyticsCard title="Closed" value={analytics?.summary.closed || 0} icon={AlertCircle} colorClass="text-slate-400" />
            </div>
          </div>

          {/* Agent Section */}
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-800/50">Active Agents</h2>
            <div className="flex-1 overflow-y-auto hide-scrollbar">
              <AgentPerformanceList agents={analytics?.agents} />
            </div>
          </div>

          <div className="bg-blue-900 rounded-2xl p-4 text-white shadow-xl shadow-blue-200/50 shrink-0">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[8px] font-black opacity-60 uppercase">Node Health</p>
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-blue-400" />
                <div className="w-1 h-1 rounded-full bg-blue-400" />
                <div className="w-1 h-1 rounded-full bg-blue-400/20" />
              </div>
            </div>
            <p className="text-lg font-black tracking-tighter">
              {sites.filter(s => s.status === 'online').length}<span className="text-blue-400 text-xs">/{sites.length}</span>
            </p>
            <p className="text-[8px] font-bold text-blue-300 uppercase tracking-widest mt-1">Operational Nodes</p>
          </div>
        </div>
      </main>
    </div>
  );
}
