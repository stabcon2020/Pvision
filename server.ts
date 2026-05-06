import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import ping from "ping";
import net from "net";

dotenv.config();

// Watchdog Configuration
const DEFAULT_WATCHDOG_SERVICES = [
  { name: "DHCP Server", host: "172.18.166.1", port: 67 },
  { name: "Active Directory", host: "172.18.167.1", port: 389 },
  { name: "Proxy Gateway", host: "172.18.173.1", port: 8080 },
  { name: "Print Server", host: "172.18.167.241", port: 9100 },
  { name: "File Share", host: "172.18.166.241", port: 445 },
  { name: "App DB", host: "172.18.166.97", port: 1433 },
];

let WATCHDOG_CONFIG = DEFAULT_WATCHDOG_SERVICES;
try {
  if (process.env.WATCHDOG_CONFIG) {
    WATCHDOG_CONFIG = JSON.parse(process.env.WATCHDOG_CONFIG);
  }
} catch (e) {
  console.error("Error parsing WATCHDOG_CONFIG from .env:", e);
}

// TCP Port Checker Function
function checkService(host: string, port: number, timeoutMs = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = false;

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      status = true;
      socket.destroy();
    });

    socket.on('timeout', () => {
      socket.destroy();
    });

    socket.on('error', () => {
      socket.destroy();
    });

    socket.on('close', () => {
      resolve(status);
    });

    socket.connect(port, host);
  });
}

// Video Streams Configuration (HLS .m3u8)
const DEFAULT_STREAMS = [
  { name: "House of Assembly", url: "https://5ea8aa5cf299b.streamlock.net/HA/house_source/playlist.m3u8" },
  { name: "Legislative Council", url: "https://5ea8aa5cf299b.streamlock.net/LC/legco_source/playlist.m3u8" },
  { name: "Committee Room 1", url: "https://5ea8aa5cf299b.streamlock.net/HACOM/hacom/playlist.m3u8" },
  { name: "Committee Room 2", url: "https://5ea8aa5cf299b.streamlock.net/LCCOM/lccom/playlist.m3u8" },
];

