import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import ping from "ping";

dotenv.config();

// Video Streams Configuration (HLS .m3u8)
const STREAMS_CONFIG = [
  { name: "Chamber 1", url: "https://5ea8aa5cf299b.streamlock.net/HACOM/hacom/playlist.m3u8" },
  { name: "Chamber 2", url: "https://5ea8aa5cf299b.streamlock.net/HACOM/hacom/playlist.m3u8" },
  { name: "Lobby Entry", url: "https://5ea8aa5cf299b.streamlock.net/HACOM/hacom/playlist.m3u8" },
  { name: "Public Gallery", url: "https://5ea8aa5cf299b.streamlock.net/HACOM/hacom/playlist.m3u8" },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CONFIGURATION: Add your 36 gateway names and IP addresses here
  const SITE_CONFIG = [
    { name: "Hobart Primary", url: "8.8.8.8", location: "South" },
    { name: "Launceston North", url: "1.1.1.1", location: "North" },
    // Add additional sites here...
  ];

  // Helper to ensure we have a full grid of 36 for the kiosk display
  const getSites = () => {
    if (SITE_CONFIG.length >= 36) return SITE_CONFIG.map((s, i) => ({ ...s, id: `gw-${i}` }));
    
    const prefixes = ["Hobart", "Launceston", "Burnie", "Sorell", "Kingston", "Wynyard"];
    return Array.from({ length: 36 }).map((_, i) => {
      const config = SITE_CONFIG[i];
      return {
        id: `gateway-${i + 1}`,
        name: config?.name || `${prefixes[i % prefixes.length]} Gateway ${Math.floor(i / prefixes.length) + 1}`,
        url: config?.url || "https://google.com",
        location: config?.location || (i < 10 ? "Metropolitan" : "Regional Tasmania")
      };
    });
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

  // Exchange Online (Microsoft Graph) OOO Status Proxy
  app.get("/api/exchange/ooo", async (req, res) => {
    const { EXCHANGE_TENANT_ID, EXCHANGE_CLIENT_ID, EXCHANGE_CLIENT_SECRET, EXCHANGE_USER_PRINCIPAL_NAME } = process.env;

    if (!EXCHANGE_TENANT_ID || !EXCHANGE_CLIENT_ID || !EXCHANGE_CLIENT_SECRET) {
      // Mock data if credentials missing
      return res.json({
        mock: true,
        users: [
          { name: "Support Manager", status: "Out of Office", returnDate: "Tomorrow", avatar: "SM" },
          { name: "Network Lead", status: "Available", returnDate: null, avatar: "NL" },
          { name: "Field Tech", status: "On Site", returnDate: "16:00", avatar: "FT" },
        ]
      });
    }

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

      // 2. Fetch OOO status for the configured user or a set of users
      // This is a simplified example fetching mailbox settings for one user
      const upn = EXCHANGE_USER_PRINCIPAL_NAME || "user@domain.com";
      const graphResponse = await axios.get(
        `https://graph.microsoft.com/v1.0/users/${upn}/mailboxSettings/automaticRepliesSetting`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const ooo = graphResponse.data;
      res.json({
        mock: false,
        status: ooo.status === "alwaysEnabled" || ooo.status === "scheduled" ? "Out of Office" : "Available",
        details: ooo
      });
    } catch (error: any) {
      console.error("Exchange API Error:", error.message);
      res.status(500).json({ error: error.message, mock: true });
    }
  });

  app.get("/api/streams", (req, res) => {
    res.json(STREAMS_CONFIG.map((s, i) => ({
      id: `stream-${i}`,
      ...s,
      status: Math.random() > 0.1 ? "online" : "offline"
    })));
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
