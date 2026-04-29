import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CONFIGURATION: Add your 36 gateway names and IP addresses here
  const SITE_CONFIG = [
    { name: "Hobart Primary", url: "https://google.com", location: "South" },
    { name: "Launceston North", url: "https://github.com", location: "North" },
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
          const start = Date.now();
          await axios.get(site.url, { timeout: 3000 });
          return { ...site, status: "online", latency: Date.now() - start };
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