let STREAMS_CONFIG = DEFAULT_STREAMS;
try {
  if (process.env.STREAMS_CONFIG) {
    STREAMS_CONFIG = JSON.parse(process.env.STREAMS_CONFIG);
  }
} catch (e) {
  console.error("Error parsing STREAMS_CONFIG from .env:", e);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Parse SITE_CONFIG from environment or use defaults
  const DEFAULT_SITES: any[] = [
    { name: "Derwent", url: "172.18.166.241", location: "South" },
    { name: "Elwick", url: "172.18.167.1", location: "South" },
    { name: "Hobart", url: "172.18.173.1", location: "South" },
    { name: "Huon", url: "172.18.166.97", location: "South" },
    { name: "Launceston", url: "172.18.173.177", location: "South" },
    { name: "McIntyre", url: "172.18.167.209", location: "South" },
    { name: "Mersey", url: "172.18.167.241", location: "South" },
    { name: "Montgomery", url: "172.18.167.225", location: "South" },
    { name: "Murchison", url: "172.18.167.97", location: "South" },
    { name: "Nelson", url: "172.18.173.49", location: "South" },
    { name: "Pembroke", url: "172.18.167.177", location: "South" },
    { name: "Prosser", url: "172.18.166.225", location: "South" },
    { name: "Rosevears", url: "172.18.173.129", location: "South" },
    { name: "Rumney", url: "172.18.167.145", location: "South" },
    { name: "Windermere", url: "172.18.173.193", location: "South" },
    { name: "Greens - Hobart", url: "172.18.174.97", location: "South" },
    { name: "Greens - Launceston", url: "172.18.173.241", location: "South" },
    { name: "Greens - Sorell", url: "172.18.174.33", location: "South" },
    { name: "Ind - North Hobart", url: "172.18.174.65", location: "South" },
    { name: "Ind - Glenorchy", url: "172.18.167.193", location: "South" },
    { name: "Ind - Kingston", url: "172.18.174.129", location: "South" },
    { name: "Ind - Launceston", url: "172.18.173.145", location: "South" },
    { name: "Ind - Midway Point", url: "172.18.173.161", location: "South" },
    { name: "Ind - Rosny", url: "172.18.166.1", location: "South" },
    { name: "Ind - Wynyard", url: "172.18.174.1", location: "South" },
    { name: "Labor - Burnie", url: "172.18.167.129", location: "South" },
    { name: "Labor - Devonport", url: "172.18.167.65", location: "South" },
    { name: "Labor - Invermay", url: "172.18.174.81", location: "South" },
    { name: "Labor - Kingston", url: "172.18.173.1", location: "South" },
    { name: "Labor - Launceston", url: "172.18.167.49", location: "South" },
    { name: "Labor - Rosny Park", url: "172.18.173.225", location: "South" },
    { name: "Labor - Sorell", url: "172.18.166.129", location: "South" },
    { name: "Labor - Bridgewater", url: "172.18.167.81", location: "South" },
    { name: "Labor - Glenorchy", url: "172.18.174.49", location: "South" },
    { name: "Labor - Hobart", url: "172.18.173.17", location: "South" },
    { name: "Liberal - Rosny", url: "172.18.174.145", location: "South" },
  ];

  let SITE_CONFIG = DEFAULT_SITES;
  try {
    if (process.env.SITE_CONFIG) {
      SITE_CONFIG = JSON.parse(process.env.SITE_CONFIG);
    }
  } catch (e) {
    console.error("Error parsing SITE_CONFIG from .env:", e);
  }

  // Helper to ensure we have a full grid of 36 for the kiosk display
  const getSites = () => {
    return SITE_CONFIG.map((s, i) => ({
      ...s,
      id: `gw-${i}`
    }));
  };

  app.get("/api/sites", async (req, res) => {
    const sites = getSites();
    const siteStatuses = await Promise.all(
      sites.map(async (site) => {
        try {
          // Extract host from URL if it's a full URL, otherwise use as is
          let host = site.url;
          if (host.startsWith("http")) {
            try {
              host = new URL(host).hostname;
            } catch (e) {
              // fallback to original if URL parsing fails
            }
          }

          const res = await ping.promise.probe(host, {
            timeout: 2, // 2 seconds
            extra: ["-c", "1"] // send only 1 packet
          });

          const latency = typeof res.time === "number" ? res.time : (typeof res.time === "string" && res.time !== "unknown" ? parseFloat(res.time) : null);

          return { 
            ...site, 
            status: res.alive ? "online" : "offline", 
            latency: latency || null
          };
        } catch (error) {
          return { ...site, status: "offline", latency: null };
        }
      })
    );
    res.json(siteStatuses);
  });

  // Freshservice API Proxy
  app.get("/api/freshservice/analytics", async (req, res) => {
    const { FRESHSERVICE_DOMAIN, FRESHSERVICE_API_KEY } = process.env;

    if (!FRESHSERVICE_DOMAIN || !FRESHSERVICE_API_KEY) {
      // Mock data if credentials are missing
      return res.json({
        mock: true,
        summary: {
          open: 28,
          pending: 14,
          resolved: 42,
          closed: 35,
          overdue: 5,
          avg_response_time: "2.4h"
        },
        agents: [
          { id: "a1", name: "Sarah Connor", resolved: 12, open: 3, avatar: "SC" },
          { id: "a2", name: "John Doe", resolved: 8, open: 5, avatar: "JD" },
          { id: "a3", name: "Ellen Ripley", resolved: 15, open: 2, avatar: "ER" },
          { id: "a4", name: "Arthur Dent", resolved: 4, open: 8, avatar: "AD" },
        ],
        trends: [
          { name: "Mon", tickets: 12 },
          { name: "Tue", tickets: 19 },
          { name: "Wed", tickets: 15 },
          { name: "Thu", tickets: 22 },
          { name: "Fri", tickets: 30 },
          { name: "Sat", tickets: 5 },
          { name: "Sun", tickets: 8 },
        ]
      });
    }

    try {
      const authHeader = `Basic ${Buffer.from(`${FRESHSERVICE_API_KEY}:X`).toString("base64")}`;
      const domain = FRESHSERVICE_DOMAIN.replace(/\/$/, "");
      
      // 1. Fetch Agents to map IDs to Names
      const agentsResponse = await axios.get(`https://${domain}/api/v2/agents?per_page=100`, {
        headers: { Authorization: authHeader }
      });
      const agentsList = agentsResponse.data.agents || [];
      const agentsNameMap: Record<string, string> = {};
      agentsList.forEach((a: any) => {
        agentsNameMap[a.id] = `${a.first_name || ""} ${a.last_name || ""}`.trim() || a.email;
      });

      // 2. Fetch specific counts for accuracy
      // Statuses: 2=Open, 3=Pending, 4=Resolved, 5=Closed
      const fetchCount = async (status: number) => {
        try {
          // Freshservice Filter API requires encoded query in quotes: ?query="status:2"
          const resp = await axios.get(`https://${domain}/api/v2/tickets/filter`, {
            params: { 
              query: `"status:${status}"`,
              per_page: 100 // Fetch up to 100 in the first page as fallback
            },
            headers: { Authorization: authHeader }
          });
          
          // Header x-search-results-count is the definitive count for filter API (up to 300)
          const headerCount = resp.headers["x-search-results-count"];
          if (headerCount) {
            return parseInt(headerCount.toString(), 10);
          }
          
          // Fallback if header is missing (e.g. if count > 300)
          const tokens = resp.data.tickets || [];
          return tokens.length;
        } catch (e: any) {
          console.error(`Error fetching count for status ${status}:`, e.message);
          return 0;
        }
      };

      const [countOpen, countPending, countResolved, countClosed] = await Promise.all([
        fetchCount(2), fetchCount(3), fetchCount(4), fetchCount(5)
      ]);

      // 3. Fetch recent tickets for trends and agent activity (last 100)
      const ticketsResponse = await axios.get(`https://${domain}/api/v2/tickets`, {
        params: {
          per_page: 100,
          order_by: "created_at",
          order_type: "desc"
        },
        headers: { Authorization: authHeader }
      });
      const recentTickets = ticketsResponse.data.tickets || [];
      
      // Aggregate summary
      const summary = {
        open: countOpen,
        pending: countPending,
        resolved: countResolved,
        closed: countClosed,
        overdue: recentTickets.filter((t: any) => t.is_overdue).length,
        avg_response_time: "---"
      };

      // Aggregate agents (Top 4 based on recent activity)
      const agentMap: Record<string, any> = {};
      recentTickets.forEach((t: any) => {
        if (!t.responder_id) return;
        const responderId = t.responder_id.toString();
        if (!agentMap[responderId]) {
          const name = agentsNameMap[responderId] || `Agent ${responderId}`;
          const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
          agentMap[responderId] = { id: responderId, name: name, resolved: 0, open: 0, avatar: initials || "A" };
        }
        if ([4, 5].includes(t.status)) agentMap[responderId].resolved++;
        else agentMap[responderId].open++;
      });

      const agents = Object.values(agentMap)
        .sort((a: any, b: any) => b.resolved - a.resolved)
        .slice(0, 4);

      // 4. Trends (from recent tickets)
      const dayCounts: Record<string, number> = { "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0 };
      const daysOrder = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      recentTickets.forEach((t: any) => {
        const d = new Date(t.created_at);
        dayCounts[daysOrder[d.getDay()]]++;
      });
      const trends = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => ({
        name: day,
        tickets: dayCounts[day]
      }));

      res.json({ mock: false, summary, agents, trends });
    } catch (error: any) {
      console.error("Freshservice API Error:", error.message);
      res.json({
        mock: true,
        error: error.message,
        summary: { open: 0, pending: 0, resolved: 0, closed: 0, overdue: 0, avg_response_time: "N/A" },
        agents: [],
        trends: []
      });
    }
  });
  
  app.get("/api/weather", async (req, res) => {
    try {
      // Hobart Observation JSON from BOM
      const response = await axios.get("http://www.bom.gov.au/fwo/IDT60901/IDT60901.94970.json", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });
      
      const data = response.data.observations.data[0];
      res.json({
        temp: data.air_temp,
        apparent_temp: data.apparent_t,
        press: data.press,
        rel_hum: data.rel_hum,
        wind_spd_kmh: data.wind_spd_kmh,
        wind_dir: data.wind_dir,
        local_date_time: data.local_date_time,
        name: "Hobart"
      });
    } catch (error: any) {
      console.error("Weather API Error:", error.message);
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  });

  // --- Exchange Online Background Sync ---
  const EXCHANGE_SYNC_INTERVAL = 120000; // 2 minutes (increased for 600 users)
  let oooCache: any = {
    users: [],
    lastSync: null,
    isSyncing: false,
    error: null,
    mock: false
  };

  let calendarCache: any = {
    events: [],
    lastSync: null,
    isSyncing: false,
    error: null,
    mock: false
  };

  async function syncExchange() {
    const { EXCHANGE_TENANT_ID, EXCHANGE_CLIENT_ID, EXCHANGE_CLIENT_SECRET, HELPDESK_CALENDAR_EMAIL } = process.env;
    if (!EXCHANGE_TENANT_ID || !EXCHANGE_CLIENT_ID || !EXCHANGE_CLIENT_SECRET) {
      oooCache = {
        mock: true,
        lastSync: new Date().toISOString(),
        users: [
          { name: "Support Manager", status: "Out of Office", returnDate: "2026-05-10T17:00:00", avatar: "SM" },
          { name: "Network Lead", status: "Available", returnDate: null, avatar: "NL" },
          { name: "Field Tech", status: "Out of Office", returnDate: "2026-05-04T16:30:00", avatar: "FT" },
          { name: "Systems Admin", status: "Available", returnDate: null, avatar: "SA" },
          { name: "Security Eng", status: "Out of Office", returnDate: "2026-05-06T09:00:00", avatar: "SE" },
          { name: "Project Lead", status: "Out of Office", returnDate: "2026-05-15T17:00:00", avatar: "PL" },
          { name: "Helpdesk Tier 2", status: "Available", returnDate: null, avatar: "H2" },
        ]
      };

      calendarCache = {
        mock: true,
        lastSync: new Date().toISOString(),
        events: [
          { subject: "Weekly Team Sync", start: "2026-05-04T09:00:00", end: "2026-05-04T10:00:00", location: "Teams", isAllDay: false },
          { subject: "Network Maintenance", start: "2026-05-04T11:00:00", end: "2026-05-04T13:00:00", location: "Datacenter", isAllDay: false },
          { subject: "Staff Lunch", start: "2026-05-04T13:00:00", end: "2026-05-04T14:00:00", location: "Breakroom", isAllDay: false },
          { subject: "Security Patching", start: "2026-05-04T15:00:00", end: "2026-05-04T17:00:00", location: "Remote", isAllDay: false },
        ]
      };
      return;
    }

    oooCache.isSyncing = true;
    calendarCache.isSyncing = true;
    try {
      // 1. Get Access Token
      const tokenResponse = await axios.post(
        `https://login.microsoftonline.com/${EXCHANGE_TENANT_ID}/oauth2/v2.0/token`,
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: EXCHANGE_CLIENT_ID,
          client_secret: EXCHANGE_CLIENT_SECRET,
          scope: "https://graph.microsoft.com/.default",
        }).toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      const accessToken = tokenResponse.data.access_token;

      // 2. Fetch Calendar Events (If email provided)
      if (HELPDESK_CALENDAR_EMAIL) {
        try {
          // Calculate Hobart "Today"
          const hobartStr = new Date().toLocaleString("en-US", {timeZone: "Australia/Hobart"});
          const hobartNow = new Date(hobartStr);
          
          const startOfDay = new Date(hobartNow.getFullYear(), hobartNow.getMonth(), hobartNow.getDate(), 0, 0, 0).toISOString();
          const endOfDay = new Date(hobartNow.getFullYear(), hobartNow.getMonth(), hobartNow.getDate(), 23, 59, 59).toISOString();
          
          const calendarResponse = await axios.get(
            `https://graph.microsoft.com/v1.0/users/${HELPDESK_CALENDAR_EMAIL}/calendarView?startDateTime=${startOfDay}&endDateTime=${endOfDay}&$select=subject,start,end,location,isAllDay&$orderby=start/dateTime`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          
          calendarCache = {
            mock: false,
            events: calendarResponse.data.value.map((ev: any) => ({
              subject: ev.subject,
              start: ev.start.dateTime,
              end: ev.end.dateTime,
              location: ev.location?.displayName || "N/A",
              isAllDay: ev.isAllDay || false
            })),
            lastSync: new Date().toISOString(),
            isSyncing: false,
            error: null
          };
        } catch (calErr: any) {
          console.error("Calendar Sync Error:", calErr.message);
          calendarCache.error = calErr.message;
          calendarCache.isSyncing = false;
        }
      }

      // 3. Fetch Users (Increasing limit to 600, filtering for enabled Members to exclude Shared Mailboxes/Guests)
      const usersResponse = await axios.get(
        "https://graph.microsoft.com/v1.0/users?$top=600&$select=id,displayName,userPrincipalName&$filter=accountEnabled eq true and userType eq 'Member'",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const users = usersResponse.data.value;

      // 3. Batch Fetch OOO status in chunks of 20 (Graph limit)
      const allResults: any[] = [];
      const chunks = [];
      for (let i = 0; i < users.length; i += 20) {
        chunks.push(users.slice(i, i + 20));
      }

      for (const chunk of chunks) {
        const batchRequests = chunk.map((user: any) => ({
          id: user.id, // Use user ID as batch ID for direct mapping
          method: "GET",
          url: `/users/${user.id}/mailboxSettings/automaticRepliesSetting`
        }));

        try {
          const batchResponse = await axios.post(
            "https://graph.microsoft.com/v1.0/$batch",
            { requests: batchRequests },
            { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
          );
          allResults.push(...batchResponse.data.responses);
        } catch (batchErr: any) {
          console.error("Batch Request Chunk Error:", batchErr.message);
        }
      }

      const now = new Date();
      const combinedUsers = users.map((user: any) => {
        const batchItem = allResults.find((r: any) => r.id === user.id);
        // Only return OOO if the response was successful and status is enabled
        const ooo = batchItem?.status === 200 ? batchItem.body : {};
        
        let isOOO = false;
        let returnDate = null;

        if (ooo.status === "alwaysEnabled") {
          isOOO = true;
          returnDate = ooo.scheduledEndDateTime?.dateTime || null;
        } else if (ooo.status === "scheduled") {
          const start = new Date(ooo.scheduledStartDateTime?.dateTime);
          const end = new Date(ooo.scheduledEndDateTime?.dateTime);
          // Current OOO if we are within the window
          if (now >= start && now <= end) {
            isOOO = true;
            returnDate = ooo.scheduledEndDateTime?.dateTime;
          }
        }
        
        return {
          id: user.id,
          name: user.displayName,
          status: isOOO ? "Out of Office" : "Available",
          returnDate: returnDate,
          avatar: user.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
        };
      });

      oooCache = {
        mock: false,
        users: combinedUsers,
        lastSync: new Date().toISOString(),
        isSyncing: false,
        error: null
      };
    } catch (error: any) {
      console.error("Exchange Background Sync Error:", error.message);
      oooCache.error = error.message;
      oooCache.isSyncing = false;
    }
  }

  // Initial sync and set interval
  syncExchange();
  setInterval(syncExchange, EXCHANGE_SYNC_INTERVAL);

  // Exchange Online Proxy returns the cache instantly
  app.get("/api/exchange/ooo", (req, res) => {
    res.json(oooCache);
  });

  let PUSHED_SERVICES: any[] = [];

  app.get("/api/exchange/calendar", (req, res) => {
    res.json(calendarCache);
  });

  app.get("/api/streams", (req, res) => {
    res.json(STREAMS_CONFIG.map((s, i) => ({
      id: `stream-${i}`,
      ...s,
      status: Math.random() > 0.1 ? "online" : "offline"
    })));
  });

  app.post("/api/services/update", (req, res) => {
    const { services, secret } = req.body;
    const expectedSecret = process.env.HYPERV_UPDATE_SECRET;
    
    console.log(`[SERVICE UPDATE] Incoming from ${req.ip}. Secret provided: ${secret ? 'YES' : 'NO'}`);

    // Auth check: Always check if secret is set in .env
    if (!expectedSecret) {
      console.error("[SERVICE UPDATE] HYPERV_UPDATE_SECRET is not set in .env! Rejecting all updates.");
      return res.status(500).json({ error: "Server configuration error" });
    }

    if (secret !== expectedSecret) {
      console.warn(`[SERVICE UPDATE] Unauthorized attempt. Expected: ${expectedSecret}, Received: ${secret}`);
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (Array.isArray(services)) {
      PUSHED_SERVICES = services.map((s, i) => {
        // Map common Windows service states to dashboard 'online'/'offline'
        const rawStatus = String(s.status || "").toLowerCase();
        const isOnline = ["running", "online", "started", "active", "startpending"].includes(rawStatus);
        
        return {
          id: s.id || `pushed-${i}`,
          name: s.name,
          status: isOnline ? "online" : "offline",
          rawStatus: s.status, // Keep original for reference
          lastUpdate: new Date().toISOString()
        };
      });
      console.log(`[SERVICE UPDATE] Successfully updated ${services.length} services.`);
      res.json({ status: "success", received: services.length });
    } else {
      console.error("[SERVICE UPDATE] Invalid data format received.");
      res.status(400).json({ error: "Invalid format" });
    }
  });

  app.get("/api/watchdog", async (req, res) => {
    const internalServices = await Promise.all(
      WATCHDOG_CONFIG.map(async (service, i) => {
        let status = false;
        try {
          if (service.port) {
            status = await checkService(service.host, service.port, 2000);
          } else {
             const result = await ping.promise.probe(service.host, {
              timeout: 2,
              extra: ["-c", "1"]
            });
            status = result.alive;
          }
        } catch (e) {
          status = false;
        }
        return {
          id: `wd-${i}`,
          ...service,
          status: status ? "online" : "offline"
        };
      })
    );
    
    // Combine with pushed services
    res.json([...internalServices, ...PUSHED_SERVICES]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: "0.0.0.0", // Ensure Vite-served assets are accessible via IP 
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Access remotely at http://<your-pi-ip>:${PORT}`);
  });
}

startServer();
